const cron = require('node-cron');
const { pool } = require('../config/database');

const jobs = {
    start: () => {
        // Reset daily earnings at midnight
        cron.schedule('0 0 * * *', async () => {
            try {
                console.log('🔄 Resetting daily earnings...');
                await pool.query('UPDATE users SET today_earned = 0');
                console.log('✅ Daily earnings reset complete');
            } catch (error) {
                console.error('❌ Failed to reset daily earnings:', error);
            }
        });

        // Clean expired task locks and notify users (every minute)
        cron.schedule('* * * * *', async () => {
            try {
                // Find locks that are about to expire
                const [locks] = await pool.query(
                    `SELECT tl.user_id, t.title 
                     FROM task_locks tl 
                     JOIN tasks t ON tl.task_id = t.id 
                     WHERE tl.unlock_at < NOW()`
                );

                if (locks.length > 0) {
                    console.log(`🔔 Notifying ${locks.length} users about unlocked tasks`);

                    // Create notifications
                    for (const lock of locks) {
                        await pool.query(
                            `INSERT INTO notifications (user_id, title, message, type)
                             VALUES (?, 'Task Available', ?, 'info')`,
                            [lock.user_id, `Task "${lock.title}" is ready for you again!`]
                        );
                    }

                    // Delete locks
                    await pool.query('DELETE FROM task_locks WHERE unlock_at < NOW()');
                }
            } catch (error) {
                console.error('❌ Failed to clean task locks:', error);
            }
        });

        // Expire VIP subscriptions (every hour)
        cron.schedule('0 * * * *', async () => {
            try {
                console.log('🔄 Checking expired VIP subscriptions...');
                const [result] = await pool.query(
                    `UPDATE user_vip SET status = 'expired' 
                     WHERE status = 'active' AND expires_at < NOW()`
                );

                if (result.affectedRows > 0) {
                    console.log(`✅ Expired ${result.affectedRows} VIP subscriptions`);
                }
            } catch (error) {
                console.error('❌ Failed to expire VIP subscriptions:', error);
            }
        });

        // Clean old login logs (weekly)
        cron.schedule('0 0 * * 0', async () => {
            try {
                console.log('🔄 Cleaning old login logs...');
                const [result] = await pool.query(
                    'DELETE FROM login_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)'
                );
                console.log(`✅ Cleaned ${result.affectedRows} old login logs`);
            } catch (error) {
                console.error('❌ Failed to clean login logs:', error);
            }
        });

        // Mark completed withdrawals and notify (every 5 minutes)
        cron.schedule('*/5 * * * *', async () => {
            try {
                // Get approved withdrawals that should be marked as completed
                const [withdrawals] = await pool.query(
                    `SELECT id, user_id, amount, net_amount 
                     FROM withdrawals 
                     WHERE status = 'approved' 
                     AND processed_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)`
                );

                if (withdrawals.length > 0) {
                    console.log(`💰 Completing ${withdrawals.length} withdrawals...`);

                    for (const w of withdrawals) {
                        // Update status
                        await pool.query(
                            `UPDATE withdrawals SET status = 'completed', updated_at = NOW() WHERE id = ?`,
                            [w.id]
                        );

                        // Send Dashboard Notification ONLY (No email as requested for timeout/completion)
                        await pool.query(
                            `INSERT INTO notifications (user_id, title, message, type)
                             VALUES (?, 'Withdrawal Completed', ?, 'success')`,
                            [w.user_id, `Your withdrawal of $${parseFloat(w.net_amount).toFixed(2)} has been successfully completed!`]
                        );
                    }
                    console.log(`✅ Completed ${withdrawals.length} withdrawals`);
                }
            } catch (error) {
                console.error('❌ Failed to complete withdrawals:', error);
            }
        });

        console.log('⏰ Cron jobs started');
    }
};

module.exports = jobs;
