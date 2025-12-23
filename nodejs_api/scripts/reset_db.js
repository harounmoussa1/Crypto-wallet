const { Client } = require('pg');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
};

async function resetDb() {
    const client = new Client(config);
    try {
        await client.connect();
        console.log('Dropping all tables...');
        await client.query('DROP TABLE IF EXISTS transactions, balances, wallet_addresses, wallets, networks, users CASCADE');
        console.log('Tables dropped.');
    } catch (err) {
        console.error('Error resetting database:', err);
    } finally {
        await client.end();
    }
}

resetDb();
