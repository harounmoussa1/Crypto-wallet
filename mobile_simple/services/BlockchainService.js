import { ethers } from 'ethers';

// Network Configurations
export const NETWORKS = {
    // Local Blockchain (Our App's Main Network)
    hardhat: {
        name: "Nexora Private Chain",
        chainId: 31337,
        rpcUrl: 'https://wales-cigarette-connected-parks.trycloudflare.com', // Tunnel Cloudflare (Global Access)
        currency: 'NXR',
        explorer: ''
    },
    // Optional: Keep Mainnet for reference or remove if strictly local
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
        // Pass network explicitly to avoid "detectNetwork" calls which fail in RN if connection is flaky
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

    // Future: Method to scan logs for history
}

export default new BlockchainService();
