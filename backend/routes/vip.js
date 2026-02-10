const express = require('express');
const multer = require('multer');
const path = require('path');
const { pool } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { getUserVIP } = require('../services/vipService');

const router = express.Router();

// Configure multer for screenshot uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/vip-screenshots');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    }
});

// Get all VIP plans
router.get('/plans', async (req, res) => {
    try {
        const [plans] = await pool.query(
            `SELECT id, name, description, price, duration_days, earning_bonus, 
                    fee_discount, min_withdrawal, priority_payout, ad_free, badge_color
             FROM vip_plans WHERE status = 'active' ORDER BY price ASC`
        );

        res.json(plans.map(plan => ({
            ...plan,
            price: parseFloat(plan.price),
            earningBonus: parseFloat(plan.earning_bonus),
            feeDiscount: parseFloat(plan.fee_discount),
            minWithdrawal: parseFloat(plan.min_withdrawal)
        })));

    } catch (error) {
        console.error('Get VIP plans error:', error);
        res.status(500).json({ error: 'Failed to get VIP plans' });
    }
});

// Get user's VIP status
router.get('/status', authMiddleware, async (req, res) => {
    try {
        const vip = await getUserVIP(req.user.id);

        if (!vip) {
            return res.json({ isVIP: false });
        }

        res.json({
            isVIP: true,
            name: vip.name,
            expiresAt: vip.expires_at,
            earningBonus: parseFloat(vip.earning_bonus),
            feeDiscount: parseFloat(vip.fee_discount),
            minWithdrawal: parseFloat(vip.min_withdrawal),
            priorityPayout: vip.priority_payout,
            adFree: vip.ad_free,
            badgeColor: vip.badge_color
        });

    } catch (error) {
        console.error('Get VIP status error:', error);
        res.status(500).json({ error: 'Failed to get VIP status' });
    }
});

// Submit VIP subscription request with screenshot
router.post('/subscribe', authMiddleware, upload.single('screenshot'), async (req, res) => {
    try {
        const { planId, paymentMethod, transactionId } = req.body;
        const userId = req.user.id;

        if (!planId) {
            return res.status(400).json({ error: 'Plan ID is required' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Payment screenshot is required' });
        }

        // Get plan
        const [plans] = await pool.query(
            'SELECT * FROM vip_plans WHERE id = ? AND status = "active"',
            [planId]
        );

        if (plans.length === 0) {
            return res.status(404).json({ error: 'VIP plan not found' });
        }

        const plan = plans[0];

        // Check if user already has pending request
        const [pending] = await pool.query(
            'SELECT id FROM vip_requests WHERE user_id = ? AND status = "pending"',
            [userId]
        );

        if (pending.length > 0) {
            return res.status(400).json({ error: 'You already have a pending VIP request' });
        }

        // Create VIP request
        await pool.query(
            `INSERT INTO vip_requests (user_id, plan_id, amount, payment_method, transaction_id, screenshot_path, status)
             VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
            [userId, planId, plan.price, paymentMethod, transactionId || null, req.file.filename]
        );

        // Create notification for user
        await pool.query(
            `INSERT INTO notifications (user_id, title, message, type)
             VALUES (?, 'VIP Request Submitted', 'Your VIP subscription request has been submitted and is awaiting approval.', 'info')`,
            [userId]
        );

        res.json({
            success: true,
            message: 'VIP subscription request submitted! It will be reviewed within 2 hours.'
        });

    } catch (error) {
        console.error('VIP subscribe error:', error);
        res.status(500).json({ error: 'Failed to submit VIP request' });
    }
});

// Get user's VIP requests
router.get('/my-requests', authMiddleware, async (req, res) => {
    try {
        const [requests] = await pool.query(
            `SELECT vr.id, vr.amount, vr.payment_method, vr.status, vr.created_at, vr.admin_notes,
                    vp.name as plan_name, vp.duration_days, vp.earning_bonus
             FROM vip_requests vr
             JOIN vip_plans vp ON vr.plan_id = vp.id
             WHERE vr.user_id = ?
             ORDER BY vr.created_at DESC`,
            [req.user.id]
        );

        res.json(requests);

    } catch (error) {
        console.error('Get VIP requests error:', error);
        res.status(500).json({ error: 'Failed to get VIP requests' });
    }
});

// Get VIP history
router.get('/history', authMiddleware, async (req, res) => {
    try {
        const [history] = await pool.query(
            `SELECT uv.*, vp.name, vp.earning_bonus, vp.price
             FROM user_vip uv
             JOIN vip_plans vp ON uv.plan_id = vp.id
             WHERE uv.user_id = ?
             ORDER BY uv.created_at DESC`,
            [req.user.id]
        );

        res.json(history.map(h => ({
            id: h.id,
            planName: h.name,
            price: parseFloat(h.price),
            earningBonus: parseFloat(h.earning_bonus),
            startedAt: h.started_at,
            expiresAt: h.expires_at,
            status: h.status
        })));

    } catch (error) {
        console.error('Get VIP history error:', error);
        res.status(500).json({ error: 'Failed to get VIP history' });
    }
});

module.exports = router;
