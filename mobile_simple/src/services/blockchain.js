import { ethers } from 'ethers';
import { CONFIG } from '../config/config';

/**
 * Service pour interagir avec Ethereum Sepolia (ethers v5).
 */
class BlockchainService {
    constructor() {
        // Syntax ethers v5 - Static Network Config to avoid auto-detection errors
        this.provider = new ethers.providers.JsonRpcProvider(CONFIG.DEFAULT_RPC_URL, {
            name: CONFIG.NETWORK_NAME,
            chainId: CONFIG.DEFAULT_CHAIN_ID
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
