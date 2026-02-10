require('dotenv').config();
const { pool } = require('./config/database');

async function checkVipRequests() {
    try {
        const [rows] = await pool.query('SELECT id, user_id, screenshot_path, status FROM vip_requests ORDER BY id DESC LIMIT 10');
        console.log('VIP Requests in database:');
        rows.forEach(row => {
            console.log(`  ID: ${row.id}, User: ${row.user_id}, Screenshot: "${row.screenshot_path}", Status: ${row.status}`);
        });

        // Check if files exist
        const fs = require('fs');
        const path = require('path');

        console.log('\nChecking if files exist:');
        for (const row of rows) {
            if (row.screenshot_path) {
                const filePath = path.join(__dirname, 'uploads', 'vip-screenshots', row.screenshot_path);
                const exists = fs.existsSync(filePath);
                console.log(`  ${row.screenshot_path}: ${exists ? '✓ EXISTS' : '✗ NOT FOUND'}`);
                if (!exists) {
                    console.log(`    Expected path: ${filePath}`);
                }
            } else {
                console.log(`  ID ${row.id}: No screenshot_path in database`);
            }
        }

        // List files in upload directory
        const uploadDir = path.join(__dirname, 'uploads', 'vip-screenshots');
        console.log('\nFiles in uploads/vip-screenshots:');
        if (fs.existsSync(uploadDir)) {
            const files = fs.readdirSync(uploadDir);
            files.forEach(f => console.log(`  - ${f}`));
        } else {
            console.log('  Directory does not exist!');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkVipRequests();
