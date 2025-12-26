import 'react-native-get-random-values';
import { ethers } from 'ethers';
import SecureStoreService from './secureStore';
import BlockchainService from './blockchain';

const PRIVATE_KEY_STORAGE_KEY = 'user_private_key';

/**
 * Service local wallet (v5 style).
 */
class WalletService {
    async createNewWallet() {
        try {
            const wallet = ethers.Wallet.createRandom();
            await SecureStoreService.saveSecure(PRIVATE_KEY_STORAGE_KEY, wallet.privateKey);

            return {
                address: wallet.address,
                privateKey: wallet.privateKey,
            };
        } catch (error) {
            console.error("Erreur création wallet:", error);
            throw error;
        }
    }

    async loadWallet() {
        const privateKey = await SecureStoreService.getSecure(PRIVATE_KEY_STORAGE_KEY);
        if (!privateKey) return null;

        try {
            // Syntax ethers v5 : connect directly to the provider instance
            const provider = BlockchainService.getProvider();
            return new ethers.Wallet(privateKey, provider);
        } catch (error) {
            console.error("Erreur chargement wallet:", error);
            return null;
        }
    }

    async sendEth(toAddress, amountInEth) {
        const wallet = await this.loadWallet();
        if (!wallet) throw new Error("Wallet non trouvé");

        try {
            // Syntax ethers v5 : ethers.utils.parseEther
            const tx = await wallet.sendTransaction({
                to: toAddress,
                value: ethers.utils.parseEther(amountInEth.toString()),
            });

            console.log("Transaction envoyée (v5):", tx.hash);
            return tx;
        } catch (error) {
            console.error("Erreur envoi transaction:", error);
            throw error;
        }
    }

    async hasWallet() {
        const pk = await SecureStoreService.getSecure(PRIVATE_KEY_STORAGE_KEY);
        return !!pk;
    }
}
export default new WalletService();