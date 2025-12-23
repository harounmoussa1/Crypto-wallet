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
// Default Hardhat Account #0 Private Key
const FAUCET_PRIVATE_KEY = process.env.FAUCET_PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";

// Setup Ethers
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(FAUCET_PRIVATE_KEY, provider);

console.log(`💧 Faucet Service starting...`);
console.log(`🔌 Connected to RPC: ${RPC_URL}`);
console.log(`👛 Faucet Address: ${wallet.address}`);

// --- ROUTES ---

// Health Check
app.get('/', (req, res) => {
    res.json({ status: "online", service: "Local Web3 Faucet" });
});

// Send ETH
app.post('/api/send', async (req, res) => {
    const { address, amount } = req.body;

    // 1. Validation
    if (!address || !ethers.utils.isAddress(address)) {
        return res.status(400).json({ error: "Adresse invalide" });
    }

    if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ error: "Montant invalide" });
    }

    if (amount > 10) {
        return res.status(400).json({ error: "Montant trop élevé (Max 10 ETH)" });
    }

    try {
        console.log(`💸 Sending ${amount} ETH to ${address}...`);

        // Check Faucet Balance
        const balance = await wallet.getBalance();
        const amountWei = ethers.utils.parseEther(amount.toString());

        if (balance.lt(amountWei)) {
            return res.status(500).json({ error: "Le Faucet est à sec :(" });
        }

        // 2. Send Transaction
        const tx = await wallet.sendTransaction({
            to: address,
            value: amountWei
        });

        console.log(`✅ Transaction sent: ${tx.hash}`);

        // 3. Wait for confirmation (1 block)
        await tx.wait(1);

        // 4. Return Success
        res.json({
            success: true,
            txHash: tx.hash,
            message: "Fonds envoyés avec succès !"
        });

    } catch (error) {
        console.error("Transaction failed:", error);
        res.status(500).json({
            error: "Échec de la transaction",
            details: error.message
        });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Faucet Backend running on http://localhost:${PORT}`);
});
