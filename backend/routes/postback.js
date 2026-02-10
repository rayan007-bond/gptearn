/**
 * Offerwall Postback Handler
 * Secure endpoint for receiving and processing offerwall callbacks
 */

const express = require('express');
const crypto = require('crypto');
const { pool } = require('../config/database');
const { getClientIP } = require('../utils/helpers');

const router = express.Router();

/**
 * Network-specific postback configurations
 * Each network has different parameter names and signature methods
 */
const networkConfigs = {
    adgate: {
        userIdParam: 'user_id',
        amountParam: 'points',
        transactionIdParam: 'tx_id',
        offerIdParam: 'offer_id',
        offerNameParam: 'offer_name',
        signatureParam: 'signature',
        // AdGate: signature = md5(tx_id + user_id + secret)
        generateSignature: (params, secret) => {
            const data = `${params.tx_id}${params.user_id}${secret}`;
            return crypto.createHash('md5').update(data).digest('hex');
        }
    },
    cpx: {
        userIdParam: 'user_id',
        amountParam: 'amount_usd',
        transactionIdParam: 'trans_id',
        offerIdParam: 'offer_id',
        offerNameParam: 'offer_name',
        signatureParam: 'hash',
        // CPX: hash = md5(trans_id + user_id + amount_usd + secret)
        generateSignature: (params, secret) => {
            const data = `${params.trans_id}${params.user_id}${params.amount_usd}${secret}`;
            return crypto.createHash('md5').update(data).digest('hex');
        }
    },
    timewall: {
        userIdParam: 'sub_id',
        amountParam: 'reward',
        transactionIdParam: 'id',
        offerIdParam: 'campaign_id',
        offerNameParam: 'campaign_name',
        signatureParam: 'sig',
        // TimeWall: sig = sha256(id + sub_id + reward + secret)
        generateSignature: (params, secret) => {
            const data = `${params.id}${params.sub_id}${params.reward}${secret}`;
            return crypto.createHash('sha256').update(data).digest('hex');
        }
    },
    offertoro: {
        userIdParam: 'user_id',
        amountParam: 'amount',
        transactionIdParam: 'oid',
        offerIdParam: 'offer_id',
        offerNameParam: 'offer_name',
        signatureParam: 'sig',
        // OfferToro: sig = md5(oid + secret)
        generateSignature: (params, secret) => {
            const data = `${params.oid}${secret}`;
            return crypto.createHash('md5').update(data).digest('hex');
        }
    },
    lootably: {
        userIdParam: 'sid',
        amountParam: 'payout',
        transactionIdParam: 'conversion_id',
        offerIdParam: 'offer_id',
        offerNameParam: 'offer_name',
        signatureParam: 'hash',
        // Lootably: hash = sha256(conversion_id + sid + payout + secret)
        generateSignature: (params, secret) => {
            const data = `${params.conversion_id}${params.sid}${params.payout}${secret}`;
            return crypto.createHash('sha256').update(data).digest('hex');
        }
    }
};

/**
 * Main postback endpoint
 * GET /postback/:network
 */
router.get('/:network', async (req, res) => {
    const { network } = req.params;
    const networkLower = network.toLowerCase();
    const ipAddress = getClientIP(req);
    const userAgent = req.headers['user-agent'] || '';

    console.log(`[POSTBACK] Received from ${networkLower}:`, req.query);

    try {
        // 1. Get network configuration from database
        const [networks] = await pool.query(
            'SELECT * FROM offerwall_networks WHERE name = ? AND status != "inactive"',
            [networkLower]
        );

        if (networks.length === 0) {
            console.log(`[POSTBACK] Unknown or inactive network: ${networkLower}`);
            return res.status(400).send('0'); // Standard failure response
        }

        const networkConfig = networks[0];
        const paramConfig = networkConfigs[networkLower];

        if (!paramConfig) {
            console.log(`[POSTBACK] No config found for network: ${networkLower}`);
            return res.status(400).send('0');
        }

        // 2. Extract parameters
        const userId = req.query[paramConfig.userIdParam];
        const amount = parseFloat(req.query[paramConfig.amountParam] || 0);
        const transactionId = req.query[paramConfig.transactionIdParam];
        const offerId = req.query[paramConfig.offerIdParam] || '';
        const offerName = req.query[paramConfig.offerNameParam] || '';
        const signature = req.query[paramConfig.signatureParam];

        // 3. Basic validation
        if (!userId || !transactionId || amount <= 0) {
            await logTransaction(networkConfig.id, networkLower, null, transactionId, 0, 0, 0, ipAddress, userAgent, req.query, 'rejected', 'Missing required parameters');
            console.log(`[POSTBACK] Missing required parameters`);
            return res.status(400).send('0');
        }

        // 4. Verify signature
        const expectedSignature = paramConfig.generateSignature(req.query, networkConfig.secret_key);

        if (signature !== expectedSignature) {
            await logTransaction(networkConfig.id, networkLower, userId, transactionId, amount, 0, 0, ipAddress, userAgent, req.query, 'invalid_signature', `Expected: ${expectedSignature}, Got: ${signature}`);
            console.log(`[POSTBACK] Invalid signature. Expected: ${expectedSignature}, Got: ${signature}`);
            return res.status(403).send('0');
        }

        // 5. IP Whitelist check (if configured)
        if (networkConfig.ip_whitelist) {
            const allowedIPs = networkConfig.ip_whitelist.split(',').map(ip => ip.trim());
            if (!allowedIPs.includes(ipAddress)) {
                await logTransaction(networkConfig.id, networkLower, userId, transactionId, amount, 0, 0, ipAddress, userAgent, req.query, 'rejected', `IP not whitelisted: ${ipAddress}`);
                console.log(`[POSTBACK] IP not whitelisted: ${ipAddress}`);
                return res.status(403).send('0');
            }
        }

        // 6. Check for duplicate transaction
        const [existing] = await pool.query(
            'SELECT id FROM offerwall_transactions WHERE network_id = ? AND transaction_id = ?',
            [networkConfig.id, transactionId]
        );

        if (existing.length > 0) {
            console.log(`[POSTBACK] Duplicate transaction: ${transactionId}`);
            return res.status(200).send('1'); // Return success to prevent retries
        }

        // 7. Verify user exists
        const [users] = await pool.query(
            'SELECT id, balance, referred_by FROM users WHERE id = ? AND status = "active"',
            [userId]
        );

        if (users.length === 0) {
            await logTransaction(networkConfig.id, networkLower, userId, transactionId, amount, 0, 0, ipAddress, userAgent, req.query, 'user_not_found', 'User not found or inactive');
            console.log(`[POSTBACK] User not found: ${userId}`);
            return res.status(400).send('0');
        }

        const user = users[0];

        // 8. Calculate credited amount (apply payout percentage)
        const payoutPercent = parseFloat(networkConfig.payout_percent) / 100;
        const creditedAmount = parseFloat((amount * payoutPercent).toFixed(4));
        const adminProfit = parseFloat((amount - creditedAmount).toFixed(4));

        // 9. Start transaction
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // Credit user balance
            await connection.query(
                'UPDATE users SET balance = balance + ?, offerwall_earnings = offerwall_earnings + ? WHERE id = ?',
                [creditedAmount, creditedAmount, userId]
            );

            // Log successful transaction
            await connection.query(
                `INSERT INTO offerwall_transactions 
                (user_id, network_id, network_name, transaction_id, offer_id, offer_name, payout, credited_amount, admin_profit, ip_address, user_agent, raw_data, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'credited')`,
                [userId, networkConfig.id, networkLower, transactionId, offerId, offerName, amount, creditedAmount, adminProfit, ipAddress, userAgent, JSON.stringify(req.query)]
            );

            // Update network stats
            await connection.query(
                'UPDATE offerwall_networks SET total_earnings = total_earnings + ?, total_conversions = total_conversions + 1 WHERE id = ?',
                [amount, networkConfig.id]
            );

            // Process referral commission (if user was referred)
            if (user.referred_by) {
                const referralCommission = creditedAmount * 0.05; // 5% of credited amount

                await connection.query(
                    'UPDATE users SET balance = balance + ?, referral_earnings = referral_earnings + ? WHERE id = ?',
                    [referralCommission, referralCommission, user.referred_by]
                );

                await connection.query(
                    `INSERT INTO referral_earnings (referrer_id, referred_id, amount, source_type, source_id)
                     VALUES (?, ?, ?, 'offerwall', ?)`,
                    [user.referred_by, userId, referralCommission, transactionId]
                );
            }

            // Create notification for user
            await connection.query(
                `INSERT INTO notifications (user_id, title, message, type)
                 VALUES (?, 'Offer Completed!', ?, 'success')`,
                [userId, `You earned $${creditedAmount.toFixed(2)} from ${networkConfig.display_name}${offerName ? `: ${offerName}` : ''}`]
            );

            await connection.commit();

            console.log(`[POSTBACK] ✅ Success! User ${userId} credited $${creditedAmount} from ${networkLower}`);
            return res.status(200).send('1'); // Success response

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error(`[POSTBACK] Error processing ${networkLower}:`, error);
        return res.status(500).send('0');
    }
});

/**
 * Helper function to log transaction attempts
 */
async function logTransaction(networkId, networkName, userId, transactionId, payout, creditedAmount, adminProfit, ipAddress, userAgent, rawData, status, errorMessage) {
    try {
        await pool.query(
            `INSERT INTO offerwall_transactions 
            (user_id, network_id, network_name, transaction_id, payout, credited_amount, admin_profit, ip_address, user_agent, raw_data, status, error_message)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId || 0, networkId, networkName, transactionId || 'unknown', payout, creditedAmount, adminProfit, ipAddress, userAgent, JSON.stringify(rawData), status, errorMessage]
        );
    } catch (err) {
        console.error('[POSTBACK] Failed to log transaction:', err);
    }
}

/**
 * Test endpoint for verifying postback setup
 * GET /postback/test/:network
 */
router.get('/test/:network', async (req, res) => {
    const { network } = req.params;

    const [networks] = await pool.query(
        'SELECT id, name, display_name, status, postback_url FROM offerwall_networks WHERE name = ?',
        [network.toLowerCase()]
    );

    if (networks.length === 0) {
        return res.json({ error: 'Network not found', available: Object.keys(networkConfigs) });
    }

    const networkData = networks[0];
    const paramConfig = networkConfigs[network.toLowerCase()];

    res.json({
        network: networkData.display_name,
        status: networkData.status,
        postback_url: `${req.protocol}://${req.get('host')}/postback/${network.toLowerCase()}`,
        required_params: paramConfig ? {
            user_id: paramConfig.userIdParam,
            amount: paramConfig.amountParam,
            transaction_id: paramConfig.transactionIdParam,
            offer_id: paramConfig.offerIdParam,
            offer_name: paramConfig.offerNameParam,
            signature: paramConfig.signatureParam
        } : 'Configuration not found',
        example_url: `${req.protocol}://${req.get('host')}/postback/${network.toLowerCase()}?${paramConfig.userIdParam}=123&${paramConfig.amountParam}=0.50&${paramConfig.transactionIdParam}=TXN123&${paramConfig.signatureParam}=YOUR_HASH`
    });
});

module.exports = router;
