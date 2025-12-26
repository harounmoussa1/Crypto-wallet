import * as SecureStore from 'expo-secure-store';

/**
 * Service pour gérer le stockage sécurisé sur l'appareil (iOS Keychain / Android Keystore).
 */
export async function saveSecure(key, value) {
    try {
        await SecureStore.setItemAsync(key, value);
        return true;
    } catch (error) {
        console.error(`Erreur lors de la sauvegarde sécurisée (${key}):`, error);
        return false;
    }
}

export async function getSecure(key) {
    try {
        return await SecureStore.getItemAsync(key);
    } catch (error) {
        console.error(`Erreur lors de la lecture sécurisée (${key}):`, error);
        return null;
    }
}

export async function deleteSecure(key) {
    try {
        await SecureStore.deleteItemAsync(key);
        return true;
    } catch (error) {
        console.error(`Erreur lors de la suppression sécurisée (${key}):`, error);
        return false;
    }
}

export default {
    saveSecure,
    getSecure,
    deleteSecure,
};
