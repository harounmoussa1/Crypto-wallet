import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Share, Alert, ScrollView } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import DatabaseService from '../services/DatabaseService';

export default function ReceiveScreen({ route }) {
    const [address, setAddress] = useState(route.params?.address || '');

    useEffect(() => {
        if (!address) {
            loadActiveWalletAddress();
        }
    }, [address]);

    const loadActiveWalletAddress = async () => {
        try {
            const wallets = await DatabaseService.getWallets();
            const active = wallets.find(w => w.is_active);
            if (active) {
                setAddress(active.address);
            }
        } catch (e) {
            console.error("Error loading address:", e);
        }
    };

    const copyToClipboard = async () => {
        if (!address) return;
        await Clipboard.setStringAsync(address);
        Alert.alert("Copié", "L'adresse a été copiée.");
    };

    const handleShare = async () => {
        if (!address) return;
        try {
            await Share.share({ message: address });
        } catch (error) {
            console.error(error.message);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.qrCard}>
                {address ? (
                    <QRCode
                        value={address}
                        size={180}
                        color="#000000"
                        backgroundColor="#ffffff"
                    />
                ) : (
                    <View style={{ width: 180, height: 180, justifyContent: 'center', alignItems: 'center' }}>
                        <Text>Chargement...</Text>
                    </View>
                )}
            </View>

            <Text style={styles.addressLabel}>Votre adresse publique :</Text>
            <TouchableOpacity style={styles.addressContainer} onPress={copyToClipboard}>
                <Text style={styles.addressText} numberOfLines={2}>{address || '...'}</Text>
            </TouchableOpacity>

            <View style={styles.buttonRow}>
                <TouchableOpacity style={[styles.button, styles.copyButton]} onPress={copyToClipboard}>
                    <Text style={styles.buttonTextPrimary}>Copier</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, styles.shareButton]} onPress={handleShare}>
                    <Text style={styles.buttonTextSecondary}>Partager</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, backgroundColor: '#fff', padding: 30, alignItems: 'center' },
    qrCard: {
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 24,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        marginBottom: 40,
        alignItems: 'center',
        justifyContent: 'center'
    },
    addressLabel: { color: '#888', marginBottom: 15, fontSize: 14, fontWeight: '500' },
    addressContainer: { backgroundColor: '#f5f5f5', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 15, width: '100%', marginBottom: 40 },
    addressText: { fontSize: 14, textAlign: 'center', color: '#333', fontWeight: 'bold' },

    buttonRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
    button: { flex: 0.48, padding: 18, borderRadius: 16, alignItems: 'center' },
    copyButton: { backgroundColor: '#6200ee' },
    shareButton: { backgroundColor: '#f0f0f0' },

    buttonTextPrimary: { color: '#ffffff', fontWeight: 'bold' },
    buttonTextSecondary: { color: '#333', fontWeight: 'bold' },
});
