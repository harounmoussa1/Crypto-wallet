import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import WalletManager from '../services/WalletManager';
import BlockchainService from '../services/BlockchainService';
import DatabaseService from '../services/DatabaseService';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/theme';

export default function SendScreen({ navigation, route }) {
    // Remove password from params, use Context
    const { password, isUnlocked } = useAuth();
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [balance, setBalance] = useState('0');
    const [gasEstimate, setGasEstimate] = useState(null);

    useEffect(() => {
        if (!isUnlocked || !password) {
            Alert.alert("Session expirée", "Veuillez vous reconnecter.");
            navigation.navigate('Login');
            return;
        }
        loadBalance();
    }, [isUnlocked, password]);

    const loadBalance = async () => {
        try {
            const wallet = await WalletManager.getActiveWallet(password);
            if (wallet) {
                const bal = await BlockchainService.getBalance(wallet.address);
                setBalance(bal);
            }
        } catch (e) {
            console.error("Error loading balance", e);
        }
    };

    const handleMax = async () => {
        // Simple logic: Max = Balance - Estimated Fee (0.00042 ETH roughly or calculated)
        // For now, let's just set it to balance * 0.95 to be safe if we don't calculate gas precisely
        if (parseFloat(balance) > 0) {
            const maxVal = parseFloat(balance) - 0.001; // Deduct buffer
            setAmount(maxVal > 0 ? maxVal.toFixed(6) : '0');
        }
    };

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
            // Offline fallback could go here
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.headerBalance}>
                <Text style={styles.balanceLabel}>Solde Disponible</Text>
                <Text style={styles.balanceValue}>{parseFloat(balance).toFixed(4)} NXR</Text>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Adresse du destinataire</Text>
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="0x..."
                        value={recipient}
                        onChangeText={setRecipient}
                        autoCapitalize="none"
                    />
                    <TouchableOpacity style={styles.scanButton}>
                        <Ionicons name="qr-code-outline" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Montant (NXR)</Text>
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="0.00"
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                    />
                    <TouchableOpacity onPress={handleMax} style={styles.maxButton}>
                        <Text style={styles.maxButtonText}>MAX</Text>
                    </TouchableOpacity>
                </View>
                {gasEstimate && <Text style={styles.gasText}>Gas estimé: {gasEstimate} NXR</Text>}
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
    container: { flexGrow: 1, backgroundColor: COLORS.background, padding: 20 },
    headerBalance: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
    balanceLabel: { fontSize: 14, color: COLORS.textSecondary },
    balanceValue: { fontSize: 32, fontWeight: 'bold', color: COLORS.text, marginTop: 5 },

    inputGroup: { marginBottom: 25 },
    label: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 8, fontWeight: '600' },
    inputWrapper: { flexDirection: 'row', alignItems: 'center' },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 15, fontSize: 16, color: COLORS.text },

    scanButton: { padding: 10, marginLeft: 10, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
    maxButton: { padding: 10, marginLeft: 10, backgroundColor: COLORS.lightGray, borderRadius: 8 },
    maxButtonText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 12 },

    gasText: { fontSize: 12, color: COLORS.textSecondary, marginTop: 5, marginLeft: 5 },

    button: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 20, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    disabledButton: { backgroundColor: '#999', shadowOpacity: 0 },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
