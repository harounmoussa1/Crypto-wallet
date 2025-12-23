-- Re-initialisation complète de la base de données
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS balances CASCADE;
DROP TABLE IF EXISTS wallet_addresses CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS networks CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Table: users (Informations de base de l'utilisateur)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- Mot de passe haché (Bcrypt)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: wallets (Le conteneur maître des secrets)
CREATE TABLE wallets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) DEFAULT 'Main Wallet',
    encrypted_master_private_key TEXT,               -- CLÉ PRIVÉE UNIQUE (Chiffrée)
    encrypted_seed TEXT,                             -- PHRASE SECRÈTE / SEED (Chiffrée)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: networks (Réseaux supportés)
CREATE TABLE networks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    symbol VARCHAR(10) NOT NULL,
    chain_id INT
);

INSERT INTO networks (name, symbol, chain_id) VALUES 
('Ethereum', 'ETH', 1),
('Bitcoin', 'BTC', NULL),
('Solana', 'SOL', NULL),
('Linea', 'LINEA', 59144),
('Base', 'BASE', 8453),
('BNB Chain', 'BNB', 56),
('Polygon', 'POLYGON', 137),
('OP', 'OP', 10),
('Arbitrum', 'ARBITRUM', 42161);

-- Table: wallet_addresses (Clés publiques spécifiques à chaque réseau)
CREATE TABLE wallet_addresses (
    id SERIAL PRIMARY KEY,
    wallet_id INTEGER REFERENCES wallets(id) ON DELETE CASCADE,
    network_id INTEGER REFERENCES networks(id) ON DELETE CASCADE,
    public_key VARCHAR(255) NOT NULL,          -- La clé publique/adresse spécifique au réseau
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(wallet_id, network_id),
    UNIQUE(public_key) -- Assurer l'unicité des adresses pour identification
);

-- Table: balances
CREATE TABLE balances (
    id SERIAL PRIMARY KEY,
    wallet_address_id INTEGER REFERENCES wallet_addresses(id) ON DELETE CASCADE,
    asset_symbol VARCHAR(10) NOT NULL,
    amount DECIMAL(30, 18) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(wallet_address_id, asset_symbol)
);

-- Table: transactions
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    wallet_address_id INTEGER REFERENCES wallet_addresses(id) ON DELETE SET NULL,
    tx_hash VARCHAR(255) NOT NULL,
    direction VARCHAR(10),
    amount DECIMAL(30, 18) NOT NULL,
    asset_symbol VARCHAR(10) NOT NULL,
    status VARCHAR(20) DEFAULT 'CONFIRMED',
    from_public_key VARCHAR(255),
    to_public_key VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);