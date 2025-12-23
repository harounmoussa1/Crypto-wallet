import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, ScrollView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import WalletManager from '../services/WalletManager';
import BlockchainService from '../services/BlockchainService';
import { useFocusEffect } from '@react-navigation/native';

export default function HomeScreen({ navigation, route }) {
    const { password } = route.params || {};

    // State
    const [wallet, setWallet] = useState(null);
    const [balance, setBalance] = useState('0.00');
    const [network, setNetwork] = useState(BlockchainService.getCurrentNetwork());
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Initial Load
    useEffect(() => {
        if (!password) {
            // Should not happen if flow is correct, but safe check
            navigation.replace('Login');
            return;
        }
        loadData();
    }, [password]);

    // Reload when focusing screen (e.g. after transaction)
    useFocusEffect(
        useCallback(() => {
            if (wallet) {
                refreshBalance();
            }
        }, [wallet])
    );

    const loadData = async () => {
        setLoading(true);
        try {
            const activeWallet = await WalletManager.getActiveWallet(password);
            if (activeWallet) {
                setWallet(activeWallet);
                const bal = await BlockchainService.getBalance(activeWallet.address);
                setBalance(parseFloat(bal).toFixed(4));
            } else {
                // Should probably redirect to Setup/Import if no active wallet found logic allows
                Alert.alert("Erreur", "Aucun wallet actif trouvé");
            }
        } catch (error) {
            console.error("Home loading error:", error);
            Alert.alert("Erreur", "Impossible de charger le wallet");
        } finally {
            setLoading(false);
        }
    };

    const refreshBalance = async () => {
        if (!wallet) return;
        setRefreshing(true);
        try {
            const bal = await BlockchainService.getBalance(wallet.address);
            setBalance(parseFloat(bal).toFixed(4));
        } catch (e) {
            console.error(e);
        } finally {
            setRefreshing(false);
        }
    };

    const copyAddress = async () => {
        // Use Clipboard (Expo)
        // import * as Clipboard from 'expo-clipboard';
        // await Clipboard.setStringAsync(wallet.address);
        Alert.alert("Copié", "Adresse copiée dans le presse-papier");
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#6200ee" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#4a00e0', '#8e2de2']} // Vibrant Purple Gradient
                style={styles.header}
            >
                {/* Network Badge */}
                <TouchableOpacity style={styles.networkBadge}>
                    <View style={styles.dot} />
                    <Text style={styles.networkText}>{network.name}</Text>
                </TouchableOpacity>

                {/* Account Info */}
                <View style={styles.accountSection}>
                    <TouchableOpacity style={styles.avatar}>
                        <Ionicons name="wallet" size={24} color="#6200ee" />
                    </TouchableOpacity>

                    <Text style={styles.accountName}>Mon Compte Principal</Text>

                    <TouchableOpacity style={styles.addressContainer} onPress={copyAddress}>
                        <Text style={styles.addressText}>
                            {wallet ? `${wallet.address.substring(0, 6)}...${wallet.address.substring(38)}` : '...'}
                        </Text>
                        <Ionicons name="copy-outline" size={14} color="#ddd" style={{ marginLeft: 5 }} />
                    </TouchableOpacity>
                </View>

                {/* Balance */}
                <View style={styles.balanceContainer}>
                    <Text style={styles.balanceLabel}>Solde Total</Text>
                    <Text style={styles.balanceValue}>{balance} {network.currency}</Text>
                    {/* Placeholder for Fiat Value */}
                    <Text style={styles.fiatValue}>≈ $ {(parseFloat(balance) * 2000).toFixed(2)} USD</Text>
                </View>

                {/* Actions */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Send', { password })}>
                        <View style={styles.actionIcon}>
                            <Ionicons name="arrow-up" size={24} color="#fff" />
                        </View>
                        <Text style={styles.actionText}>Envoyer</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Receive', { address: wallet?.address })}>
                        <View style={styles.actionIcon}>
                            <Ionicons name="arrow-down" size={24} color="#fff" />
                        </View>
                        <Text style={styles.actionText}>Recevoir</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert("Swap", "À venir")}>
                        <View style={styles.actionIcon}>
                            <Ionicons name="swap-horizontal" size={24} color="#fff" />
                        </View>
                        <Text style={styles.actionText}>Swap</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Content Body - Transactions etc */}
            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={refreshBalance} tintColor="#6200ee" />
                }
            >
                <Text style={styles.sectionTitle}>Historique</Text>

                {/* Empty State for History */}
                <View style={styles.emptyHistory}>
                    <Ionicons name="time-outline" size={40} color="#ccc" />
                    <Text style={{ color: '#999', marginTop: 10 }}>Aucune transaction récente</Text>
                </View>

                {/* Settings / Tools Section */}
                <Text style={styles.sectionTitle}>Découvrir</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 30 }}>
                    <View style={styles.promoCard}>
                        <LinearGradient colors={['#FF9800', '#F44336']} style={styles.promoGradient}>
                            <Ionicons name="shield-checkmark" size={24} color="#fff" />
                            <Text style={styles.promoText}>Back-up Seed</Text>
                        </LinearGradient>
                    </View>
                    <View style={styles.promoCard}>
                        <LinearGradient colors={['#2196F3', '#3F51B5']} style={styles.promoGradient}>
                            <Ionicons name="globe" size={24} color="#fff" />
                            <Text style={styles.promoText}>Browser</Text>
                        </LinearGradient>
                    </View>
                </ScrollView>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: 20, paddingTop: 60, paddingBottom: 40, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },

    networkBadge: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 20 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00e676', marginRight: 6 },
    networkText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

    accountSection: { alignItems: 'center', marginBottom: 25 },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    accountName: { color: 'white', fontSize: 16, fontWeight: '600' },
    addressContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 5, backgroundColor: 'rgba(0,0,0,0.1)', padding: 5, borderRadius: 8 },
    addressText: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },

    balanceContainer: { alignItems: 'center', marginBottom: 30 },
    balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 5 },
    balanceValue: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
    fiatValue: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 5 },

    actionsRow: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 10 },
    actionButton: { alignItems: 'center', width: 70 },
    actionIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
    actionText: { color: '#fff', fontSize: 12, fontWeight: '500' },

    content: { flex: 1, marginTop: -20, paddingHorizontal: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 25, marginBottom: 15 },

    emptyHistory: { alignItems: 'center', padding: 30, backgroundColor: '#fff', borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: '#ddd' },

    promoCard: { width: 140, height: 100, borderRadius: 16, marginRight: 15, overflow: 'hidden' },
    promoGradient: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 15 },
    promoText: { color: '#fff', fontWeight: 'bold', marginTop: 10 }
});
