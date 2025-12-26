import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import WalletManager from '../services/WalletManager';

import { useAuth } from '../context/AuthContext';

export default function ImportWalletScreen({ navigation }) {
    const [step, setStep] = useState(1); // 1: Mnemonic Input, 2: Create Password
    const [mnemonic, setMnemonic] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { unlockWallet } = useAuth();

    const handleImport = async () => {
        if (!mnemonic.trim() || mnemonic.split(' ').length !== 12) {
            Alert.alert("Erreur", "Veuillez entrer une phrase mnémonique valide de 12 mots.");
            return;
        }
        setStep(2);
    };

    const handleFinalize = async () => {
        if (password.length < 4) {
            Alert.alert("Erreur", "Le mot de passe doit contenir au moins 4 caractères.");
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert("Erreur", "Les mots de passe ne correspondent pas.");
            return;
        }

        setLoading(true);
        try {
            // 1. Save Master Password Hash
            await WalletManager.setupPassword(password);

            // 2. Import Wallet using the Seed Phrase
            await WalletManager.importWalletFromMnemonic("Imported Wallet", mnemonic.trim(), password);

            unlockWallet(password); // Unlock session

            Alert.alert("Succès", "Wallet récupéré et sécurisé avec succès !", [
                { text: "Accéder au Wallet", onPress: () => navigation.replace('Home') }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert("Erreur", "Échec de l'importation. Vérifiez votre phrase secrète.");
            // Rollback if needed (clear password setup if failed)
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <LinearGradient colors={['#eee', '#fff']} style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContent}>

                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Restaurer un Wallet</Text>
                    </View>

                    {step === 1 ? (
                        <>
                            <Text style={styles.subtitle}>Entrez votre phrase secrète (12 mots)</Text>
                            <Text style={styles.description}>
                                Saisissez les 12 mots dans l'ordre exact, séparés par un espace.
                                {"\n\n"}Exemple: witch collapse practice feed shame open despair creek road again ice least
                            </Text>

                            <TextInput
                                style={styles.mnemonicInput}
                                placeholder="mot1 mot2 mot3 ..."
                                multiline
                                numberOfLines={4}
                                value={mnemonic}
                                onChangeText={setMnemonic}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />

                            <TouchableOpacity style={styles.button} onPress={handleImport}>
                                <Text style={styles.buttonText}>Continuer</Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 10 }} />
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={styles.subtitle}>Sécurisez ce nouvel appareil</Text>
                            <Text style={styles.description}>
                                Créez un nouveau mot de passe maître. Il servira à déverrouiller ce wallet sur ce téléphone uniquement.
                            </Text>

                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nouveau Mot de passe"
                                    secureTextEntry
                                    value={password}
                                    onChangeText={setPassword}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Ionicons name="checkmark-done-outline" size={20} color="#666" style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Confirmer le mot de passe"
                                    secureTextEntry
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: '#4CAF50' }]}
                                onPress={handleFinalize}
                                disabled={loading}
                            >
                                <Text style={styles.buttonText}>{loading ? "Récupération..." : "Restaurer le Wallet"}</Text>
                                {!loading && <Ionicons name="cloud-download-outline" size={20} color="#fff" style={{ marginLeft: 10 }} />}
                            </TouchableOpacity>
                        </>
                    )}

                </ScrollView>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 30, paddingTop: 60, flexGrow: 1 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 40 },
    backButton: { marginRight: 15, padding: 5 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    subtitle: { fontSize: 18, fontWeight: '600', color: '#444', marginBottom: 10 },
    description: { fontSize: 14, color: '#666', lineHeight: 22, marginBottom: 30 },

    mnemonicInput: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        color: '#333',
        height: 120,
        textAlignVertical: 'top',
        marginBottom: 30
    },

    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 15, height: 55, borderWidth: 1, borderColor: '#eee', marginBottom: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    icon: { marginRight: 10 },
    input: { flex: 1, fontSize: 16, color: '#333' },

    button: { flexDirection: 'row', backgroundColor: '#6200ee', height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: "#6200ee", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5, marginTop: 20 },
    buttonText: { fontSize: 18, color: '#fff', fontWeight: 'bold' }
});
