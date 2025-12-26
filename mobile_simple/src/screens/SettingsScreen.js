import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen({ navigation, route }) {
    const { walletAddress, password } = route.params;

    const settingsOptions = [
        {
            icon: 'shield-checkmark',
            title: 'Phrase de Récupération',
            subtitle: 'Sauvegarder vos 12 mots secrets',
            color: '#FF9800',
            action: () => navigation.navigate('Security', { walletAddress, password })
        },
        {
            icon: 'wallet-outline',
            title: 'Gérer les Wallets',
            subtitle: 'Ajouter, supprimer ou changer de wallet',
            color: '#2196F3',
            action: () => navigation.navigate('ManageWallets', { walletAddress, password })
        },
        {
            icon: 'globe-outline',
            title: 'Réseau',
            subtitle: 'Nexora Private Chain (Hardhat)',
            color: '#4CAF50',
            action: () => navigation.navigate('NetworkSwitcher')
        },
        {
            icon: 'lock-closed-outline',
            title: 'Changer le Mot de Passe',
            subtitle: 'Modifier votre mot de passe maître',
            color: '#9C27B0',
            action: () => navigation.navigate('ChangePassword', { walletAddress, password })
        },
        {
            icon: 'information-circle-outline',
            title: 'À Propos',
            subtitle: 'Version 1.0.0 - eWallet',
            color: '#607D8B',
            action: () => Alert.alert('eWallet', 'Version 1.0.0\nWallet non-custodial sécurisé')
        }
    ];

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#6200ee', '#3700b3']} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Paramètres</Text>
                    <View style={{ width: 24 }} />
                </View>
            </LinearGradient>

            <ScrollView style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Sécurité</Text>
                    {settingsOptions.slice(0, 2).map((option, index) => (
                        <TouchableOpacity key={index} style={styles.optionCard} onPress={option.action}>
                            <View style={[styles.iconContainer, { backgroundColor: option.color }]}>
                                <Ionicons name={option.icon} size={24} color="#fff" />
                            </View>
                            <View style={styles.optionText}>
                                <Text style={styles.optionTitle}>{option.title}</Text>
                                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Général</Text>
                    {settingsOptions.slice(2).map((option, index) => (
                        <TouchableOpacity key={index} style={styles.optionCard} onPress={option.action}>
                            <View style={[styles.iconContainer, { backgroundColor: option.color }]}>
                                <Ionicons name={option.icon} size={24} color="#fff" />
                            </View>
                            <View style={styles.optionText}>
                                <Text style={styles.optionTitle}>{option.title}</Text>
                                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.dangerZone}>
                    <TouchableOpacity
                        style={styles.dangerButton}
                        onPress={() => Alert.alert(
                            'Déconnexion',
                            'Êtes-vous sûr ? Assurez-vous d\'avoir sauvegardé votre phrase de récupération.',
                            [
                                { text: 'Annuler', style: 'cancel' },
                                { text: 'Déconnexion', style: 'destructive', onPress: () => navigation.replace('Login') }
                            ]
                        )}
                    >
                        <Ionicons name="log-out-outline" size={20} color="#F44336" />
                        <Text style={styles.dangerText}>Déconnexion</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    header: { paddingTop: 50, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backButton: { padding: 5 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },

    content: { flex: 1, padding: 20 },
    section: { marginBottom: 30 },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#666', marginBottom: 15, marginLeft: 5, textTransform: 'uppercase', letterSpacing: 1 },

    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 16,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
    },
    optionText: { flex: 1 },
    optionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 3 },
    optionSubtitle: { fontSize: 13, color: '#999' },

    dangerZone: { marginTop: 20, marginBottom: 40 },
    dangerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFCDD2'
    },
    dangerText: { color: '#F44336', fontWeight: 'bold', marginLeft: 10 }
});
