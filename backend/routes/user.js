const express = require('express');
const { pool } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { getUserVIP } = require('../services/vipService');

const router = express.Router();

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const [users] = await pool.query(
            `SELECT id, email, username, balance, pending_balance, total_earned, today_earned,
                    referral_code, status, email_verified, created_at
             FROM users WHERE id = ?`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = users[0];
        const vip = await getUserVIP(req.user.id);

        res.json({
            ...user,
            balance: parseFloat(user.balance),
            pending_balance: parseFloat(user.pending_balance),
            total_earned: parseFloat(user.total_earned),
            today_earned: parseFloat(user.today_earned),
            vip: vip ? {
                name: vip.name,
                expiresAt: vip.expires_at,
                earningBonus: parseFloat(vip.earning_bonus),
                badgeColor: vip.badge_color
            } : null
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

// Get dashboard stats
router.get('/dashboard', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        // Get user data
        const [users] = await pool.query(
            `SELECT balance, pending_balance, total_earned, today_earned FROM users WHERE id = ?`,
            [userId]
        );

        // Get VIP status
        const vip = await getUserVIP(userId);

        // Get active tasks count
        const [taskCount] = await pool.query(
            `SELECT COUNT(*) as count FROM tasks 
             WHERE status = 'active' 
             AND id NOT IN (
                 SELECT task_id FROM task_locks WHERE user_id = ? AND unlock_at > NOW()
             )`,
            [userId]
        );

        // Get today's completions
        const [todayCompletions] = await pool.query(
            `SELECT COUNT(*) as count FROM task_completions 
             WHERE user_id = ? AND DATE(last_completed_at) = CURDATE()`,
            [userId]
        );

        // Get referral count
        const [referralCount] = await pool.query(
            'SELECT COUNT(*) as count FROM referrals WHERE referrer_id = ?',
            [userId]
        );

        // Get unread notifications
        const [notifications] = await pool.query(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );

        // Get recent earnings
        const [recentEarnings] = await pool.query(
            `SELECT source_type, SUM(amount) as total FROM earnings_logs 
             WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
             GROUP BY source_type`,
            [userId]
        );

        res.json({
            balance: parseFloat(users[0].balance),
            pendingBalance: parseFloat(users[0].pending_balance),
            totalEarned: parseFloat(users[0].total_earned),
            todayEarned: parseFloat(users[0].today_earned),
            isVIP: !!vip,
            vip: vip ? {
                name: vip.name,
                expiresAt: vip.expires_at,
                earningBonus: parseFloat(vip.earning_bonus),
                badgeColor: vip.badge_color
            } : null,
            availableTasks: taskCount[0].count,
            completedToday: todayCompletions[0].count,
            referralCount: referralCount[0].count,
            unreadNotifications: notifications[0].count,
            weeklyEarnings: recentEarnings.reduce((acc, e) => {
                acc[e.source_type] = parseFloat(e.total);
                return acc;
            }, {})
        });

    } catch (error) {
        console.error('Get dashboard error:', error);
        res.status(500).json({ error: 'Failed to get dashboard data' });
    }
});

// Update profile
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { username } = req.body;

        if (!username || username.length < 2) {
            return res.status(400).json({ error: 'Username must be at least 2 characters' });
        }

        await pool.query(
            'UPDATE users SET username = ? WHERE id = ?',
            [username.trim(), req.user.id]
        );

        res.json({ message: 'Profile updated successfully' });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Get daily limits status
router.get('/daily-limits', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        // Get settings
        const [settings] = await pool.query('SELECT * FROM site_settings');
        const settingsObj = {
            dailyTaskLimit: 6,
            dailyOfferLimit: 1,
            cooldownHours: 12,
            vipUnlimited: true,
        };

        settings.forEach(s => {
            if (s.setting_key === 'daily_task_limit') settingsObj.dailyTaskLimit = parseInt(s.setting_value);
            if (s.setting_key === 'daily_offer_limit') settingsObj.dailyOfferLimit = parseInt(s.setting_value);
            if (s.setting_key === 'cooldown_hours') settingsObj.cooldownHours = parseInt(s.setting_value);
            if (s.setting_key === 'vip_unlimited') settingsObj.vipUnlimited = s.setting_value === 'true';
        });

        // Check if user is VIP
        const vip = await getUserVIP(userId);
        if (vip && settingsObj.vipUnlimited) {
            return res.json({
                isVIP: true,
                unlimited: true,
                tasksCompleted: 0,
                taskLimit: settingsObj.dailyTaskLimit,
                offersCompleted: 0,
                offerLimit: settingsObj.dailyOfferLimit,
                isLocked: false,
                cooldownUntil: null,
                timeRemaining: null
            });
        }

        // Check cooldown
        const [cooldownCheck] = await pool.query(
            `SELECT cooldown_until, tasks_completed, offers_completed FROM user_daily_limits 
             WHERE user_id = ? AND DATE(reset_date) = CURDATE()`,
            [userId]
        );

        let isLocked = false;
        let cooldownUntil = null;
        let timeRemaining = null;
        let tasksCompleted = 0;
        let offersCompleted = 0;

        if (cooldownCheck.length > 0) {
            tasksCompleted = cooldownCheck[0].tasks_completed || 0;
            offersCompleted = cooldownCheck[0].offers_completed || 0;

            if (cooldownCheck[0].cooldown_until) {
                const cooldownTime = new Date(cooldownCheck[0].cooldown_until);
                if (cooldownTime > new Date()) {
                    isLocked = true;
                    cooldownUntil = cooldownTime.toISOString();

                    const diff = cooldownTime - new Date();
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                    timeRemaining = { hours, minutes, seconds };
                }
            }
        }

        // Count today's completions if not from user_daily_limits
        if (!cooldownCheck.length) {
            const [tasksToday] = await pool.query(
                `SELECT COUNT(*) as count FROM earnings_logs 
                 WHERE user_id = ? AND DATE(created_at) = CURDATE() AND source_type = 'task'`,
                [userId]
            );
            tasksCompleted = parseInt(tasksToday[0].count);
        }

        res.json({
            isVIP: false,
            unlimited: false,
            tasksCompleted,
            taskLimit: settingsObj.dailyTaskLimit,
            offersCompleted,
            offerLimit: settingsObj.dailyOfferLimit,
            isLocked,
            cooldownUntil,
            timeRemaining,
            cooldownHours: settingsObj.cooldownHours
        });

    } catch (error) {
        console.error('Get daily limits error:', error);
        res.status(500).json({ error: 'Failed to get daily limits' });
    }
});

module.exports = router;

