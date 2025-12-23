import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import WalletManager from '../services/WalletManager';
import BlockchainService from '../services/BlockchainService';
import DatabaseService from '../services/DatabaseService';

export default function SendScreen({ navigation, route }) {
    const { password } = route.params || {};
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!recipient || !amount) {
            Alert.alert("Erreur", "Veuillez remplir tous les champs.");
            return;
        }

        if (!password) {
            Alert.alert("Erreur Sécurité", "Mot de passe manquant. Veuillez vous reconnecter.");
            navigation.navigate('Login');
            return;
        }

        setLoading(true);
        try {
            const wallet = await WalletManager.getActiveWallet(password);
            if (!wallet) throw new Error("Wallet non trouvé");

            const tx = await BlockchainService.sendTransaction(wallet, recipient, amount);

            // Log local transaction
            await DatabaseService.addTransaction({
                wallet_address: wallet.address,
                hash: tx.hash,
                from_address: wallet.address,
                to_address: recipient,
                value: amount,
                token_symbol: 'NXR', // or active currency
                timestamp: Date.now(),
                status: 'pending'
            });

            Alert.alert(
                "Succès",
                `Transaction envoyée avec succès !\n\nHash: ${tx.hash.substring(0, 20)}...`,
                [{ text: "OK", onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            console.error(error);
            Alert.alert("Échec de la transaction", error.message || "Une erreur est survenue.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Adresse du destinataire</Text>
                <TextInput
                    style={styles.input}
                    placeholder="0x..."
                    value={recipient}
                    onChangeText={setRecipient}
                    autoCapitalize="none"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Montant (NXR)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="0.01"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                />
            </View>

            <TouchableOpacity
                style={[styles.button, loading ? styles.disabledButton : null]}
                onPress={handleSend}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Confirmer l'envoi</Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, backgroundColor: '#fff', padding: 20 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 40, textAlign: 'center' },
    inputGroup: { marginBottom: 25 },
    label: { fontSize: 14, color: '#666', marginBottom: 8, fontWeight: '600' },
    input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 15, fontSize: 16 },
    button: { backgroundColor: '#6200ee', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 20 },
    disabledButton: { backgroundColor: '#999' },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
