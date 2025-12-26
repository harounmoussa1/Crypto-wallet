import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import WalletManager from '../services/WalletManager';

export default function ResetPasswordScreen({ navigation }) {
    const [step, setStep] = useState(1);
    const [mnemonic, setMnemonic] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleVerifyMnemonic = async () => {
        if (!mnemonic.trim() || mnemonic.split(' ').length !== 12) {
            Alert.alert("Erreur", "Veuillez entrer une phrase valide de 12 mots.");
            return;
        }
        setStep(2);
    };

    const handleReset = async () => {
        if (newPassword.length < 4) {
            Alert.alert("Erreur", "Le mot de passe est trop court.");
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert("Erreur", "Les mots de passe ne correspondent pas.");
            return;
        }

        setLoading(true);
        try {
            await WalletManager.resetPasswordWithMnemonic(mnemonic.trim(), newPassword);
            Alert.alert("Succès", "Mot de passe réinitialisé !", [
                { text: "Connexion", onPress: () => navigation.replace('Login') }
            ]);
        } catch (error) {
            Alert.alert("Échec", error.message || "Impossible de réinitialiser le mot de passe.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <LinearGradient colors={['#fff', '#f0f2f5']} style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContent}>

                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="close-circle" size={30} color="#666" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Réinitialisation</Text>
                    </View>

                    {step === 1 ? (
                        <>
                            <View style={styles.iconContainer}>
                                <Ionicons name="key-outline" size={60} color="#FF9800" />
                            </View>
                            <Text style={styles.subtitle}>Mot de passe oublié ?</Text>
                            <Text style={styles.description}>
                                Pour réinitialiser votre accès, vous devez prouver que vous êtes le propriétaire du wallet en entrant votre phrase secrète (Seed).
                            </Text>

                            <Text style={styles.label}>Phrase Secrète (12 mots)</Text>
                            <TextInput
                                style={styles.mnemonicInput}
                                placeholder="Entrez vos 12 mots..."
                                multiline
                                numberOfLines={3}
                                value={mnemonic}
                                onChangeText={setMnemonic}
                                autoCapitalize="none"
                            />

                            <TouchableOpacity style={styles.button} onPress={handleVerifyMnemonic}>
                                <Text style={styles.buttonText}>Vérifier</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <View style={styles.iconContainer}>
                                <Ionicons name="lock-open-outline" size={60} color="#4CAF50" />
                            </View>
                            <Text style={styles.subtitle}>Nouveau Mot de Passe</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Nouveau mot de passe"
                                secureTextEntry
                                value={newPassword}
                                onChangeText={setNewPassword}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Confirmer le mot de passe"
                                secureTextEntry
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                            />

                            <TouchableOpacity style={[styles.button, { backgroundColor: '#4CAF50' }]} onPress={handleReset} disabled={loading}>
                                <Text style={styles.buttonText}>{loading ? "Traitement..." : "Changer le mot de passe"}</Text>
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
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    backButton: { marginRight: 15 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#333' },

    iconContainer: { alignItems: 'center', marginBottom: 20 },
    subtitle: { fontSize: 22, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 10 },
    description: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 30, lineHeight: 22 },

    label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 10 },
    mnemonicInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 15, minHeight: 100, textAlignVertical: 'top', fontSize: 16, marginBottom: 20 },

    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 15, fontSize: 16, marginBottom: 15 },

    button: { backgroundColor: '#333', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
