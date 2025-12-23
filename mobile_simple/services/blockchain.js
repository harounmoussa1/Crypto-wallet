import { ethers } from 'ethers';

// RPC Local (Nexora) via Cloudflare
const LOCAL_RPC_URL = 'https://wales-cigarette-connected-parks.trycloudflare.com';

/**
 * Service pour interagir avec Ethereum Sepolia (ethers v5).
 */
class BlockchainService {
    constructor() {
        // Syntax ethers v5 - Static Network Config to avoid auto-detection errors
        this.provider = new ethers.providers.JsonRpcProvider(LOCAL_RPC_URL, {
            name: 'Nexora Private Chain',
            chainId: 31337
        });
    }

    async getBalance(address) {
        try {
            const balance = await this.provider.getBalance(address);
            // Syntax ethers v5 : ethers.utils.formatEther
            return ethers.utils.formatEther(balance);
        } catch (error) {
            console.error("Erreur getBalance:", error);
            throw error;
        }
    }

    getProvider() {
        return this.provider;
    }
}

export default new BlockchainService();
