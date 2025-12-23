const db = require('../database');
const fs = require('fs');
const path = require('path');

async function initDb() {
    try {
        const schemaPath = path.join(__dirname, '../schema.sql');
        const sql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Running schema.sql...');
        await db.query(sql);
        console.log('Database initialized successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error initializing database:', err);
        process.exit(1);
    }
}

initDb();
