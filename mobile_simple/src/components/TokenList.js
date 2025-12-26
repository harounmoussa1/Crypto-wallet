import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TokenList({ activeTab, balances, transactions, walletAddress, onSwitchTab }) {

    // Helper colors
    const NETWORK_COLORS = {
        'Ethereum': '#627EEA', 'Bitcoin': '#F7931A', 'Solana': '#14F195',
        'Linea': '#627EEA', 'Base': '#0052FF', 'BNB Chain': '#F3BA2F',
        'Polygon': '#8247E5', 'OP': '#FF0420', 'Arbitrum': '#28A0F0'
    };

    return (
        <View>
            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity style={[styles.tab, activeTab === 'tokens' && styles.activeTab]} onPress={() => onSwitchTab('tokens')}>
                    <Text style={[styles.tabText, activeTab === 'tokens' && styles.activeTabText]}>Jetons</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, activeTab === 'history' && styles.activeTab]} onPress={() => onSwitchTab('history')}>
                    <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>Activité</Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.listContent}>
                {activeTab === 'tokens' ? (
                    Object.keys(balances).map((symbol) => {
                        const balance = balances[symbol] || '0.00';
                        return (
                            <View key={symbol} style={styles.listItem}>
                                <View style={[styles.tokenIcon, { backgroundColor: NETWORK_COLORS[symbol] || '#333' }]}>
                                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>{symbol.substring(0, 3).toUpperCase()}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.itemName}>{symbol}</Text>
                                    <Text style={styles.itemSub}>{symbol === 'Ethereum' || symbol === 'Bitcoin' ? 'Mainnet' : 'Layer 2'}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={styles.itemValue}>{parseFloat(balance).toFixed(4)}</Text>
                                    <Text style={styles.itemSubValue}>${(parseFloat(balance) * 1).toFixed(2)}</Text>
                                </View>
                            </View>
                        );
                    })
                ) : (
                    <View style={{ alignItems: 'center', marginTop: 30 }}>
                        <Ionicons name="cube-outline" size={50} color="#555" />
                        <Text style={styles.emptyText}>Historique des transactions</Text>
                        <Text style={{ color: '#888', textAlign: 'center', marginTop: 10, paddingHorizontal: 20 }}>
                            En mode Non-Custodial, l'historique nécessite un indexeur (Ex: Etherscan).
                        </Text>
                        <TouchableOpacity
                            style={styles.explorerBtn}
                            onPress={() => Alert.alert("Info", "Redirection vers l'explorer (Simulé)")}
                        >
                            <Text style={{ color: '#fff' }}>Voir sur l'explorateur Web</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
    tab: { marginRight: 20, paddingVertical: 10 },
    activeTab: { borderBottomWidth: 2, borderBottomColor: '#6200EE' },
    tabText: { color: '#888', fontSize: 16, fontWeight: 'bold' },
    activeTabText: { color: '#fff' },

    listContent: { padding: 20 },
    listItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    tokenIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    itemName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    itemSub: { color: '#666', fontSize: 14 },
    itemValue: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    itemSubValue: { color: '#666', fontSize: 12 },

    emptyText: { color: '#666', textAlign: 'center', marginTop: 10 },
    explorerBtn: { marginTop: 20, backgroundColor: '#333', padding: 10, borderRadius: 8 }
});
