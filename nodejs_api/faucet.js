require('dotenv').config();
const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');

const app = express();
const PORT = 4000; // Running on 4000 to avoid conflict with main API (8008)

// Enable CORS for frontend
app.use(cors());
app.use(express.json());

// --- CONFIGURATION ---
// Default Hardhat Account #0 Private Key (same for both networks in test)
const FAUCET_PRIVATE_KEY = process.env.FAUCET_PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

// Network RPC URLs
const NETWORK_RPCS = {
    nexora: process.env.NEXORA_RPC_URL || "http://127.0.0.1:8545",
    novalink: process.env.NOVALINK_RPC_URL || "http://127.0.0.1:8546"
};

console.log(`💧 Faucet Service starting...`);
console.log(`🔌 Nexora RPC: ${NETWORK_RPCS.nexora}`);
console.log(`🔌 NovaLink RPC: ${NETWORK_RPCS.novalink}`);

// --- ROUTES ---

// Health Check
app.get('/', (req, res) => {
    res.json({ status: "online", service: "Multi-Network Web3 Faucet" });
});

const fs = require('fs');

// Simple file logger
function logToFile(msg) {
    const entry = `[${new Date().toISOString()}] ${msg}\n`;
    fs.appendFileSync('faucet_debug.log', entry);
    console.log(msg);
}

// Send ETH
app.post('/api/send', async (req, res) => {
    const { address, amount, network = 'nexora' } = req.body;
    logToFile(`[REQ] To: ${address}, Amount: ${amount}, Net: ${network}`);

    // 1. Validation
    if (!address || !ethers.utils.isAddress(address)) {
        logToFile(`[ERR] Invalid address: ${address}`);
        return res.status(400).json({ error: "Adresse invalide" });
    }

    if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ error: "Montant invalide" });
    }

    // 2. Select Network
    const rpcUrl = NETWORK_RPCS[network];
    logToFile(`[INFO] Using RPC: ${rpcUrl}`);

    if (!rpcUrl) {
        return res.status(400).json({ error: `Réseau invalide: ${network}` });
    }

    try {
        // Create provider and wallet for the selected network
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        const wallet = new ethers.Wallet(FAUCET_PRIVATE_KEY, provider);

        logToFile(`[INFO] Sending ${amount} ETH to ${address} on ${network}...`);

        // Check Faucet Balance
        const balance = await wallet.getBalance();
        const amountWei = ethers.utils.parseEther(amount.toString());

        if (balance.lt(amountWei)) {
            logToFile(`[ERR] Insufficient faucet balance: ${ethers.utils.formatEther(balance)}`);
            return res.status(500).json({ error: `Le Faucet ${network} est à sec :(` });
        }

        // 3. Send Transaction
        const tx = await wallet.sendTransaction({
            to: address,
            value: amountWei
        });

        logToFile(`[SUCCESS] Tx Hash: ${tx.hash}`);

        // 4. Wait for confirmation (1 block)
        await tx.wait(1);
        logToFile(`[SUCCESS] Confirmed`);

        // 5. Return Success
        res.json({
            success: true,
            txHash: tx.hash,
            network: network,
            message: `Fonds envoyés avec succès sur ${network.toUpperCase()} !`
        });

    } catch (error) {
        logToFile(`[ERR] Transaction failed: ${error.message} \nCode: ${error.code} \nReason: ${error.reason}`);
        console.error(`Transaction failed on ${network}:`, error);
        res.status(500).json({
            error: "Échec de la transaction",
            network: network,
            details: error.message
        });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Faucet Backend running on http://localhost:${PORT}`);
});
