import { ethers } from 'ethers';
import CryptoJS from 'crypto-js';
import SecureStoreService from './secureStore';
import DatabaseService from './DatabaseService';

const PASSWORD_HASH_KEY = 'master_password_hash';

class WalletManager {

    // --- Security / Auth ---

    async isSetup() {
        const hash = await SecureStoreService.getSecure(PASSWORD_HASH_KEY);
        return !!hash;
    }

    async setupPassword(password) {
        // Simple hash for verification (in production use PBKDF2/Argon2, here SHA256 for simplicity)
        const hash = CryptoJS.SHA256(password).toString();
        await SecureStoreService.saveSecure(PASSWORD_HASH_KEY, hash);
    }

    async verifyPassword(password) {
        const storedHash = await SecureStoreService.getSecure(PASSWORD_HASH_KEY);
        if (!storedHash) return false;
        const currentHash = CryptoJS.SHA256(password).toString();
        return currentHash === storedHash;
    }

    // --- Wallet Management ---

    async createWallet(name, password) {
        if (!(await this.verifyPassword(password))) {
            throw new Error("Mot de passe incorrect");
        }

        try {
            const wallet = ethers.Wallet.createRandom();

            // Encrypt private key with user password
            const encryptedKey = CryptoJS.AES.encrypt(wallet.privateKey, password).toString();
            const encryptedMnemonic = CryptoJS.AES.encrypt(wallet.mnemonic.phrase, password).toString();

            // Save sensitive data to SecureStore
            await SecureStoreService.saveSecure(`priv_key_${wallet.address}`, encryptedKey);
            await SecureStoreService.saveSecure(`mnemonic_${wallet.address}`, encryptedMnemonic);

            // Save public metadata to SQLite
            await DatabaseService.addWallet(name, wallet.address);

            // Set as active
            await DatabaseService.setActiveWallet(wallet.address);

            return wallet;
        } catch (error) {
            console.error("Error creating wallet:", error);
            throw error;
        }
    }

    async importWalletFromMnemonic(name, mnemonic, password) {
        if (!(await this.verifyPassword(password))) {
            throw new Error("Mot de passe incorrect");
        }

        try {
            const wallet = ethers.Wallet.fromMnemonic(mnemonic);

            // Check if already exists
            const wallets = await DatabaseService.getWallets();
            if (wallets.find(w => w.address === wallet.address)) {
                throw new Error("Ce wallet existe déjà");
            }

            const encryptedKey = CryptoJS.AES.encrypt(wallet.privateKey, password).toString();
            const encryptedMnemonic = CryptoJS.AES.encrypt(mnemonic, password).toString();

            await SecureStoreService.saveSecure(`priv_key_${wallet.address}`, encryptedKey);
            await SecureStoreService.saveSecure(`mnemonic_${wallet.address}`, encryptedMnemonic);

            await DatabaseService.addWallet(name, wallet.address);
            await DatabaseService.setActiveWallet(wallet.address);

            return wallet;
        } catch (error) {
            console.error("Error importing wallet:", error);
            throw error;
        }
    }

    async importWalletFromPrivateKey(name, privateKey, password) {
        if (!(await this.verifyPassword(password))) {
            throw new Error("Mot de passe incorrect");
        }

        try {
            const wallet = new ethers.Wallet(privateKey);
            // Check if already exists
            const wallets = await DatabaseService.getWallets();
            if (wallets.find(w => w.address === wallet.address)) {
                throw new Error("Ce wallet existe déjà");
            }

            const encryptedKey = CryptoJS.AES.encrypt(wallet.privateKey, password).toString();

            await SecureStoreService.saveSecure(`priv_key_${wallet.address}`, encryptedKey);
            // No mnemonic available for PK import

            await DatabaseService.addWallet(name, wallet.address);
            await DatabaseService.setActiveWallet(wallet.address);

            return wallet;
        } catch (error) {
            console.error("Error importing private key:", error);
            throw error;
        }
    }

    async getActiveWallet(password) {
        // Need password to decrypt
        if (!(await this.verifyPassword(password))) {
            throw new Error("Mot de passe incorrect");
        }

        const wallets = await DatabaseService.getWallets();
        const activeWalletMeta = wallets.find(w => w.is_active);

        if (!activeWalletMeta) return null;

        const encryptedKey = await SecureStoreService.getSecure(`priv_key_${activeWalletMeta.address}`);
        if (!encryptedKey) return null;

        try {
            const bytes = CryptoJS.AES.decrypt(encryptedKey, password);
            const privateKey = bytes.toString(CryptoJS.enc.Utf8);

            if (!privateKey) throw new Error("Decryption failed");

            // We return a connected wallet? Or just the wallet?
            // Ideally we connect it to a provider. For now just the wallet object.
            return new ethers.Wallet(privateKey);
        } catch (e) {
            console.error("Decryption error", e);
            throw new Error("Impossible de déchiffrer le wallet");
        }
    }

    async getWallets() {
        return await DatabaseService.getWallets();
    }

    async deleteWallet(address, password) {
        if (!(await this.verifyPassword(password))) {
            throw new Error("Mot de passe incorrect");
        }
        await SecureStoreService.deleteSecure(`priv_key_${address}`);
        await SecureStoreService.deleteSecure(`mnemonic_${address}`);
        await DatabaseService.deleteWallet(address);
    }
}
export default new WalletManager();