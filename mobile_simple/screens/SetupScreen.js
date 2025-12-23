import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import WalletManager from '../services/WalletManager';

export default function SetupScreen({ navigation }) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSetup = async () => {
        if (password.length < 6) {
            Alert.alert("Sécurité", "Le mot de passe doit contenir au moins 6 caractères.");
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert("Erreur", "Les mots de passe ne correspondent pas.");
            return;
        }

        setLoading(true);
        try {
            await WalletManager.setupPassword(password);

            // Auto create first wallet
            await WalletManager.createWallet("Compte Principal", password);

            Alert.alert("Succès", "Wallet configuré avec succès !");
            navigation.replace('Home', { password });
        } catch (error) {
            console.error(error);
            Alert.alert("Erreur", "Impossible de configurer le wallet.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#6200ee', '#3700b3']}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>Bienvenue sur eWallet</Text>
                <Text style={styles.headerSubtitle}>Configurez votre sécurité pour commencer.</Text>
            </LinearGradient>

            <View style={styles.form}>
                <Text style={styles.label}>Mot de passe maître</Text>
                <TextInput
                    style={styles.input}
                    secureTextEntry
                    placeholder="Minimum 6 caractères"
                    value={password}
                    onChangeText={setPassword}
                    placeholderTextColor="#aaa"
                />

                <Text style={styles.label}>Confirmer le mot de passe</Text>
                <TextInput
                    style={styles.input}
                    secureTextEntry
                    placeholder="Répétez le mot de passe"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholderTextColor="#aaa"
                />

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleSetup}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Créer mon Wallet</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => Alert.alert("Import", "Fonctionnalité d'import à venir")}>
                    <Text style={styles.link}>J'ai déjà un wallet (Import)</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9f9f9' },
    header: { padding: 30, paddingTop: 80, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
    headerSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },
    form: { padding: 25, marginTop: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 15 },
    input: { backgroundColor: '#fff', borderRadius: 12, padding: 15, fontSize: 16, borderWidth: 1, borderColor: '#eee', color: '#333' },
    button: { backgroundColor: '#6200ee', padding: 18, borderRadius: 12, marginTop: 30, alignItems: 'center', shadowColor: '#6200ee', shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    link: { textAlign: 'center', marginTop: 20, color: '#6200ee', fontWeight: '600' }
});
