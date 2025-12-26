import { ethers } from 'ethers';

// --- Network Configuration (Local IP - Fixed) ---
// Nexora: Port 8545, NovaLink: Port 8546
// Using local IP for stable connection on same WiFi network
const NEXORA_RPC = 'http://192.168.1.16:8545';
const NOVALINK_RPC = 'http://192.168.1.16:8546';

// Network Configurations
export const NETWORKS = {
    // Local Blockchain (Our App's Main Network)
    // Local Blockchain (Our App's Main Network)
    hardhat: {
        name: "Nexora Private Chain",
        chainId: 1337, // Ganache default
        rpcUrl: NEXORA_RPC, // Tunnel for Nexora
        currency: 'NXR',
        explorer: ''
    },
    // New Network: NovaLink (Running on separate Hardhat Node)
    novalink: {
        name: "NovaLink Network",
        chainId: 31337, // Hardhat default
        rpcUrl: NOVALINK_RPC, // Tunnel for NovaLink
        currency: 'NVL',
        explorer: ''
    },
    mainnet: {
        name: "Ethereum Mainnet",
        chainId: 1,
        rpcUrl: 'https://eth.llamarpc.com',
        currency: 'ETH',
        explorer: 'https://etherscan.io'
    }
};

class BlockchainService {
    constructor() {
        this.currentNetwork = NETWORKS.hardhat; // Default to Local/Nexora

        this.provider = new ethers.providers.JsonRpcProvider(
            this.currentNetwork.rpcUrl,
            {
                name: this.currentNetwork.name,
                chainId: this.currentNetwork.chainId,
                ensAddress: null
            }
        );
    }

    setNetwork(networkKey) {
        if (NETWORKS[networkKey]) {
            this.currentNetwork = NETWORKS[networkKey];

            this.provider = new ethers.providers.JsonRpcProvider(
                this.currentNetwork.rpcUrl,
                {
                    name: this.currentNetwork.name,
                    chainId: this.currentNetwork.chainId,
                    ensAddress: null
                }
            );
            return true;
        }
        return false;
    }

    getCurrentNetwork() {
        return this.currentNetwork;
    }

    getProvider() {
        return this.provider;
    }

    async getBalance(address) {
        // Debug: Test connectivity manually with 2s timeout
        try {
            console.log(`[DEBUG] Testing connectivity to ${this.currentNetwork.rpcUrl}...`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

            const response = await fetch(this.currentNetwork.rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            const text = await response.text();
            console.log(`[DEBUG] Connectivity OK. Block Height response: ${text.substring(0, 50)}...`);
        } catch (fetchError) {
            console.error(`[DEBUG] Connectivity Check FAILED: ${fetchError.name === 'AbortError' ? 'TIMEOUT (Firewall?)' : fetchError.message}`);
        }

        try {
            const balance = await this.provider.getBalance(address);
            return ethers.utils.formatEther(balance);
        } catch (error) {
            console.error("Error getting balance:", error.message || error);
            if (error.code === 'NETWORK_ERROR') {
                console.log("⚠️ Check if Hardhat is running and accessible at 10.0.2.2:8545");
            }
            return "0.0";
        }
    }

    async getGasPrice() {
        return await this.provider.getGasPrice();
    }

    /**
     * Send transaction using a connected wallet
     */
    async sendTransaction(wallet, toAddress, amount, data = '0x') {
        try {
            // Ensure wallet is connected to current provider
            const connectedWallet = wallet.connect(this.provider);

            const tx = {
                to: toAddress,
                value: ethers.utils.parseEther(amount.toString()),
                data: data
            };

            // Gas estimation
            // const gasLimit = await connectedWallet.estimateGas(tx); 
            // tx.gasLimit = gasLimit;

            const transaction = await connectedWallet.sendTransaction(tx);
            return transaction;
        } catch (error) {
            console.error("Error sending transaction:", error);
            throw error;
        }
    }

    // Feature: Scan recent blocks for incoming transactions (Simple Indexer)
    async scanForIncomingTransactions(address, limit = 20) {
        try {
            const currentBlock = await this.provider.getBlockNumber();
            // Scan last 'limit' blocks
            const startBlock = Math.max(0, currentBlock - limit);

            console.log(`[Scan] Scanning blocks ${startBlock} to ${currentBlock} for ${address}...`);

            const foundTxs = [];

            // Iterate backwards to find recent first
            for (let i = currentBlock; i > startBlock; i--) {
                const block = await this.provider.getBlockWithTransactions(i);
                if (block && block.transactions) {
                    for (const tx of block.transactions) {
                        if (tx.to && tx.to.toLowerCase() === address.toLowerCase()) {
                            // Found incoming transaction
                            foundTxs.push({
                                hash: tx.hash,
                                from_address: tx.from,
                                to_address: tx.to,
                                value: ethers.utils.formatEther(tx.value),
                                timestamp: block.timestamp * 1000, // seconds -> ms
                                status: 'Confirmé'
                            });
                        }
                    }
                }
            }
            return foundTxs;
        } catch (error) {
            console.error("Scan error:", error);
            return [];
        }
    }

    // Future: Method to scan logs for history
}

export default new BlockchainService();
