import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BalanceCard({ totalBalance, isNonCustodial }) {
    return (
        <View style={styles.balanceContainer}>
            <Text style={styles.totalLabel}>Portefeuille Web3</Text>
            <Text style={styles.totalValue}>${totalBalance.toFixed(2)}</Text>

            {isNonCustodial && (
                <View style={styles.badge}>
                    <Ionicons name="shield-checkmark" size={16} color="#2ecc71" />
                    <Text style={styles.badgeText}>Clés stockées localement</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    balanceContainer: { alignItems: 'center', paddingVertical: 30 },
    totalLabel: { color: '#aaa', fontSize: 14, marginBottom: 5 },
    totalValue: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 15,
        backgroundColor: 'rgba(46, 204, 113, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15
    },
    badgeText: { color: '#2ecc71', marginLeft: 5, fontSize: 12, fontWeight: '600' }
});
