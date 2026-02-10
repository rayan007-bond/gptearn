// Fix admin password script
// Run with: node fix-admin.js

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixAdmin() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        // Generate proper password hash for 'admin123'
        const passwordHash = await bcrypt.hash('admin123', 10);
        console.log('Generated hash:', passwordHash);

        // Check if admin exists
        const [existing] = await pool.query('SELECT id FROM admin_users WHERE email = ?', ['admin@gpt-earn.com']);

        if (existing.length > 0) {
            // Update existing admin password
            await pool.query(
                'UPDATE admin_users SET password_hash = ? WHERE email = ?',
                [passwordHash, 'admin@gpt-earn.com']
            );
            console.log('✅ Admin password updated!');
        } else {
            // Insert new admin
            await pool.query(
                'INSERT INTO admin_users (email, username, password_hash, role) VALUES (?, ?, ?, ?)',
                ['admin@gpt-earn.com', 'SuperAdmin', passwordHash, 'super_admin']
            );
            console.log('✅ Admin user created!');
        }

        console.log('\nAdmin credentials:');
        console.log('Email: admin@gpt-earn.com');
        console.log('Password: admin123');

        await pool.end();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixAdmin();
