const express = require('express');
const { pool } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get referral link
router.get('/link', authMiddleware, async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT referral_code FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const referralLink = `${process.env.FRONTEND_URL}/register?ref=${users[0].referral_code}`;

        res.json({
            referralCode: users[0].referral_code,
            referralLink
        });

    } catch (error) {
        console.error('Get referral link error:', error);
        res.status(500).json({ error: 'Failed to get referral link' });
    }
});

// Get referral stats
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        // Get total referrals
        const [totalReferrals] = await pool.query(
            'SELECT COUNT(*) as count FROM referrals WHERE referrer_id = ?',
            [userId]
        );

        // Get active referrals
        const [activeReferrals] = await pool.query(
            `SELECT COUNT(*) as count FROM referrals r
             JOIN users u ON r.referred_id = u.id
             WHERE r.referrer_id = ? AND r.is_active = TRUE AND u.status = 'active'`,
            [userId]
        );

        // Get total commission earned
        const [totalCommission] = await pool.query(
            'SELECT COALESCE(SUM(total_commission_earned), 0) as total FROM referrals WHERE referrer_id = ?',
            [userId]
        );

        // Get this month's commission
        const [monthlyCommission] = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) as total FROM earnings_logs 
             WHERE user_id = ? AND source_type = 'referral' 
             AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())`,
            [userId]
        );

        res.json({
            totalReferrals: totalReferrals[0].count,
            activeReferrals: activeReferrals[0].count,
            totalCommission: parseFloat(totalCommission[0].total),
            monthlyCommission: parseFloat(monthlyCommission[0].total)
        });

    } catch (error) {
        console.error('Get referral stats error:', error);
        res.status(500).json({ error: 'Failed to get referral stats' });
    }
});

// Get referral list
router.get('/list', authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const [referrals] = await pool.query(
            `SELECT r.*, u.username, u.email, u.created_at as joined_at,
                    u.status as user_status
             FROM referrals r
             JOIN users u ON r.referred_id = u.id
             WHERE r.referrer_id = ?
             ORDER BY r.created_at DESC
             LIMIT ? OFFSET ?`,
            [req.user.id, parseInt(limit), parseInt(offset)]
        );

        const [total] = await pool.query(
            'SELECT COUNT(*) as count FROM referrals WHERE referrer_id = ?',
            [req.user.id]
        );

        res.json({
            referrals: referrals.map(r => ({
                id: r.id,
                username: r.username,
                email: r.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Mask email
                joinedAt: r.joined_at,
                isActive: r.is_active,
                userStatus: r.user_status,
                commissionEarned: parseFloat(r.total_commission_earned),
                commissionRate: parseFloat(r.commission_rate)
            })),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total[0].count,
                pages: Math.ceil(total[0].count / limit)
            }
        });

    } catch (error) {
        console.error('Get referral list error:', error);
        res.status(500).json({ error: 'Failed to get referral list' });
    }
});

// Get referral commission history
router.get('/commissions', authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const [commissions] = await pool.query(
            `SELECT el.*, u.username as referral_username
             FROM earnings_logs el
             LEFT JOIN users u ON el.source_id = u.id
             WHERE el.user_id = ? AND el.source_type = 'referral'
             ORDER BY el.created_at DESC
             LIMIT ? OFFSET ?`,
            [req.user.id, parseInt(limit), parseInt(offset)]
        );

        res.json(commissions.map(c => ({
            id: c.id,
            amount: parseFloat(c.amount),
            referralUsername: c.referral_username,
            description: c.description,
            createdAt: c.created_at
        })));

    } catch (error) {
        console.error('Get referral commissions error:', error);
        res.status(500).json({ error: 'Failed to get commission history' });
    }
});

module.exports = router;
