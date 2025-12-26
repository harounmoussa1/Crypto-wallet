import { ethers } from 'ethers';
import CryptoJS from 'crypto-js';
import SecureStoreService from './secureStore';
import BlockchainService from './BlockchainService';
import DatabaseService from './DatabaseService';
const PASSWORD_HASH_KEY = 'master_password_hash';

class WalletManager {

    constructor() {
        this.cachedWallets = {};
    }

    // --- Security / Auth ---

    async isSetup() {
        const hash = await SecureStoreService.getSecure(PASSWORD_HASH_KEY);
        return !!hash;
    }

    async setupPassword(password) {
        // Generate a random salt (16 bytes = 128 bits)
        const salt = CryptoJS.lib.WordArray.random(128 / 8);

        // PBKDF2 with 1000 iterations (minimally acceptable, consider higher in production)
        const hash = CryptoJS.PBKDF2(password, salt, { keySize: 256 / 32, iterations: 1000 }).toString();

        // Store as JSON string: { salt: "hex...", hash: "hex..." }
        const storageValue = JSON.stringify({ salt: salt.toString(), hash });
        await SecureStoreService.saveSecure(PASSWORD_HASH_KEY, storageValue);
    }

    async verifyPassword(password) {
        try {
            const storedValue = await SecureStoreService.getSecure(PASSWORD_HASH_KEY);
            if (!storedValue) return false;

            try {
                // Try parsing as JSON (New PBKDF2 format)
                const { salt, hash } = JSON.parse(storedValue);

                if (!salt || !hash) throw new Error("Invalid format");

                const currentHash = CryptoJS.PBKDF2(password, CryptoJS.enc.Hex.parse(salt), { keySize: 256 / 32, iterations: 1000 }).toString();
                return currentHash === hash;

            } catch (e) {
                // Fallback: Check if it's the old SHA256 format (Legacy support)
                const legacyHash = CryptoJS.SHA256(password).toString();
                if (legacyHash === storedValue) {
                    // Optional: We could silently upgrade the password here
                    return true;
                }
                return false;
            }
        } catch (error) {
            console.error("verifyPassword error:", error);
            return false;
        }
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

    async resetPasswordWithMnemonic(mnemonic, newPassword) {
        try {
            // 1. Derive wallet from mnemonic
            const wallet = ethers.Wallet.fromMnemonic(mnemonic);

            // 2. Check if this wallet exists in our DB
            const wallets = await DatabaseService.getWallets();
            const existing = wallets.find(w => w.address === wallet.address);

            if (!existing) {
                throw new Error("Cette phrase secrète ne correspond à aucun wallet enregistré sur cet appareil.");
            }

            // 3. Update Master Password
            await this.setupPassword(newPassword);

            // 4. Re-encrypt everything with NEW password
            const encryptedKey = CryptoJS.AES.encrypt(wallet.privateKey, newPassword).toString();
            const encryptedMnemonic = CryptoJS.AES.encrypt(mnemonic, newPassword).toString();

            await SecureStoreService.saveSecure(`priv_key_${wallet.address}`, encryptedKey);
            await SecureStoreService.saveSecure(`mnemonic_${wallet.address}`, encryptedMnemonic);

            return true;
        } catch (error) {
            console.error("Reset Password Error:", error);
            throw error;
        }
    }

    async getMnemonic(address, password) {
        if (!(await this.verifyPassword(password))) {
            throw new Error("Mot de passe incorrect");
        }

        const encryptedMnemonic = await SecureStoreService.getSecure(`mnemonic_${address}`);
        if (!encryptedMnemonic) {
            throw new Error("Aucune phrase de récupération trouvée pour ce wallet");
        }

        try {
            const bytes = CryptoJS.AES.decrypt(encryptedMnemonic, password);
            const mnemonic = bytes.toString(CryptoJS.enc.Utf8);
            if (!mnemonic) throw new Error("Decryption failed");
            return mnemonic;
        } catch (e) {
            console.error("Mnemonic decryption error", e);
            throw new Error("Impossible de déchiffrer la phrase secrète");
        }
    }

    async getActiveWallet(password) {
        try {
            // Need password to verify/decrypt
            if (!(await this.verifyPassword(password))) {
                throw new Error("Mot de passe incorrect");
            }

            const wallets = await DatabaseService.getWallets();
            const activeWalletMeta = wallets.find(w => w.is_active);

            if (!activeWalletMeta) return null;

            // 1. Get Main Private Key (Nexora)
            const encryptedKey = await SecureStoreService.getSecure(`priv_key_${activeWalletMeta.address}`);
            if (!encryptedKey) return null;

            const bytes = CryptoJS.AES.decrypt(encryptedKey, password);
            const privateKey = bytes.toString(CryptoJS.enc.Utf8);

            if (!privateKey) throw new Error("Decryption failed");

            // 2. Check Network for Derivation
            const currentNetwork = BlockchainService.getCurrentNetwork();
            // NovaLink is now configured as 31337 (Hardhat default) and Nexora is 1337 (Ganache default)
            const isNovaLink = currentNetwork && currentNetwork.chainId === 31337;

            if (isNovaLink) {
                // 3. NovaLink Derivation: Hash(MainKey) -> NovaLinkKey
                // This is deterministic and instant.
                const novaLinkKey = ethers.utils.keccak256(privateKey); // Simple hash of the hex key
                console.log("[WalletManager] 🔵 Using NovaLink Derived Address");
                return new ethers.Wallet(novaLinkKey);
            }

            // 4. Default: Nexora (Main Key)
            console.log("[WalletManager] 🟣 Using Nexora Main Address");
            return new ethers.Wallet(privateKey);

        } catch (error) {
            console.error("Error getting active wallet:", error);
            return null;
        }
    }

    async getWallets() {
        return await DatabaseService.getWallets();
    }

    async getWalletAddressForNetwork(chainId, password) {
        try {
            if (!(await this.verifyPassword(password))) {
                throw new Error("Mot de passe incorrect");
            }

            const wallets = await DatabaseService.getWallets();
            const activeWalletMeta = wallets.find(w => w.is_active);
            if (!activeWalletMeta) return null;

            const encryptedKey = await SecureStoreService.getSecure(`priv_key_${activeWalletMeta.address}`);
            if (!encryptedKey) return null;

            const bytes = CryptoJS.AES.decrypt(encryptedKey, password);
            const privateKey = bytes.toString(CryptoJS.enc.Utf8);
            if (!privateKey) throw new Error("Decryption failed");

            // NovaLink (31337) Derivation Logic
            if (chainId === 31337) {
                const novaLinkKey = ethers.utils.keccak256(privateKey);
                const wallet = new ethers.Wallet(novaLinkKey);
                return wallet.address;
            }

            // Default (Nexora/1337/Mainnet) -> Always use Main Wallet
            const wallet = new ethers.Wallet(privateKey);
            return wallet.address;

        } catch (error) {
            console.error("Error getting address for network:", error);
            return null;
        }
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