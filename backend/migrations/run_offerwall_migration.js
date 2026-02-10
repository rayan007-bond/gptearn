/**
 * Offerwall Migration Runner - Fixed version
 * Creates offerwall_networks and offerwall_transactions tables
 */

require('dotenv').config();
const { pool } = require('../config/database');

async function runMigration() {
    try {
        console.log('🔄 Running offerwall migration...');

        // Create offerwall_networks table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS offerwall_networks (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(50) NOT NULL UNIQUE,
                display_name VARCHAR(100) NOT NULL,
                description TEXT,
                logo_url VARCHAR(500),
                secret_key VARCHAR(255) NOT NULL,
                payout_percent DECIMAL(5,2) DEFAULT 70.00,
                hash_method ENUM('md5', 'sha256', 'sha1') DEFAULT 'md5',
                ip_whitelist TEXT,
                offerwall_url VARCHAR(1000),
                postback_url VARCHAR(500),
                status ENUM('active', 'inactive', 'testing') DEFAULT 'active',
                total_earnings DECIMAL(12,2) DEFAULT 0.00,
                total_conversions INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Created offerwall_networks table');

        // Create offerwall_transactions table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS offerwall_transactions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                network_id INT NOT NULL,
                network_name VARCHAR(50) NOT NULL,
                transaction_id VARCHAR(255) NOT NULL,
                offer_id VARCHAR(255),
                offer_name VARCHAR(500),
                payout DECIMAL(10,4) NOT NULL,
                credited_amount DECIMAL(10,4) NOT NULL,
                admin_profit DECIMAL(10,4) NOT NULL,
                currency VARCHAR(10) DEFAULT 'USD',
                ip_address VARCHAR(45),
                user_agent TEXT,
                raw_data TEXT,
                status ENUM('credited', 'pending', 'rejected', 'duplicate', 'invalid_signature', 'user_not_found') DEFAULT 'pending',
                error_message VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (network_id) REFERENCES offerwall_networks(id) ON DELETE CASCADE,
                
                UNIQUE KEY unique_network_transaction (network_id, transaction_id),
                INDEX idx_user_id (user_id),
                INDEX idx_network_id (network_id),
                INDEX idx_status (status),
                INDEX idx_created_at (created_at)
            )
        `);
        console.log('✅ Created offerwall_transactions table');

        // Insert default networks
        const networks = [
            ['adgate', 'AdGate Media', 'Complete surveys, watch videos, and download apps to earn rewards.', 'CHANGE_ME_ADGATE_SECRET', 70.00, 'md5', 'https://wall.adgaterewards.com/{wall_id}/{user_id}'],
            ['cpx', 'CPX Research', 'Premium surveys with high payouts. Share your opinion and get paid.', 'CHANGE_ME_CPX_SECRET', 70.00, 'md5', 'https://offers.cpx-research.com/index.php?app_id={app_id}&ext_user_id={user_id}'],
            ['timewall', 'TimeWall', 'Complete timed offers and earn money while you wait.', 'CHANGE_ME_TIMEWALL_SECRET', 70.00, 'sha256', 'https://timewall.io/offers?user_id={user_id}&pub_id={pub_id}'],
            ['offertoro', 'OfferToro', 'Complete offers, surveys, and tasks to earn rewards instantly.', 'CHANGE_ME_OFFERTORO_SECRET', 70.00, 'md5', 'https://www.offertoro.com/ifr/show/{pub_id}/{user_id}/0'],
            ['lootably', 'Lootably', 'Discover new apps, games, and offers while earning rewards.', 'CHANGE_ME_LOOTABLY_SECRET', 70.00, 'sha256', 'https://wall.lootably.com/?placementID={placement_id}&sid={user_id}']
        ];

        for (const network of networks) {
            try {
                await pool.query(
                    `INSERT INTO offerwall_networks (name, display_name, description, secret_key, payout_percent, hash_method, offerwall_url)
                     VALUES (?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE display_name = VALUES(display_name)`,
                    network
                );
            } catch (err) {
                console.log(`ℹ️  Network ${network[0]} already exists or error:`, err.message);
            }
        }
        console.log('✅ Inserted default networks');

        // Add offerwall_earnings column to users
        try {
            await pool.query('ALTER TABLE users ADD COLUMN offerwall_earnings DECIMAL(12,4) DEFAULT 0.0000');
            console.log('✅ Added offerwall_earnings column to users');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  offerwall_earnings column already exists');
            } else {
                console.log('⚠️  Warning:', err.message);
            }
        }

        console.log('✅ Offerwall migration completed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
