import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, TextInput, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import WalletManager from '../services/WalletManager';
import DatabaseService from '../services/DatabaseService';

export default function ManageWalletsScreen({ navigation, route }) {
    const { walletAddress, password } = route.params;
    const [wallets, setWallets] = useState([]);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importMnemonic, setImportMnemonic] = useState('');
    const [importPassword, setImportPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadWallets();
    }, []);

    const loadWallets = async () => {
        try {
            // Récupérer tous les wallets de la base de données
            const allWallets = await WalletManager.getWallets();
            setWallets(allWallets);
        } catch (error) {
            console.error('Error loading wallets:', error);
            Alert.alert('Erreur', 'Impossible de charger les wallets');
        }
    };

    const handleCreateNewWallet = async () => {
        Alert.alert(
            'Créer un nouveau Wallet',
            'Voulez-vous créer un nouveau wallet ? Une nouvelle phrase de récupération sera générée.',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Créer',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            const walletName = `Wallet ${Date.now()}`;
                            const newWallet = await WalletManager.createWallet(walletName, password);

                            Alert.alert('Succès', `Nouveau wallet créé !\n\nAdresse: ${newWallet.address.substring(0, 10)}...`, [
                                { text: 'OK', onPress: loadWallets }
                            ]);
                        } catch (error) {
                            Alert.alert('Erreur', error.message);
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleImportWallet = async () => {
        if (!importMnemonic.trim() || !importPassword.trim()) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs');
            return;
        }

        try {
            setLoading(true);
            const walletName = `Imported ${Date.now()}`;
            const importedWallet = await WalletManager.importWalletFromMnemonic(walletName, importMnemonic.trim(), importPassword);

            setShowImportModal(false);
            setImportMnemonic('');
            setImportPassword('');

            Alert.alert('Succès', `Wallet importé avec succès !\n\nAdresse: ${importedWallet.address.substring(0, 10)}...`, [
                { text: 'OK', onPress: loadWallets }
            ]);
        } catch (error) {
            Alert.alert('Erreur', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteWallet = (wallet) => {
        if (wallets.length === 1) {
            Alert.alert('Impossible', 'Vous devez avoir au moins un wallet actif');
            return;
        }

        Alert.alert(
            'Supprimer le Wallet',
            `⚠️ ATTENTION ⚠️\n\nVous êtes sur le point de supprimer le wallet:\n${wallet.address}\n\nAssurez-vous d'avoir sauvegardé votre phrase de récupération. Cette action est IRRÉVERSIBLE.`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await WalletManager.deleteWallet(wallet.address, password);
                            Alert.alert('Succès', 'Wallet supprimé');
                            loadWallets();
                        } catch (error) {
                            Alert.alert('Erreur', error.message);
                        }
                    }
                }
            ]
        );
    };

    const handleSwitchWallet = (wallet) => {
        Alert.alert(
            'Changer de Wallet',
            `Voulez-vous basculer vers ce wallet ?\n\n${wallet.address}`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Basculer',
                    onPress: async () => {
                        try {
                            await DatabaseService.setActiveWallet(wallet.address);
                            // Retourner au Home avec le nouveau wallet
                            navigation.navigate('Home', {
                                walletAddress: wallet.address,
                                password: password
                            });
                        } catch (error) {
                            Alert.alert('Erreur', error.message);
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#6200ee', '#3700b3']} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Gérer les Wallets</Text>
                    <View style={{ width: 24 }} />
                </View>
            </LinearGradient>

            <ScrollView style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>MES WALLETS ({wallets.length})</Text>

                    {wallets.map((wallet, index) => (
                        <View key={index} style={styles.walletCard}>
                            <View style={styles.walletInfo}>
                                <View style={[styles.walletIcon, wallet.address === walletAddress && styles.activeWalletIcon]}>
                                    <Ionicons
                                        name="wallet"
                                        size={24}
                                        color={wallet.address === walletAddress ? '#4CAF50' : '#6200ee'}
                                    />
                                </View>
                                <View style={styles.walletDetails}>
                                    <Text style={styles.walletName}>
                                        Wallet {index + 1}
                                        {wallet.address === walletAddress && (
                                            <Text style={styles.activeBadge}> • Actif</Text>
                                        )}
                                    </Text>
                                    <Text style={styles.walletAddress}>{wallet.address}</Text>
                                </View>
                            </View>

                            <View style={styles.walletActions}>
                                {wallet.address !== walletAddress && (
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => handleSwitchWallet(wallet)}
                                    >
                                        <Ionicons name="swap-horizontal" size={20} color="#2196F3" />
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => handleDeleteWallet(wallet)}
                                >
                                    <Ionicons name="trash-outline" size={20} color="#F44336" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ACTIONS</Text>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={handleCreateNewWallet}
                        disabled={loading}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: '#4CAF50' }]}>
                            <Ionicons name="add-circle" size={24} color="#fff" />
                        </View>
                        <View style={styles.actionText}>
                            <Text style={styles.actionTitle}>Créer un Nouveau Wallet</Text>
                            <Text style={styles.actionSubtitle}>Générer une nouvelle phrase de récupération</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>

                    
                </View>
            </ScrollView>

            {/* Modal d'importation */}
            <Modal
                visible={showImportModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowImportModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Importer un Wallet</Text>
                            <TouchableOpacity onPress={() => setShowImportModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Phrase de Récupération (12 mots)</Text>
                        <TextInput
                            style={styles.mnemonicInput}
                            placeholder="word1 word2 word3 ..."
                            value={importMnemonic}
                            onChangeText={setImportMnemonic}
                            multiline
                            numberOfLines={3}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <Text style={styles.inputLabel}>Mot de Passe Maître</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Entrez votre mot de passe"
                            value={importPassword}
                            onChangeText={setImportPassword}
                            secureTextEntry
                        />

                        <TouchableOpacity
                            style={styles.importButton}
                            onPress={handleImportWallet}
                            disabled={loading}
                        >
                            <Text style={styles.importButtonText}>
                                {loading ? 'Importation...' : 'Importer'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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

    walletCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
    walletInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    walletIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
    },
    activeWalletIcon: { backgroundColor: '#E8F5E9' },
    walletDetails: { flex: 1 },
    walletName: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 3 },
    activeBadge: { color: '#4CAF50', fontSize: 14 },
    walletAddress: { fontSize: 12, color: '#999', fontFamily: 'monospace' },
    walletActions: { flexDirection: 'row', gap: 10 },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center'
    },

    actionCard: {
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
    actionText: { flex: 1 },
    actionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 3 },
    actionSubtitle: { fontSize: 13, color: '#999' },

    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        width: '100%',
        maxWidth: 400
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    inputLabel: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8, marginTop: 10 },
    input: {
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        marginBottom: 15
    },
    mnemonicInput: {
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 15,
        fontSize: 14,
        marginBottom: 15,
        minHeight: 80,
        textAlignVertical: 'top',
        fontFamily: 'monospace'
    },
    importButton: {
        backgroundColor: '#6200ee',
        borderRadius: 12,
        padding: 15,
        alignItems: 'center',
        marginTop: 10
    },
    importButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
