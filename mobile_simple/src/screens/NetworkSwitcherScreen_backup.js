import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import BlockchainService, { NETWORKS } from '../services/BlockchainService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/theme';

export default function NetworkSwitcherScreen({ navigation }) {
    const [currentNetwork, setCurrentNetwork] = useState(NETWORKS.hardhat);
    const [testMode, setTestMode] = useState(true);

    useEffect(() => {
        loadNetworkSettings();
    }, []);

    const loadNetworkSettings = async () => {
        try {
            const savedNetwork = await AsyncStorage.getItem('selectedNetwork');
            const savedTestMode = await AsyncStorage.getItem('testMode');

            if (savedNetwork) {
                const network = NETWORKS[savedNetwork];
                if (network) {
                    setCurrentNetwork(network);
                    BlockchainService.setNetwork(savedNetwork);
                }
            }

            if (savedTestMode !== null) {
                setTestMode(savedTestMode === 'true');
            }
        } catch (error) {
            console.error('Error loading network settings:', error);
        }
    };

    const handleNetworkChange = async (networkKey) => {
        const network = NETWORKS[networkKey];

        if (networkKey === 'mainnet') {
            Alert.alert(
                '⚠️ ATTENTION - RÉSEAU PRINCIPAL',
                'Vous êtes sur le point de basculer vers le réseau Ethereum Mainnet.\n\n' +
                '• Les transactions utiliseront de VRAIS ETH\n' +
                '• Les frais de gas seront RÉELS et COÛTEUX\n' +
                '• Toute erreur peut entraîner une PERTE DÉFINITIVE de fonds\n\n' +
                'Êtes-vous absolument certain de vouloir continuer ?',
                [
                    { text: 'Annuler', style: 'cancel' },
                    {
                        text: 'Je comprends les risques',
                        style: 'destructive',
                        onPress: async () => {
                            await switchNetwork(networkKey, network);
                        }
                    }
                ]
            );
        } else {
            await switchNetwork(networkKey, network);
        }
    };

    const switchNetwork = async (networkKey, network) => {
        try {
            const success = BlockchainService.setNetwork(networkKey);

            if (success) {
                setCurrentNetwork(network);
                await AsyncStorage.setItem('selectedNetwork', networkKey);

                Alert.alert(
                    'Réseau Changé',
                    `Vous êtes maintenant connecté à ${network.name}`,
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            } else {
                Alert.alert('Erreur', 'Impossible de changer de réseau');
            }
        } catch (error) {
            Alert.alert('Erreur', error.message);
        }
    };

    const toggleTestMode = async (value) => {
        setTestMode(value);
        await AsyncStorage.setItem('testMode', value.toString());

        if (!value && currentNetwork.chainId === 1) {
            Alert.alert(
                'Mode Test Désactivé',
                'Attention : Vous êtes sur le Mainnet sans mode test. Soyez extrêmement prudent !'
            );
        }
    };

    const networkList = [
        {
            key: 'hardhat',
            network: NETWORKS.hardhat,
            icon: 'server-outline',
            color: COLORS.primary,
            recommended: true
        },
        {
            key: 'mainnet',
            network: NETWORKS.mainnet,
            icon: 'globe-outline',
            color: COLORS.error,
            warning: true
        }
    ];

    return (
        <View style={styles.container}>
            <LinearGradient colors={[COLORS.primary, '#3700b3']} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Sélection du Réseau</Text>
                    <View style={{ width: 24 }} />
                </View>
            </LinearGradient>

            <ScrollView style={styles.content}>
                {/* Réseau actuel */}
                <View style={styles.currentNetworkCard}>
                    <View style={styles.currentNetworkHeader}>
                        <Ionicons name="wifi" size={24} color={COLORS.success} />
                        <Text style={styles.currentNetworkLabel}>RÉSEAU ACTUEL</Text>
                    </View>
                    <Text style={styles.currentNetworkName}>{currentNetwork.name}</Text>
                    <View style={styles.networkDetails}>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Devise:</Text>
                            <Text style={styles.detailValue}>{currentNetwork.currency}</Text>
                        </View>

                    </View>
                </View>

                {/* Mode Test */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>SÉCURITÉ</Text>
                    <View style={styles.testModeCard}>
                        <View style={styles.testModeInfo}>
                            <Ionicons name="shield-checkmark" size={24} color={COLORS.warning} />
                            <View style={styles.testModeText}>
                                <Text style={styles.testModeTitle}>Mode Test</Text>
                                <Text style={styles.testModeSubtitle}>
                                    Avertissements avant transactions Mainnet
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={testMode}
                            onValueChange={toggleTestMode}
                            trackColor={{ false: '#ccc', true: COLORS.success }}
                            thumbColor={testMode ? '#fff' : '#f4f3f4'}
                        />
                    </View>
                </View>

                {/* Liste des réseaux */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>RÉSEAUX DISPONIBLES</Text>

                    {networkList.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.networkCard,
                                currentNetwork.chainId === item.network.chainId && styles.activeNetworkCard
                            ]}
                            onPress={() => handleNetworkChange(item.key)}
                        >
                            <View style={[styles.networkIcon, { backgroundColor: item.color }]}>
                                <Ionicons name={item.icon} size={24} color="#fff" />
                            </View>

                            <View style={styles.networkInfo}>
                                <View style={styles.networkTitleRow}>
                                    <Text style={styles.networkName}>{item.network.name}</Text>
                                    {item.recommended && (
                                        <View style={styles.recommendedBadge}>
                                            <Text style={styles.recommendedText}>Recommandé</Text>
                                        </View>
                                    )}
                                    {item.warning && (
                                        <View style={styles.warningBadge}>
                                            <Ionicons name="warning" size={12} color="#fff" />
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.networkSubtitle}>
                                    Chain ID: {item.network.chainId} • {item.network.currency}
                                </Text>
                            </View>

                            {currentNetwork.chainId === item.network.chainId && (
                                <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Informations importantes */}
                <View style={styles.infoBox}>
                    <Ionicons name="information-circle" size={24} color={COLORS.info} />
                    <View style={styles.infoText}>
                        <Text style={styles.infoTitle}>À propos des réseaux</Text>
                        <Text style={styles.infoDescription}>
                            • <Text style={styles.bold}>Nexora Private Chain</Text> : Réseau de développement local, idéal pour les tests{'\n'}
                            • <Text style={styles.bold}>Ethereum Mainnet</Text> : Réseau principal avec de vrais ETH et frais réels
                        </Text>
                    </View>
                </View>

                {currentNetwork.chainId === 1 && (
                    <View style={[styles.infoBox, { backgroundColor: '#FFEBEE', borderColor: '#FFCDD2' }]}>
                        <Ionicons name="warning" size={24} color={COLORS.error} />
                        <View style={styles.infoText}>
                            <Text style={[styles.infoTitle, { color: COLORS.error }]}>⚠️ Mode Mainnet Actif</Text>
                            <Text style={styles.infoDescription}>
                                Vous êtes connecté au réseau principal Ethereum. Toutes les transactions utiliseront de vrais ETH. Soyez extrêmement prudent !
                            </Text>
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { paddingTop: 50, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backButton: { padding: 5 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },

    content: { flex: 1, padding: 20 },
    section: { marginBottom: 30 },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#666', marginBottom: 15, marginLeft: 5, textTransform: 'uppercase', letterSpacing: 1 },

    currentNetworkCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4
    },
    currentNetworkHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10
    },
    currentNetworkLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.success,
        marginLeft: 8,
        letterSpacing: 1
    },
    currentNetworkName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 15
    },
    networkDetails: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 15
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    detailLabel: { fontSize: 14, color: '#999' },
    detailValue: { fontSize: 14, color: '#333', fontWeight: '500', flex: 1, textAlign: 'right' },

    testModeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2
    },
    testModeInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    testModeText: { marginLeft: 15, flex: 1 },
    testModeTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 3 },
    testModeSubtitle: { fontSize: 13, color: '#999' },

    networkCard: {
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
        elevation: 2,
        borderWidth: 2,
        borderColor: 'transparent'
    },
    activeNetworkCard: {
        borderColor: COLORS.success,
        backgroundColor: '#F1F8F4'
    },
    networkIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
    },
    networkInfo: { flex: 1 },
    networkTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 3
    },
    networkName: { fontSize: 16, fontWeight: '600', color: '#333', marginRight: 8 },
    networkSubtitle: { fontSize: 13, color: '#999' },
    recommendedBadge: {
        backgroundColor: COLORS.success,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        marginLeft: 5
    },
    recommendedText: { fontSize: 10, color: '#fff', fontWeight: 'bold' },
    warningBadge: {
        backgroundColor: COLORS.error,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 5
    },

    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#E3F2FD',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#BBDEFB'
    },
    infoText: { flex: 1, marginLeft: 12 },
    infoTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.info, marginBottom: 5 },
    infoDescription: { fontSize: 13, color: '#666', lineHeight: 20 },
    bold: { fontWeight: 'bold' }
});
