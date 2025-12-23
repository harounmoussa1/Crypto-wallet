const { Client } = require('pg');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'postgres', // Connect to default DB first to create the new one
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
};

async function createDatabase() {
    const client = new Client(config);

    try {
        await client.connect();

        // Check if database exists
        const checkRes = await client.query("SELECT 1 FROM pg_database WHERE datname = 'ewallet_db'");

        if (checkRes.rows.length === 0) {
            console.log("Database 'ewallet_db' not found. Creating...");
            await client.query('CREATE DATABASE ewallet_db');
            console.log("Database 'ewallet_db' created successfully.");
        } else {
            console.log("Database 'ewallet_db' already exists.");
        }
    } catch (err) {
        console.error('Error creating database:', err);
    } finally {
        await client.end();
    }
}

createDatabase();
