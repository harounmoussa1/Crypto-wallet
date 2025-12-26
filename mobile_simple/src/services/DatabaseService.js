import * as SQLite from 'expo-sqlite';

const DB_NAME = 'ewallet_db.db';

let db = null;

const getDB = async () => {
    if (!db) {
        db = await SQLite.openDatabaseAsync(DB_NAME);
    }
    return db;
};

export const initDatabase = async () => {
    try {
        const database = await getDB();

        await database.execAsync(`
            CREATE TABLE IF NOT EXISTS wallets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                address TEXT UNIQUE NOT NULL,
                encrypted_mnemonic TEXT,
                created_at INTEGER,
                is_active INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                wallet_address TEXT NOT NULL,
                hash TEXT UNIQUE,
                from_address TEXT,
                to_address TEXT,
                value TEXT,
                token_symbol TEXT,
                timestamp INTEGER,
                status TEXT,
                FOREIGN KEY(wallet_address) REFERENCES wallets(address)
            );
            
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT
            );
        `);
        console.log("Database initialized successfully (Async)");
    } catch (error) {
        console.error("Database initialization error:", error);
        throw error;
    }
};

// --- Wallet Methods ---

export const addWallet = async (name, address) => {
    const database = await getDB();
    const timestamp = Date.now();
    try {
        const result = await database.runAsync(
            `INSERT INTO wallets (name, address, created_at, is_active) VALUES (?, ?, ?, 0)`,
            [name, address, timestamp]
        );
        return result;
    } catch (error) {
        console.error("Error adding wallet:", error);
        throw error;
    }
};

export const getWallets = async () => {
    const database = await getDB();
    try {
        const rows = await database.getAllAsync(
            `SELECT * FROM wallets ORDER BY created_at ASC`
        );
        return rows;
    } catch (error) {
        console.error("Error getting wallets:", error);
        throw error;
    }
};

export const setActiveWallet = async (address) => {
    const database = await getDB();
    try {
        await database.withTransactionAsync(async () => {
            await database.runAsync(`UPDATE wallets SET is_active = 0`);
            await database.runAsync(
                `UPDATE wallets SET is_active = 1 WHERE address = ?`,
                [address]
            );
        });
    } catch (error) {
        console.error("Error setting active wallet:", error);
        throw error;
    }
};

export const deleteWallet = async (address) => {
    const database = await getDB();
    try {
        await database.runAsync(
            `DELETE FROM wallets WHERE address = ?`,
            [address]
        );
    } catch (error) {
        console.error("Error deleting wallet:", error);
        throw error;
    }
};

// Simple XOR encryption for mnemonic (for demo - use proper encryption in production)
const encryptMnemonic = (mnemonic, password) => {
    let encrypted = '';
    for (let i = 0; i < mnemonic.length; i++) {
        encrypted += String.fromCharCode(mnemonic.charCodeAt(i) ^ password.charCodeAt(i % password.length));
    }
    return Buffer.from(encrypted).toString('base64');
};

const decryptMnemonic = (encrypted, password) => {
    const decoded = Buffer.from(encrypted, 'base64').toString();
    let decrypted = '';
    for (let i = 0; i < decoded.length; i++) {
        decrypted += String.fromCharCode(decoded.charCodeAt(i) ^ password.charCodeAt(i % password.length));
    }
    return decrypted;
};

export const saveWallet = async ({ address, mnemonic, password, name }) => {
    const database = await getDB();
    const timestamp = Date.now();
    const walletName = name || `Wallet ${timestamp}`;

    try {
        // Encrypt mnemonic with password
        const encryptedMnemonic = encryptMnemonic(mnemonic, password);

        const result = await database.runAsync(
            `INSERT OR REPLACE INTO wallets (name, address, encrypted_mnemonic, created_at, is_active) 
             VALUES (?, ?, ?, ?, 0)`,
            [walletName, address, encryptedMnemonic, timestamp]
        );
        return result;
    } catch (error) {
        console.error("Error saving wallet:", error);
        throw error;
    }
};

export const getAllWallets = async () => {
    const database = await getDB();
    try {
        const rows = await database.getAllAsync(
            `SELECT id, name, address, created_at, is_active FROM wallets ORDER BY created_at ASC`
        );
        return rows;
    } catch (error) {
        console.error("Error getting all wallets:", error);
        throw error;
    }
};

export const getWalletMnemonic = async (address, password) => {
    const database = await getDB();
    try {
        const row = await database.getFirstAsync(
            `SELECT encrypted_mnemonic FROM wallets WHERE address = ?`,
            [address]
        );

        if (!row || !row.encrypted_mnemonic) {
            throw new Error('Wallet not found or mnemonic not stored');
        }

        return decryptMnemonic(row.encrypted_mnemonic, password);
    } catch (error) {
        console.error("Error getting wallet mnemonic:", error);
        throw error;
    }
};

// --- Transaction Methods ---

export const addTransaction = async (txData) => {
    const database = await getDB();
    const { wallet_address, hash, from_address, to_address, value, token_symbol, timestamp, status } = txData;
    try {
        const result = await database.runAsync(
            `INSERT OR REPLACE INTO transactions 
            (wallet_address, hash, from_address, to_address, value, token_symbol, timestamp, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [wallet_address, hash, from_address, to_address, value, token_symbol, timestamp, status]
        );
        return result;
    } catch (error) {
        console.error("Error adding transaction:", error);
        throw error;
    }
};

export const getTransactions = async (walletAddress) => {
    const database = await getDB();
    try {
        const rows = await database.getAllAsync(
            `SELECT * FROM transactions WHERE wallet_address = ? ORDER BY timestamp DESC`,
            [walletAddress]
        );
        return rows;
    } catch (error) {
        console.error("Error getting transactions:", error);
        throw error;
    }
};

// --- Settings Methods ---

export const getSetting = async (key) => {
    const database = await getDB();
    try {
        const row = await database.getFirstAsync(
            `SELECT value FROM settings WHERE key = ?`,
            [key]
        );
        return row ? row.value : null;
    } catch (error) {
        console.error("Error getting setting:", error);
        throw error;
    }
};

export const setSetting = async (key, value) => {
    const database = await getDB();
    try {
        await database.runAsync(
            `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
            [key, value]
        );
    } catch (error) {
        console.error("Error setting setting:", error);
        throw error;
    }
};

export default {
    initDatabase,
    addWallet,
    getWallets,
    setActiveWallet,
    deleteWallet,
    saveWallet,
    getAllWallets,
    getWalletMnemonic,
    addTransaction,
    getTransactions,
    getSetting,
    setSetting
};
