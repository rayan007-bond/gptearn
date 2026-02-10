const express = require('express');
const { pool } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { checkDailyLimit, checkSuspiciousActivity } = require('../middleware/security');
const { calculateEarningsWithVIP } = require('../services/vipService');
const { getTimeRemaining } = require('../utils/helpers');

const router = express.Router();

// Get all available tasks
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { type } = req.query;

        let query = `
            SELECT t.*, 
                   COALESCE(tc.completion_count, 0) as user_completions,
                   tl.unlock_at
            FROM tasks t
            LEFT JOIN task_completions tc ON t.id = tc.task_id AND tc.user_id = ?
            LEFT JOIN task_locks tl ON t.id = tl.task_id AND tl.user_id = ?
            WHERE t.status = 'active'
        `;

        const params = [userId, userId];

        if (type) {
            query += ' AND t.task_type = ?';
            params.push(type);
        }

        query += ' ORDER BY t.reward DESC';

        const [tasks] = await pool.query(query, params);

        // Process tasks to add lock status
        const processedTasks = tasks.map(task => {
            const isLocked = task.unlock_at && new Date(task.unlock_at) > new Date();
            const maxReached = task.user_completions >= task.max_completions_per_user;

            return {
                id: task.id,
                title: task.title,
                description: task.description,
                taskLink: task.task_link,
                reward: parseFloat(task.reward),
                maxCompletions: task.max_completions_per_user,
                cooldownHours: task.cooldown_hours,
                taskType: task.task_type,
                icon: task.icon,
                userCompletions: task.user_completions,
                isLocked,
                maxReached,
                unlockAt: task.unlock_at,
                unlockAt: task.unlock_at,
                timeRemaining: isLocked ? getTimeRemaining(task.unlock_at) : null,
                requiresAnswer: !!task.correct_answer
            };
        });

        res.json(processedTasks);

    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ error: 'Failed to get tasks' });
    }
});

// Get task by ID
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const [tasks] = await pool.query(
            `SELECT t.*, 
                    COALESCE(tc.completion_count, 0) as user_completions,
                    tl.unlock_at
             FROM tasks t
             LEFT JOIN task_completions tc ON t.id = tc.task_id AND tc.user_id = ?
             LEFT JOIN task_locks tl ON t.id = tl.task_id AND tl.user_id = ?
             WHERE t.id = ?`,
            [userId, userId, id]
        );

        if (tasks.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const task = tasks[0];
        const isLocked = task.unlock_at && new Date(task.unlock_at) > new Date();
        const maxReached = task.user_completions >= task.max_completions_per_user;

        res.json({
            id: task.id,
            title: task.title,
            description: task.description,
            taskLink: task.task_link,
            reward: parseFloat(task.reward),
            maxCompletions: task.max_completions_per_user,
            cooldownHours: task.cooldown_hours,
            taskType: task.task_type,
            icon: task.icon,
            userCompletions: task.user_completions,
            isLocked,
            maxReached,
            unlockAt: task.unlock_at,
            unlockAt: task.unlock_at,
            timeRemaining: isLocked ? getTimeRemaining(task.unlock_at) : null,
            requiresAnswer: !!task.correct_answer
        });

    } catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({ error: 'Failed to get task' });
    }
});

// Complete a task
router.post('/:id/complete', authMiddleware, checkDailyLimit, checkSuspiciousActivity, async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const userId = req.user.id;

        // Get task
        const [tasks] = await connection.query(
            'SELECT * FROM tasks WHERE id = ? AND status = "active"',
            [id]
        );

        if (tasks.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Task not found or inactive' });
        }

        const task = tasks[0];

        // Verify answer if required
        if (task.correct_answer) {
            const userAnswer = req.body.answer;
            if (!userAnswer || userAnswer.trim().toLowerCase() !== task.correct_answer.trim().toLowerCase()) {
                await connection.rollback();
                return res.status(400).json({ error: 'Incorrect answer. Please verify and try again.' });
            }
        }

        // Check if locked
        const [locks] = await connection.query(
            'SELECT unlock_at FROM task_locks WHERE user_id = ? AND task_id = ? AND unlock_at > NOW()',
            [userId, id]
        );

        if (locks.length > 0) {
            await connection.rollback();
            return res.status(403).json({
                error: 'Task is locked',
                unlockAt: locks[0].unlock_at,
                timeRemaining: getTimeRemaining(locks[0].unlock_at)
            });
        }

        // Check completion count
        const [completions] = await connection.query(
            'SELECT completion_count FROM task_completions WHERE user_id = ? AND task_id = ?',
            [userId, id]
        );

        const currentCount = completions.length > 0 ? completions[0].completion_count : 0;

        if (currentCount >= task.max_completions_per_user) {
            await connection.rollback();
            return res.status(403).json({
                error: 'Maximum completions reached for this task',
                maxCompletions: task.max_completions_per_user,
                currentCompletions: currentCount
            });
        }

        // Calculate reward with VIP bonus
        const { amount: reward, bonus, isVIP, bonusPercentage } = await calculateEarningsWithVIP(userId, parseFloat(task.reward));

        // Update or insert completion record
        if (completions.length > 0) {
            await connection.query(
                'UPDATE task_completions SET completion_count = completion_count + 1, last_completed_at = NOW() WHERE user_id = ? AND task_id = ?',
                [userId, id]
            );
        } else {
            await connection.query(
                'INSERT INTO task_completions (user_id, task_id, completion_count) VALUES (?, ?, 1)',
                [userId, id]
            );
        }

        // Create or update lock
        const unlockAt = new Date(Date.now() + task.cooldown_hours * 60 * 60 * 1000);
        await connection.query(
            `INSERT INTO task_locks (user_id, task_id, unlock_at) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE unlock_at = ?`,
            [userId, id, unlockAt, unlockAt]
        );

        // Update user balance
        await connection.query(
            'UPDATE users SET balance = balance + ?, total_earned = total_earned + ?, today_earned = today_earned + ? WHERE id = ?',
            [reward, reward, reward, userId]
        );

        // Log earning
        await connection.query(
            'INSERT INTO earnings_logs (user_id, amount, source_type, source_id, description) VALUES (?, ?, "task", ?, ?)',
            [userId, reward, id, `Completed: ${task.title}`]
        );

        // Update task total completions
        await connection.query(
            'UPDATE tasks SET total_completions = total_completions + 1 WHERE id = ?',
            [id]
        );

        // Handle referral commission
        const [referrer] = await connection.query(
            `SELECT r.referrer_id, r.commission_rate FROM referrals r
             JOIN users u ON r.referrer_id = u.id
             WHERE r.referred_id = ? AND r.is_active = TRUE AND u.status = 'active'`,
            [userId]
        );

        if (referrer.length > 0) {
            const commission = reward * (parseFloat(referrer[0].commission_rate) / 100);

            await connection.query(
                'UPDATE users SET balance = balance + ?, total_earned = total_earned + ? WHERE id = ?',
                [commission, commission, referrer[0].referrer_id]
            );

            await connection.query(
                'UPDATE referrals SET total_commission_earned = total_commission_earned + ? WHERE referrer_id = ? AND referred_id = ?',
                [commission, referrer[0].referrer_id, userId]
            );

            await connection.query(
                'INSERT INTO earnings_logs (user_id, amount, source_type, source_id, description) VALUES (?, ?, "referral", ?, ?)',
                [referrer[0].referrer_id, commission, userId, `Referral commission from task`]
            );
        }

        await connection.commit();

        res.json({
            success: true,
            reward,
            bonus,
            isVIP,
            bonusPercentage,
            message: `You earned $${reward.toFixed(2)}!`,
            newCompletionCount: currentCount + 1,
            maxCompletions: task.max_completions_per_user,
            unlockAt,
            timeRemaining: getTimeRemaining(unlockAt)
        });

    } catch (error) {
        await connection.rollback();
        console.error('Complete task error:', error);
        res.status(500).json({ error: 'Failed to complete task' });
    } finally {
        connection.release();
    }
});

// Get task status for user
router.get('/:id/status', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const [status] = await pool.query(
            `SELECT tc.completion_count, tl.unlock_at, t.max_completions_per_user
             FROM tasks t
             LEFT JOIN task_completions tc ON t.id = tc.task_id AND tc.user_id = ?
             LEFT JOIN task_locks tl ON t.id = tl.task_id AND tl.user_id = ?
             WHERE t.id = ?`,
            [userId, userId, id]
        );

        if (status.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const data = status[0];
        const isLocked = data.unlock_at && new Date(data.unlock_at) > new Date();
        const completions = data.completion_count || 0;

        res.json({
            completions,
            maxCompletions: data.max_completions_per_user,
            isLocked,
            maxReached: completions >= data.max_completions_per_user,
            unlockAt: data.unlock_at,
            timeRemaining: isLocked ? getTimeRemaining(data.unlock_at) : null
        });

    } catch (error) {
        console.error('Get task status error:', error);
        res.status(500).json({ error: 'Failed to get task status' });
    }
});

module.exports = router;
