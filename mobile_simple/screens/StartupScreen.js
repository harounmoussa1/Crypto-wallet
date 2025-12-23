import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import WalletManager from '../services/WalletManager';
import { initDatabase } from '../services/DatabaseService';

export default function StartupScreen({ navigation }) {
    useEffect(() => {
        const bootstrap = async () => {
            try {
                // Initialize DB
                await initDatabase();

                // Check if wallet setup exists (has password)
                const isSetup = await WalletManager.isSetup();

                if (isSetup) {
                    navigation.replace('Login');
                } else {
                    navigation.replace('Setup');
                }
            } catch (error) {
                console.error("Startup failed:", error);
                // Fallback or error screen
            }
        };

        bootstrap();
    }, []);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#6200ee" />
            <Text style={styles.text}>Démarrage sécurisé...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
    text: { marginTop: 20, color: '#666', fontWeight: '500' }
});
