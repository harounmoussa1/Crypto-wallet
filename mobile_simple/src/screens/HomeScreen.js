import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, ScrollView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import WalletManager from '../services/WalletManager';
import DatabaseService from '../services/DatabaseService';
import BlockchainService from '../services/BlockchainService';
import { useFocusEffect } from '@react-navigation/native';

export default function HomeScreen({ navigation, route }) {
    const { password } = route.params || {};

    // State
    const [wallet, setWallet] = useState(null);
    const [balance, setBalance] = useState('0.00');
    const [transactions, setTransactions] = useState([]);
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

    // Reload when focusing screen (e.g. after transaction or network switch)
    useFocusEffect(
        useCallback(() => {
            // Check for network change
            const currentServiceNetwork = BlockchainService.getCurrentNetwork();
            setNetwork(currentServiceNetwork);

            // Force reload of wallet to ensure address derivation matches network
            loadData();
        }, [password]) // password is stable from route params
    );

    const loadData = async () => {
        setLoading(true);
        try {
            const activeWallet = await WalletManager.getActiveWallet(password);
            if (activeWallet) {
                setWallet(activeWallet);
                const bal = await BlockchainService.getBalance(activeWallet.address);
                setBalance(parseFloat(bal).toFixed(4));

                // Scan & Sync History (Initial Load)
                try {
                    const incomingTxs = await BlockchainService.scanForIncomingTransactions(activeWallet.address);
                    for (const tx of incomingTxs) {
                        await DatabaseService.addTransaction({
                            wallet_address: activeWallet.address,
                            hash: tx.hash,
                            from_address: tx.from_address,
                            to_address: tx.to_address,
                            value: tx.value,
                            token_symbol: network.currency,
                            timestamp: tx.timestamp,
                            status: tx.status
                        });
                    }
                } catch (scanErr) {
                    console.log("Initial scan block skipped or failed", scanErr);
                }

                // Load History
                const history = await DatabaseService.getTransactions(activeWallet.address);
                setTransactions(history || []);
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
            // 0. Update Balance
            const bal = await BlockchainService.getBalance(wallet.address);
            setBalance(parseFloat(bal).toFixed(4));

            // 1. Scan for new incoming transactions (Blockchain -> Local DB)
            const incomingTxs = await BlockchainService.scanForIncomingTransactions(wallet.address);
            if (incomingTxs.length > 0) {
                console.log(`Found ${incomingTxs.length} new incoming transactions! Saving...`);
                for (const tx of incomingTxs) {
                    // Save to DB (INSERT OR REPLACE handles duplicates via hash unique constraint)
                    await DatabaseService.addTransaction({
                        wallet_address: wallet.address,
                        hash: tx.hash,
                        from_address: tx.from_address,
                        to_address: tx.to_address,
                        value: tx.value,
                        token_symbol: network.currency,
                        timestamp: tx.timestamp,
                        status: tx.status
                    });
                }
            }

            // 2. Refresh History from Local DB
            const history = await DatabaseService.getTransactions(wallet.address);
            setTransactions(history || []);
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

    // Helper to check if current network is NovaLink (31337)
    // Note: Nexora is 1337
    const isNovaLink = network.chainId === 31337;

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={
                    isNovaLink
                        ? ['#006064', '#00bcd4'] // NovaLink: Cyan/Teal Gradient
                        : ['#4a00e0', '#8e2de2'] // Nexora: Purple Gradient (Default)
                }
                style={styles.header}
            >
                {/* Top Bar with Network and Settings */}
                <View style={styles.topBar}>
                    {/* Network Badge */}
                    <TouchableOpacity style={styles.networkBadge}>
                        <View style={[styles.dot, { backgroundColor: isNovaLink ? '#fff' : '#00e676' }]} />
                        <Text style={styles.networkText}>{network.name}</Text>
                    </TouchableOpacity>

                    {/* Settings Icon */}
                    <TouchableOpacity
                        style={styles.settingsButton}
                        onPress={() => navigation.navigate('Settings', { walletAddress: wallet.address, password })}
                    >
                        <Ionicons name="settings-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Account Info */}
                <View style={styles.accountSection}>
                    <TouchableOpacity style={styles.avatar}>
                        <Ionicons name="wallet" size={24} color={isNovaLink ? '#00bcd4' : '#6200ee'} />
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
                    <Text style={styles.balanceLabel}>Solde Total ({network.currency})</Text>
                    <Text style={styles.balanceValue}>{balance} {network.currency}</Text>
                    {/* Placeholder for Fiat Value */}
                    <Text style={styles.fiatValue}>≈ $ {(parseFloat(balance) * (isNovaLink ? 1500 : 2000)).toFixed(2)} USD</Text>
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

                    <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Swap')}>
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

                {/* Transaction History List */}
                {transactions.length === 0 ? (
                    <View style={styles.emptyHistory}>
                        <Ionicons name="time-outline" size={40} color="#ccc" />
                        <Text style={{ color: '#999', marginTop: 10 }}>Aucune transaction récente</Text>
                    </View>
                ) : (
                    transactions.map((tx, index) => {
                        const isNovaTx = tx.token_symbol === 'NVL';
                        const badgeColor = isNovaTx ? '#00bcd4' : '#6200ee';
                        const badgeText = isNovaTx ? 'NovaLink' : 'Nexora';

                        return (
                            <View key={index} style={styles.txItem}>
                                <View style={[styles.txIconContainer, { backgroundColor: isNovaTx ? 'rgba(0,188,212,0.1)' : 'rgba(98,0,238,0.1)' }]}>
                                    <Ionicons
                                        name={tx.from_address?.toLowerCase() === wallet?.address.toLowerCase() ? "arrow-up" : "arrow-down"}
                                        size={20}
                                        color={badgeColor}
                                    />
                                </View>
                                <View style={styles.txDetails}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={styles.txType}>
                                            {tx.from_address?.toLowerCase() === wallet?.address.toLowerCase() ? "Envoyé" : "Reçu"}
                                        </Text>
                                        <View style={{ marginLeft: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: badgeColor }}>
                                            <Text style={{ color: '#fff', fontSize: 9, fontWeight: 'bold' }}>{badgeText}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.txDate}>
                                        {new Date(tx.timestamp).toLocaleString()}
                                    </Text>
                                </View>
                                <View style={styles.txAmountContainer}>
                                    <Text style={[
                                        styles.txAmount,
                                        { color: tx.from_address?.toLowerCase() === wallet?.address.toLowerCase() ? "#F44336" : "#4CAF50" }
                                    ]}>
                                        {tx.from_address?.toLowerCase() === wallet?.address.toLowerCase() ? "-" : "+"} {parseFloat(tx.value).toFixed(4)} <Text style={{ fontSize: 12, color: badgeColor }}>{tx.token_symbol || 'NXR'}</Text>
                                    </Text>
                                    <Text style={styles.txStatus}>
                                        {tx.status || 'Confirmé'}
                                    </Text>
                                </View>
                            </View>
                        )
                    })
                )}

                {/* Settings / Tools Section */}
                <Text style={styles.sectionTitle}>Découvrir</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 30 }}>
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

    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    settingsButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },

    networkBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
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
    promoText: { color: '#fff', fontWeight: 'bold', marginTop: 10 },

    // Transaction List Styles
    txItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    txIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    txDetails: { flex: 1 },
    txType: { fontSize: 16, fontWeight: '600', color: '#333' },
    txDate: { fontSize: 12, color: '#999', marginTop: 2 },
    txAmountContainer: { alignItems: 'flex-end' },
    txAmount: { fontSize: 16, fontWeight: 'bold' },
    txStatus: { fontSize: 10, color: '#999', marginTop: 2 }
});
