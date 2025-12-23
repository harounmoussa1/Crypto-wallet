import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import WalletManager from '../services/WalletManager';
import { Ionicons } from '@expo/vector-icons'; // Assuming installed

export default function LoginScreen({ navigation }) {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        try {
            const isValid = await WalletManager.verifyPassword(password);
            if (isValid) {
                navigation.replace('Home', { password });
            } else {
                Alert.alert("Erreur", "Mot de passe incorrect");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Erreur", "Problème de connexion");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1a237e', '#6200ee']}
                style={styles.header}
            >
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>🔐</Text>
                </View>
                <Text style={styles.headerTitle}>Bon retour !</Text>
                <Text style={styles.headerSubtitle}>Entrez votre mot de passe pour décrypter votre wallet.</Text>
            </LinearGradient>

            <View style={styles.form}>
                <Text style={styles.label}>Mot de passe</Text>
                <TextInput
                    style={styles.input}
                    secureTextEntry
                    placeholder="Votre mot de passe maître"
                    value={password}
                    onChangeText={setPassword}
                    placeholderTextColor="#aaa"
                />

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Déverrouiller</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => Alert.alert("Sécurité", "Si vous avez perdu votre mot de passe, vous devez restaurer votre wallet avec la phrase de récupération (non implémenté ici).")}>
                    <Text style={styles.link}>Mot de passe oublié ?</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { padding: 30, paddingTop: 100, paddingBottom: 60, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, alignItems: 'center' },
    iconContainer: { marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.2)', padding: 20, borderRadius: 50 },
    icon: { fontSize: 40 },
    headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
    headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
    form: { padding: 30, marginTop: -30, backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
    label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
    input: { backgroundColor: '#f5f5f5', borderRadius: 12, padding: 15, fontSize: 16, color: '#333', marginBottom: 20 },
    button: { backgroundColor: '#6200ee', padding: 18, borderRadius: 12, alignItems: 'center' },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    link: { textAlign: 'center', marginTop: 20, color: '#999', fontSize: 12 }
});
