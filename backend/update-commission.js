// Update referral commission rate to 25%
const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateCommission() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        // Update all existing referrals to 25%
        await pool.query('UPDATE referrals SET commission_rate = 25.00');
        console.log('✅ Updated all referrals commission_rate to 25%');

        // Update system settings
        await pool.query("UPDATE system_settings SET value = '25.00' WHERE key_name = 'referral_commission_rate'");
        console.log('✅ Updated system_settings referral_commission_rate to 25%');

        // Alter table default
        await pool.query('ALTER TABLE referrals ALTER COLUMN commission_rate SET DEFAULT 25.00');
        console.log('✅ Updated referrals table default to 25%');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

updateCommission();
