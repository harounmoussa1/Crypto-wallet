import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ActionButton = ({ icon, label, onPress, color = '#6200EE' }) => (
    <TouchableOpacity style={styles.actionBtnContainer} onPress={onPress}>
        <View style={[styles.actionBtnCircle, { backgroundColor: color }]}>
            <Ionicons name={icon} size={24} color="#fff" />
        </View>
        <Text style={styles.actionBtnLabel}>{label}</Text>
    </TouchableOpacity>
);

export default function ActionButtons({ onSend, onReceive, onSwap, onBuy }) {
    return (
        <View style={styles.actionsRow}>
            <ActionButton icon="arrow-up" label="Envoyer" onPress={onSend} color="#333" />
            <ActionButton icon="arrow-down" label="Recevoir" onPress={onReceive} color="#333" />
            <ActionButton icon="swap-horizontal" label="Swap" onPress={onSwap} color="#333" />
            <ActionButton icon="cart" label="Acheter" onPress={onBuy} color="#333" />
        </View>
    );
}

const styles = StyleSheet.create({
    actionsRow: { flexDirection: 'row', justifyContent: 'space-evenly', marginBottom: 30 },
    actionBtnContainer: { alignItems: 'center', gap: 8 },
    actionBtnCircle: { width: 45, height: 45, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
    actionBtnLabel: { color: '#fff', fontSize: 12 },
});
