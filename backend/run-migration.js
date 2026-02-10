// Run VIP requests migration
const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('Creating vip_requests table...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS vip_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                plan_id INT NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                payment_method VARCHAR(50) NOT NULL,
                transaction_id VARCHAR(255),
                screenshot_path VARCHAR(255),
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                admin_id INT,
                admin_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                processed_at TIMESTAMP NULL,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (plan_id) REFERENCES vip_plans(id)
            )
        `);

        console.log('✅ vip_requests table created!');

        // Try to add index
        try {
            await pool.query('CREATE INDEX idx_vip_requests_status ON vip_requests(status)');
            console.log('✅ Index on status created');
        } catch (e) {
            console.log('Index already exists or could not be created');
        }

        await pool.end();
        console.log('Migration complete!');
    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
}

migrate();
