const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gpt_earn',
};

async function runMigration() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database');

        // Check if column exists
        const [columns] = await connection.query(`
            SELECT COUNT(*) as count 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME = 'tasks' 
            AND COLUMN_NAME = 'correct_answer'
        `, [dbConfig.database]);

        if (columns[0].count === 0) {
            console.log('Adding correct_answer column...');
            await connection.query(`
                ALTER TABLE tasks 
                ADD COLUMN correct_answer VARCHAR(255) DEFAULT NULL AFTER icon
            `);
            console.log('✅ correct_answer column added successfully');
        } else {
            console.log('ℹ️ correct_answer column already exists');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

runMigration();
