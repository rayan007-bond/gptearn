const { pool } = require('../config/database');
const { getUserVIP } = require('../services/vipService');

// Get site settings 
const getSettings = async () => {
    try {
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

        return settingsObj;
    } catch (error) {
        return { dailyTaskLimit: 6, dailyOfferLimit: 1, cooldownHours: 12, vipUnlimited: true };
    }
};

// Check daily task/offer limit
const checkDailyLimit = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const settings = await getSettings();

        // Check if user is VIP
        const vip = await getUserVIP(userId);
        if (vip && settings.vipUnlimited) {
            req.isVIP = true;
            return next();
        }

        // Get task type from request (will be determined by the task)
        const taskId = req.params.id;
        let taskType = 'task'; // default

        if (taskId) {
            const [taskInfo] = await pool.query('SELECT task_type FROM tasks WHERE id = ?', [taskId]);
            if (taskInfo.length > 0) {
                taskType = taskInfo[0].task_type === 'offerwalls' ? 'offer' : 'task';
            }
        }

        // Check if user hit limit and set cooldown
        const [cooldownCheck] = await pool.query(
            `SELECT cooldown_until FROM user_daily_limits WHERE user_id = ? AND DATE(reset_date) = CURDATE()`,
            [userId]
        );

        if (cooldownCheck.length > 0 && cooldownCheck[0].cooldown_until) {
            const cooldownUntil = new Date(cooldownCheck[0].cooldown_until);
            if (cooldownUntil > new Date()) {
                const hoursLeft = Math.ceil((cooldownUntil - new Date()) / (1000 * 60 * 60));
                const minutesLeft = Math.ceil((cooldownUntil - new Date()) / (1000 * 60)) % 60;
                return res.status(429).json({
                    error: 'Daily limit reached. Please wait for cooldown to end.',
                    cooldownUntil: cooldownUntil.toISOString(),
                    timeRemaining: `${hoursLeft}h ${minutesLeft}m`,
                    hoursLeft,
                    minutesLeft
                });
            }
        }

        // Count today's completions
        const [tasksToday] = await pool.query(
            `SELECT COUNT(*) as count FROM earnings_logs 
             WHERE user_id = ? AND DATE(created_at) = CURDATE() AND source_type = 'task'`,
            [userId]
        );

        const [offersToday] = await pool.query(
            `SELECT COUNT(*) as count FROM earnings_logs 
             WHERE user_id = ? AND DATE(created_at) = CURDATE() AND source_type = 'task'
             AND source_id IN (SELECT id FROM tasks WHERE task_type = 'offerwalls')`,
            [userId]
        );

        const taskCount = parseInt(tasksToday[0].count);
        const offerCount = parseInt(offersToday[0].count);

        // Determine limit based on task type
        const limit = taskType === 'offer' ? settings.dailyOfferLimit : settings.dailyTaskLimit;
        const currentCount = taskType === 'offer' ? offerCount : taskCount;

        if (currentCount >= limit) {
            // Set cooldown
            const cooldownUntil = new Date(Date.now() + settings.cooldownHours * 60 * 60 * 1000);

            await pool.query(
                `INSERT INTO user_daily_limits (user_id, tasks_completed, offers_completed, cooldown_until, reset_date)
                 VALUES (?, ?, ?, ?, CURDATE())
                 ON DUPLICATE KEY UPDATE cooldown_until = ?, tasks_completed = ?, offers_completed = ?`,
                [userId, taskCount, offerCount, cooldownUntil, cooldownUntil, taskCount, offerCount]
            );

            return res.status(429).json({
                error: `Daily ${taskType} limit reached (${limit}). Cooldown started.`,
                limit,
                completed: currentCount,
                cooldownUntil: cooldownUntil.toISOString(),
                cooldownHours: settings.cooldownHours,
                timeRemaining: `${settings.cooldownHours}h 0m`
            });
        }

        // Pass limit info to next handler
        req.dailyLimits = {
            taskCount,
            offerCount,
            taskLimit: settings.dailyTaskLimit,
            offerLimit: settings.dailyOfferLimit,
            tasksRemaining: settings.dailyTaskLimit - taskCount,
            offersRemaining: settings.dailyOfferLimit - offerCount
        };

        next();
    } catch (error) {
        console.error('Daily limit check error:', error);
        next(); // Continue even if check fails
    }
};

// Check for suspicious IP (duplicate/VPN)
const checkSuspiciousActivity = async (req, res, next) => {
    try {
        const userIP = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;

        // Check for IP used by multiple accounts
        const [ipCheck] = await pool.query(
            `SELECT COUNT(DISTINCT user_id) as count FROM login_logs 
             WHERE ip_address = ? AND user_id != ? AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
            [userIP, req.user.id]
        );

        if (ipCheck[0].count > 2) {
            // Flag but don't block - admin can review
            await pool.query(
                `INSERT INTO login_logs (user_id, ip_address, user_agent, is_suspicious) VALUES (?, ?, ?, TRUE)`,
                [req.user.id, userIP, req.headers['user-agent']]
            );
        }

        next();
    } catch (error) {
        console.error('Suspicious activity check error:', error);
        next();
    }
};

module.exports = { checkDailyLimit, checkSuspiciousActivity, getSettings };
