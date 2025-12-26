import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, SafeAreaView, Clipboard } from 'react-native'; // Note: Clipboard might need expo-clipboard in newer Expo
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import WalletManager from '../services/WalletManager';
import * as ExpoClipboard from 'expo-clipboard'; // Assuming installed

export default function SecurityScreen({ navigation, route }) {
    const { walletAddress, password } = route.params;
    const [mnemonic, setMnemonic] = useState(null);
    const [inputPassword, setInputPassword] = useState('');
    const [isRevealed, setIsRevealed] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleReveal = async () => {
        if (!inputPassword) return;
        setLoading(true);
        try {
            const seed = await WalletManager.getMnemonic(walletAddress, inputPassword);
            setMnemonic(seed);
            setIsRevealed(true);
        } catch (error) {
            Alert.alert("Erreur", "Mot de passe incorrect ou aucune seed trouvée.");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async () => {
        if (mnemonic) {
            await ExpoClipboard.setStringAsync(mnemonic);
            Alert.alert("Succès", "Phrase copiée dans le presse-papier");
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#FF9800', '#F44336']} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Sécurité du Wallet</Text>
                </View>
            </LinearGradient>

            <View style={styles.content}>
                <View style={styles.warningBox}>
                    <Ionicons name="warning" size={32} color="#F44336" />
                    <Text style={styles.warningTitle}>Zone Sensible</Text>
                    <Text style={styles.warningText}>
                        Ne partagez jamais votre phrase de récupération. Quiconque possède ces 12 mots peut voler tous vos fonds.
                    </Text>
                </View>

                {!isRevealed ? (
                    <View style={styles.authContainer}>
                        <Text style={styles.label}>Entrez votre mot de passe pour voir la Seed</Text>
                        <TextInput
                            style={styles.input}
                            secureTextEntry
                            placeholder="Mot de passe"
                            value={inputPassword}
                            onChangeText={setInputPassword}
                        />
                        <TouchableOpacity style={styles.button} onPress={handleReveal} disabled={loading}>
                            <Text style={styles.buttonText}>{loading ? "Vérification..." : "Révéler la Phrase"}</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.seedContainer}>
                        <Text style={styles.seedLabel}>Votre Phrase de Récupération</Text>
                        <View style={styles.seedBox}>
                            <Text style={styles.seedText}>{mnemonic}</Text>
                        </View>
                        <TouchableOpacity style={styles.copyButton} onPress={copyToClipboard}>
                            <Ionicons name="copy-outline" size={20} color="#fff" />
                            <Text style={styles.copyText}>Copier</Text>
                        </TouchableOpacity>

                        <Text style={styles.hint}>Notez ces mots sur un papier et gardez-le en lieu sûr.</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9f9f9' },
    header: { padding: 20, paddingTop: 50, paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerContent: { flexDirection: 'row', alignItems: 'center' },
    backButton: { marginRight: 20 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },

    content: { padding: 25 },
    warningBox: { backgroundColor: '#FFEBEE', padding: 20, borderRadius: 12, alignItems: 'center', marginBottom: 30, borderLeftWidth: 5, borderLeftColor: '#F44336' },
    warningTitle: { color: '#D32F2F', fontWeight: 'bold', fontSize: 18, marginVertical: 10 },
    warningText: { color: '#B71C1C', textAlign: 'center', lineHeight: 20 },

    authContainer: { marginTop: 20 },
    label: { fontSize: 16, marginBottom: 10, color: '#333', fontWeight: 'bold' },
    input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', fontSize: 16, marginBottom: 20 },
    button: { backgroundColor: '#333', padding: 15, borderRadius: 10, alignItems: 'center' },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

    seedContainer: { alignItems: 'center' },
    seedLabel: { fontSize: 16, color: '#666', marginBottom: 15 },
    seedBox: { backgroundColor: '#fff', padding: 20, borderRadius: 12, width: '100%', borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed' },
    seedText: { fontSize: 18, color: '#333', textAlign: 'center', lineHeight: 28, fontWeight: '600' },
    copyButton: { flexDirection: 'row', backgroundColor: '#2196F3', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: 20 },
    copyText: { color: '#fff', marginLeft: 10, fontWeight: 'bold' },
    hint: { marginTop: 20, color: '#888', textAlign: 'center', fontSize: 12 }
});
