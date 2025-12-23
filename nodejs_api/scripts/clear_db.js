const { Client } = require('pg');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
};

async function clearDb() {
    const client = new Client(config);
    try {
        await client.connect();
        console.log('Clearing all data from database...');

        // Truncate tables with CASCADE to clean everything including foreign key dependencies
        await client.query('TRUNCATE users, wallets, wallet_addresses, balances, transactions CASCADE');

        console.log('All data cleared successfully.');
    } catch (err) {
        console.error('Error clearing database:', err);
    } finally {
        await client.end();
    }
}

clearDb();
