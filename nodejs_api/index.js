// Import required libraries
const ethers = require('ethers');
const express = require('express');
const web3 = require('web3');
const request = require('request');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./database');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8008;

// Middleware
app.use(express.json());

// Load Environment Variables
const CONTRACT_ADDRESSES = [
  process.env.CONTRACT_ADDRESS_ETH, // 0 - Ethereum
  process.env.CONTRACT_ADDRESS_WBTC,// 1 - Bitcoin (WBTC)
  process.env.CONTRACT_ADDRESS_SOL, // 2 - Solana
  process.env.CONTRACT_ADDRESS_ETH, // 3 - Linea
  process.env.CONTRACT_ADDRESS_ETH, // 4 - Base
  process.env.CONTRACT_ADDRESS_BNB, // 5 - BNB
  process.env.CONTRACT_ADDRESS_POL, // 6 - Polygon
  process.env.CONTRACT_ADDRESS_ETH, // 7 - OP
  process.env.CONTRACT_ADDRESS_ETH  // 8 - Arbitrum
];

const ABI = [
  'function doTransfer(address _from, address _to, uint256 _amount) returns (bool)',
  'function getBalance(address wallet_addres) public view returns(uint256)'
];

// Helper to register new user
async function registerUser(password, addressMap = null, identifier = null, encryptedPrivateKey = null, encryptedSeed = null, email = null) {
  try {
    if (!identifier && (!addressMap || !Object.keys(addressMap).length)) {
      throw new Error("Identifier or addressMap is required");
    }

    const firstPubKey = identifier || (addressMap && Object.values(addressMap)[0].publicKey);

    // 1. Hash Password
    let passwordHash = null;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password, salt);
    } else {
      passwordHash = 'default_no_password';
    }

    // 2. Create User
    const username = `user_${firstPubKey.substring(0, 8)}`;
    const userRes = await db.query(
      'INSERT INTO users (username, password_hash, email) VALUES ($1, $2, $3) ON CONFLICT (username) DO UPDATE SET email = COALESCE($3, users.email) RETURNING id',
      [username, passwordHash, email]
    );
    const userId = userRes.rows[0].id;

    // 3. Create Main Wallet
    const walletRes = await db.query(
      'INSERT INTO wallets (user_id, encrypted_master_private_key, encrypted_seed) VALUES ($1, $2, $3) RETURNING id',
      [userId, encryptedPrivateKey, encryptedSeed]
    );
    const walletId = walletRes.rows[0].id;

    // 4. Add Addresses (Only if provided)
    if (addressMap) {
      const networkMap = {
        'Ethereum': 1, 'Bitcoin': 2, 'Solana': 3, 'Linea': 4,
        'Base': 5, 'BNB Chain': 6, 'Polygon': 7, 'OP': 8, 'Arbitrum': 9
      };

      const networkSymbols = {
        'Ethereum': 'ETH', 'Bitcoin': 'WBTC', 'Solana': 'SOL', 'Linea': 'ETH',
        'Base': 'ETH', 'BNB Chain': 'BNB', 'Polygon': 'POL', 'OP': 'ETH', 'Arbitrum': 'ETH'
      };

      const stimulusBalances = {
        'ETH': 0.1,
        'WBTC': 0.005,
        'SOL': 50,
        'BNB': 250,
        'POL': 2000
      };

      for (const [name, data] of Object.entries(addressMap)) {
        const netId = networkMap[name];
        const pubKey = typeof data === 'object' ? data.publicKey : (typeof data === 'string' ? data : null);
        const assetSymbol = networkSymbols[name] || 'ETH';

        if (netId && pubKey) {
          const addrRes = await db.query(
            'INSERT INTO wallet_addresses (wallet_id, network_id, public_key) VALUES ($1, $2, $3) RETURNING id',
            [walletId, netId, pubKey]
          );
          const waId = addrRes.rows[0].id;

          const bal = stimulusBalances[assetSymbol] || 100;
          await db.query(
            'INSERT INTO balances (wallet_address_id, asset_symbol, amount) VALUES ($1, $2, $3)',
            [waId, assetSymbol, bal]
          );
        }
      }
    }

    console.log(`Registered new user with ID ${firstPubKey} ${email ? '(' + email + ')' : ''}`);
    return userId;
  } catch (e) {
    console.error("Registration Error:", e);
    throw e;
  }
}

// ---------------- ROUTES ----------------

// 1. AUTH - EMAIL/PASSWORD LOGIN
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userRes = await db.query('SELECT id, username, email, password_hash FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: "Utilisateur non trouvé" });
    }

    const user = userRes.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Mot de passe incorrect" });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'ethsecretkey',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      message: "Connexion réussie"
    });
  } catch (e) {
    console.error("Auth Error:", e);
    res.status(500).json({ error: "Erreur serveur" });
  }
});



// 2. ADDR-BASED LOGIN / SYNC (Legacy/Mobile compatible)
app.post('/login/:identifier', async (req, res) => {
  const identifier = req.params.identifier;
  const { password, address_map, encrypted_private_key, encrypted_seed, email } = req.body;

  try {
    // 1. Check if identifier exists in wallet_addresses
    const existing = await db.query(
      `SELECT u.id, u.password_hash, wa.wallet_id
             FROM wallet_addresses wa
             JOIN wallets w ON wa.wallet_id = w.id
             JOIN users u ON w.user_id = u.id
             WHERE wa.public_key = $1`,
      [identifier]
    );

    let userId;
    let walletId;

    if (existing.rows.length > 0) {
      const hash = existing.rows[0].password_hash;
      userId = existing.rows[0].id;
      walletId = existing.rows[0].wallet_id;

      if (hash && hash !== 'default_no_password') {
        if (!password) return res.status(401).json({ error: "Password required" });
        const match = await bcrypt.compare(password, hash);
        if (!match) return res.status(401).json({ error: "Invalid password" });
      }

      // Sync wallet data
      await db.query(
        'UPDATE wallets SET encrypted_master_private_key = COALESCE($1, encrypted_master_private_key), encrypted_seed = COALESCE($2, encrypted_seed) WHERE user_id = $3',
        [encrypted_private_key, encrypted_seed, userId]
      );

      // Update email if provided and not set
      if (email) {
        await db.query('UPDATE users SET email = COALESCE(email, $1) WHERE id = $2', [email, userId]);
      }

      // Sync addresses
      if (address_map) {
        const networkMap = {
          'Ethereum': 1, 'Bitcoin': 2, 'Solana': 3, 'Linea': 4,
          'Base': 5, 'BNB Chain': 6, 'Polygon': 7, 'OP': 8, 'Arbitrum': 9
        };
        for (const [name, data] of Object.entries(address_map)) {
          const netId = networkMap[name];
          const pubKey = typeof data === 'object' ? data.publicKey : (typeof data === 'string' ? data : null);

          if (netId && pubKey) {
            await db.query(`
                      INSERT INTO wallet_addresses (wallet_id, network_id, public_key) 
                      VALUES ($1, $2, $3)
                      ON CONFLICT (wallet_id, network_id) DO UPDATE SET public_key = EXCLUDED.public_key`,
              [walletId, netId, pubKey]);
          }
        }
      }

      console.log(`Wallet identifying by ${identifier} logged in successfully`);

    } else {
      // --- WALLET DOES NOT EXIST: REGISTER ---
      userId = await registerUser(password, address_map, identifier, encrypted_private_key, encrypted_seed, email);
    }

    // Fetch current address_map from DB
    const addrMapRes = await db.query(
      `SELECT n.name, wa.public_key 
       FROM wallet_addresses wa
       JOIN networks n ON wa.network_id = n.id
       JOIN wallets w ON wa.wallet_id = w.id
       WHERE w.user_id = $1`,
      [userId]
    );

    const dbAddressMap = {};
    addrMapRes.rows.forEach(row => {
      dbAddressMap[row.name] = { publicKey: row.public_key };
    });

    // Generate Token
    const token = jwt.sign(
      { userId, identifier },
      process.env.JWT_SECRET || 'ethsecretkey',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      message: "Success",
      address_map: dbAddressMap
    });

  } catch (e) {
    console.error("Login Error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

// 2. GET BALANCE
app.get('/balance/:public_key/:currency', verifyToken, async (req, res) => {
  const { public_key, currency } = req.params;
  const currencyId = parseInt(currency);
  // Indices: 0:Eth, 1:Btc, 2:Sol, 3:Linea, 4:Base, 5:BNB, 6:Polygon, 7:OP, 8:Arbitrum
  const symbols = ['ETH', 'WBTC', 'SOL', 'ETH', 'ETH', 'BNB', 'POL', 'ETH', 'ETH'];
  const symbol = symbols[currencyId] || 'UNK';

  try {
    // 1. Try to get balance from Database first
    const dbRes = await db.query(
      `SELECT b.amount FROM balances b
             JOIN wallet_addresses wa ON b.wallet_address_id = wa.id
             WHERE wa.public_key = $1 AND b.asset_symbol = $2`,
      [public_key, symbol]
    );

    let balanceToReturn = null;
    if (dbRes.rows.length > 0) {
      balanceToReturn = dbRes.rows[0].amount;
    }

    // 2. Try to Refresh from Blockchain (Background or Fallback)
    try {
      const contractAddress = CONTRACT_ADDRESSES[currencyId];
      if (contractAddress) {
        const provider = ethers.getDefaultProvider(process.env.ETHEREUM_NETWORK || 'http://127.0.0.1:8545');
        const privateKey = process.env.PRIVATE_KEY;
        const signer = new ethers.Wallet(privateKey, provider);
        const contract = new ethers.Contract(contractAddress, ABI, signer);

        const weiResult = await contract.getBalance(public_key);
        const balanceEth = ethers.utils.formatEther(weiResult);

        // Update DB with fresh value
        const waRes = await db.query('SELECT id FROM wallet_addresses WHERE public_key = $1', [public_key]);
        if (waRes.rows.length > 0) {
          await db.query(
            `INSERT INTO balances (wallet_address_id, asset_symbol, amount, last_updated)
                         VALUES ($1, $2, $3, NOW())
                         ON CONFLICT (wallet_address_id, asset_symbol) 
                         DO UPDATE SET amount = EXCLUDED.amount, last_updated = NOW()`,
            [waRes.rows[0].id, symbol, balanceEth]
          );
        }
        balanceToReturn = balanceEth;
      }
    } catch (e) {
      console.log(`Blockchain refresh failed for ${symbol}, using DB value.`);
    }

    if (balanceToReturn !== null) {
      res.json({
        status: true,
        account: public_key,
        balance: balanceToReturn,
        currency: currencyId,
        symbol: symbol
      });
    } else {
      res.json({ status: true, balance: '0.00', symbol: symbol });
    }

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/transfer/:val/:sender_pubkey/:received_pubkey/:currency', verifyToken, async (req, res) => {
  const { val, sender_pubkey, received_pubkey, currency } = req.params;
  const currencyId = parseInt(currency);
  const amountNum = parseFloat(val);
  const symbols = ['ETH', 'WBTC', 'SOL', 'ETH', 'ETH', 'BNB', 'POL', 'ETH', 'ETH'];
  const symbol = symbols[currencyId] || 'UNK';

  try {
    // --- 1. POSTGRESQL ATOMIC TRANSFER ---
    const senderRes = await db.query(
      'SELECT b.id, b.amount FROM balances b JOIN wallet_addresses wa ON b.wallet_address_id = wa.id WHERE wa.public_key = $1 AND b.asset_symbol = $2',
      [sender_pubkey, symbol]
    );

    if (senderRes.rows.length === 0 || parseFloat(senderRes.rows[0].amount) < amountNum) {
      return res.status(400).json({ error: "Solde insuffisant dans la base de données" });
    }

    const txHash = '0x' + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2); // Temporary Hash

    // Perform DB updates in a Transaction
    await db.query('BEGIN');
    try {
      // Deduct from sender
      await db.query(
        'UPDATE balances SET amount = amount - $1, last_updated = NOW() WHERE id = $2',
        [amountNum, senderRes.rows[0].id]
      );

      // Add to receiver (if in DB)
      const recvRes = await db.query('SELECT id FROM wallet_addresses WHERE public_key = $1', [received_pubkey]);
      if (recvRes.rows.length > 0) {
        const waId = recvRes.rows[0].id;
        await db.query(
          `INSERT INTO balances (wallet_address_id, asset_symbol, amount, last_updated)
                     VALUES ($1, $2, $3, NOW())
                     ON CONFLICT (wallet_address_id, asset_symbol) 
                     DO UPDATE SET amount = balances.amount + EXCLUDED.amount, last_updated = NOW()`,
          [waId, symbol, amountNum]
        );
      }

      // Log Transaction history
      const senderWaIdRes = await db.query('SELECT id FROM wallet_addresses WHERE public_key = $1', [sender_pubkey]);
      const senderWaId = senderWaIdRes.rows[0].id;

      await db.query(
        `INSERT INTO transactions (wallet_address_id, tx_hash, direction, amount, asset_symbol, status, from_public_key, to_public_key)
                 VALUES ($1, $2, 'OUTGOING', $3, $4, 'CONFIRMED', $5, $6)`,
        [senderWaId, txHash, val, symbol, sender_pubkey, received_pubkey]
      );

      if (recvRes.rows.length > 0) {
        await db.query(
          `INSERT INTO transactions (wallet_address_id, tx_hash, direction, amount, asset_symbol, status, from_public_key, to_public_key)
                     VALUES ($1, $2, 'INCOMING', $3, $4, 'CONFIRMED', $5, $6)`,
          [recvRes.rows[0].id, txHash, val, symbol, sender_pubkey, received_pubkey]
        );
      }

      await db.query('COMMIT');
    } catch (dbErr) {
      await db.query('ROLLBACK');
      throw dbErr;
    }

    // --- 2. ASYNC BLOCKCHAIN SYNC (Don't wait for it if it's 'heavy') ---
    (async () => {
      try {
        const contractAddress = CONTRACT_ADDRESSES[currencyId];
        if (contractAddress) {
          const provider = ethers.getDefaultProvider(process.env.ETHEREUM_NETWORK || 'http://127.0.0.1:8545');
          const privateKey = process.env.PRIVATE_KEY;
          const wallet = new ethers.Wallet(privateKey, provider);
          const contract = new ethers.Contract(contractAddress, ABI, wallet);
          const weiValue = ethers.utils.parseEther(val);

          const tx = await contract.doTransfer(sender_pubkey, received_pubkey, weiValue);
          await tx.wait();
          console.log(`Blockchain Sync Success: ${tx.hash}`);
        }
      } catch (bcErr) {
        console.error("Blockchain sync failed (DB remains updated):", bcErr.message);
      }
    })();

    res.json({
      status: "1",
      message: "Transfert réussi (DB)",
      txHash: txHash,
      result: true
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 4. HISTORY
app.get('/history/:public_key/:currency', verifyToken, async (req, res) => {
  const { public_key, currency } = req.params;

  try {
    const dbTxs = await db.query(
      `SELECT tx_hash as hash, amount as value, timestamp, direction, asset_symbol, from_public_key, to_public_key 
             FROM transactions 
             JOIN wallet_addresses wa ON transactions.wallet_address_id = wa.id
             WHERE wa.public_key = $1
             ORDER BY timestamp DESC`,
      [public_key]
    );

    // Transform to shape expected by frontend
    const result = dbTxs.rows.map(row => ({
      hash: row.hash,
      from: row.from_public_key || (row.direction === 'OUTGOING' ? public_key : 'external'),
      to: row.to_public_key || (row.direction === 'INCOMING' ? public_key : 'external'),
      value: row.value,
      asset_symbol: row.asset_symbol,
      timeStamp: Math.floor(new Date(row.timestamp).getTime() / 1000)
    }));

    res.json({ result });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Middleware to verify JWT
function verifyToken(req, res, next) {
  const bearerHeader = req.headers['authorization'];
  if (typeof bearerHeader !== 'undefined') {
    const bearer = bearerHeader.split(' ');
    const token = bearer[1];

    jwt.verify(token, process.env.JWT_SECRET || 'ethsecretkey', (err, authData) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.auth = authData;
      next();
    });
  } else {
    res.sendStatus(403);
  }
}

app.listen(port, () => console.log(`Server started on port ${port}`));
