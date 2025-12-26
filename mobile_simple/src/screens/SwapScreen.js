import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import WalletManager from '../services/WalletManager';
import BlockchainService, { NETWORKS } from '../services/BlockchainService';
import DatabaseService from '../services/DatabaseService';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function SwapScreen({ navigation }) {
    const { password, isUnlocked } = useAuth();
    const [fromNetwork, setFromNetwork] = useState(NETWORKS.hardhat);
    const [toNetwork, setToNetwork] = useState(NETWORKS.novalink || NETWORKS.mainnet); // Default target
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [balance, setBalance] = useState('0');
    const [wallet, setWallet] = useState(null);

    useEffect(() => {
        if (!isUnlocked || !password) {
            Alert.alert("Session expirée", "Veuillez vous reconnecter.");
            navigation.navigate('Login');
            return;
        }
        loadWalletData();
    }, [isUnlocked, password, fromNetwork]); // Reload when fromNetwork changes

    const loadWalletData = async () => {
        const activeWallet = await WalletManager.getActiveWallet(password);
        if (activeWallet) {
            setWallet(activeWallet);
            // Switch to fromNetwork and get balance
            try {
                // Determine which network key to use
                // Nexora = 1337, NovaLink = 31337
                const networkKey = fromNetwork.chainId === 1337 ? 'hardhat' : 'novalink';
                await BlockchainService.setNetwork(networkKey);
                const bal = await BlockchainService.getBalance(activeWallet.address);
                setBalance(bal);
            } catch (e) {
                console.error("Error loading balance", e);
            }
        }
    };

    const handleSwap = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            Alert.alert("Erreur", "Montant invalide");
            return;
        }

        // Reserve 0.01 ETH for gas fees
        const gasReserve = 0.01;
        const totalNeeded = parseFloat(amount) + gasReserve;

        if (totalNeeded > parseFloat(balance)) {
            Alert.alert(
                "Solde insuffisant",
                `Vous avez besoin de ${totalNeeded.toFixed(4)} ${fromNetwork.currency} (${amount} pour le swap + ${gasReserve} pour les frais de gas).\n\nSolde actuel: ${parseFloat(balance).toFixed(4)} ${fromNetwork.currency}`
            );
            return;
        }

        setLoading(true);
        try {
            // CRITICAL: Ensure we're on the SOURCE network and have the correct wallet
            const networkKey = fromNetwork.chainId === 1337 ? 'hardhat' : 'novalink';
            BlockchainService.setNetwork(networkKey);

            // Reload wallet to ensure it's derived for the correct network
            const sourceWallet = await WalletManager.getActiveWallet(password);

            if (!sourceWallet) {
                throw new Error("Impossible de charger le portefeuille");
            }

            console.log(`[Swap] Source Network: ${fromNetwork.name}, Wallet Address: ${sourceWallet.address}`);

            // 1. Burn / Send on Source Network
            const bridgeAddress = "0x000000000000000000000000000000000000dEaD"; // standard burn or bridge

            const tx = await BlockchainService.sendTransaction(sourceWallet, bridgeAddress, amount);
            console.log(`Swap Step 1: Sent ${amount} on ${fromNetwork.name}. Hash: ${tx.hash}`);

            // 2. Automatic Bridge Completion via Faucet API
            // Calculate converted amount based on exchange rate
            // Nexora (1337) -> NovaLink (31337) : rate 1.333
            // NovaLink (31337) -> Nexora (1337) : rate 0.75
            const conversionRate = fromNetwork.chainId === 1337 ? 1.333 : 0.75;
            const convertedAmount = (parseFloat(amount) * conversionRate).toFixed(4);

            // Determine target network for faucet API
            const targetNetworkKey = toNetwork.chainId === 1337 ? 'nexora' : 'novalink';

            // Get the CORRECT destination address for the target network
            // (Because NovaLink uses a derived address, distinct from Nexora)
            const recipientAddress = await WalletManager.getWalletAddressForNetwork(toNetwork.chainId, password);

            if (!recipientAddress) {
                throw new Error("Impossible de déterminer l'adresse de destination");
            }

            console.log(`Swap Step 2: Requesting ${convertedAmount} ${toNetwork.currency} on ${toNetwork.name} for ${recipientAddress}...`);

            try {
                // Call faucet API to credit destination network
                // Use local IP for direct access on same WiFi network
                const faucetResponse = await fetch('http://192.168.1.16:4000/api/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        address: recipientAddress, // Use the correct derived address
                        amount: convertedAmount,
                        network: targetNetworkKey
                    })
                });

                const faucetData = await faucetResponse.json();

                if (!faucetResponse.ok) {
                    throw new Error(faucetData.error || 'Faucet API error');
                }

                console.log(`Swap Step 2 Complete: ${convertedAmount} ${toNetwork.currency} credited. Hash: ${faucetData.txHash}`);

                // Log successful swap in DB
                await DatabaseService.addTransaction({
                    wallet_address: sourceWallet.address, // Source wallet logs the swap
                    hash: faucetData.txHash,
                    from_address: 'Bridge',
                    to_address: recipientAddress,
                    value: convertedAmount,
                    token_symbol: toNetwork.currency,
                    timestamp: Date.now(),
                    status: 'Swap Completed'
                });

            } catch (bridgeError) {
                console.error('Bridge completion error:', bridgeError);
                // Even if bridge fails, the burn succeeded, so we log it
                await DatabaseService.addTransaction({
                    wallet_address: sourceWallet.address,
                    hash: tx.hash,
                    from_address: sourceWallet.address,
                    to_address: bridgeAddress,
                    value: amount,
                    token_symbol: fromNetwork.currency,
                    timestamp: Date.now(),
                    status: 'Swap Burn Only (Bridge Failed)'
                });

                Alert.alert(
                    "Swap Partiellement Réussi",
                    `Les fonds ont été brûlés sur ${fromNetwork.name}, mais le crédit sur ${toNetwork.name} a échoué.\n\nErreur: ${bridgeError.message}\n\nVeuillez contacter le support.`
                );
                setLoading(false);
                return;
            }

            // Allow some time for UI effect
            await new Promise(r => setTimeout(r, 1000));

            Alert.alert(
                "✅ Swap Réussi !",
                `${amount} ${fromNetwork.currency} swappés avec succès !\n\nVous avez reçu ${convertedAmount} ${toNetwork.currency} sur ${toNetwork.name}.\n\nChangez de réseau pour voir votre nouveau solde.`,
                [{
                    text: "OK",
                    onPress: () => {
                        setAmount('');
                        loadWalletData();
                        navigation.goBack();
                    }
                }]
            );

        } catch (error) {
            console.error(error);
            Alert.alert("Echec", "Le swap a échoué.");
        } finally {
            setLoading(false);
        }
    };

    // NEXORA (1337) = Purple (#6200ee), NOVALINK (31337) = Cyan (#00bcd4)
    const isNexora = (network) => network.chainId === 1337;

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Bridge / Swap</Text>

            {/* Swap Card */}
            <View style={styles.card}>

                {/* FROM */}
                <View style={styles.networkRow}>
                    <Text style={styles.label}>De :</Text>
                    <View style={[styles.networkBadge, {
                        backgroundColor: isNexora(fromNetwork) ? '#EDE7F6' : '#e0f7fa'
                    }]}>
                        <View style={[styles.dot, {
                            backgroundColor: isNexora(fromNetwork) ? '#6200ee' : '#00bcd4'
                        }]} />
                        <Text style={[styles.networkName, {
                            color: isNexora(fromNetwork) ? '#6200ee' : '#006064'
                        }]}>{fromNetwork.name}</Text>
                    </View>
                </View>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="0.0"
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={setAmount}
                    />
                    <Text style={styles.currency}>{fromNetwork.currency}</Text>
                </View>
                <Text style={styles.balance}>Solde: {parseFloat(balance).toFixed(4)}</Text>

                {/* SWAP DIRECTION BUTTON */}
                <TouchableOpacity
                    style={styles.swapButton}
                    onPress={() => {
                        // Swap the networks
                        const temp = fromNetwork;
                        setFromNetwork(toNetwork);
                        setToNetwork(temp);
                        // Reload balance for new source network
                        loadWalletData();
                    }}
                >
                    <View style={styles.swapButtonInner}>
                        <Ionicons name="swap-vertical" size={24} color={isNexora(fromNetwork) ? '#6200ee' : '#00bcd4'} />
                    </View>
                </TouchableOpacity>

                {/* TO */}
                <View style={styles.networkRow}>
                    <Text style={styles.label}>Vers :</Text>
                    <View style={[styles.networkBadge, {
                        backgroundColor: isNexora(toNetwork) ? '#EDE7F6' : '#e0f7fa'
                    }]}>
                        <View style={[styles.dot, {
                            backgroundColor: isNexora(toNetwork) ? '#6200ee' : '#00bcd4'
                        }]} />
                        <Text style={[styles.networkName, {
                            color: isNexora(toNetwork) ? '#6200ee' : '#006064'
                        }]}>{toNetwork.name || "NovaLink"}</Text>
                    </View>
                </View>

                {/* Exchange Rate Display */}
                <View style={styles.rateContainer}>
                    <Ionicons name="information-circle-outline" size={16} color="#999" />
                    <Text style={styles.rateText}>
                        Taux: 1 {fromNetwork.currency} = {isNexora(fromNetwork) ? '1.333' : '0.75'} {toNetwork.currency}
                    </Text>
                </View>

                <View style={[styles.inputContainer, { backgroundColor: '#f0f0f0' }]}>
                    <Text style={[styles.input, { color: '#888' }]}>
                        {amount ? (parseFloat(amount) * (isNexora(fromNetwork) ? 1.333 : 0.75)).toFixed(4) : "0.0"}
                    </Text>
                    <Text style={styles.currency}>{toNetwork.currency || "NVL"}</Text>
                </View>

                <Text style={styles.estimateText}>
                    ≈ ${amount ? (parseFloat(amount) * (isNexora(fromNetwork) ? 2000 : 1500)).toFixed(2) : '0.00'} USD
                </Text>
            </View>

            <TouchableOpacity
                style={[styles.button, loading && styles.disabled, {
                    backgroundColor: isNexora(fromNetwork) ? '#6200ee' : '#00bcd4',
                    shadowColor: isNexora(fromNetwork) ? '#6200ee' : '#00bcd4'
                }]}
                onPress={handleSwap}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Swapper</Text>}
            </TouchableOpacity>

            <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={20} color={COLORS.info} />
                <Text style={styles.infoText}>
                    Le cross-chain swap peut prendre quelques minutes. Les frais de gaz sont payés sur le réseau source.
                </Text>
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, backgroundColor: COLORS.background, padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 20, textAlign: 'center' },
    card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },

    networkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    label: { fontSize: 16, fontWeight: '600', color: '#666' },
    networkBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EDE7F6', padding: 8, borderRadius: 12 },
    networkName: { fontWeight: 'bold', color: COLORS.primary, marginLeft: 5 },
    dot: { width: 8, height: 8, borderRadius: 4 },

    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 12, paddingHorizontal: 15, height: 60, marginBottom: 5, borderWidth: 1, borderColor: '#eee' },
    input: { flex: 1, fontSize: 24, fontWeight: 'bold', color: '#333' },
    currency: { fontSize: 18, fontWeight: '600', color: '#999' },

    balance: { fontSize: 12, color: '#999', textAlign: 'right', marginBottom: 10 },

    rateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 8,
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#f9f9f9',
        borderRadius: 8
    },
    rateText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 6,
        fontWeight: '500'
    },
    estimateText: {
        fontSize: 13,
        color: '#999',
        textAlign: 'right',
        marginTop: 5,
        fontWeight: '500'
    },

    swapButton: {
        alignSelf: 'center',
        marginVertical: 15,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3
    },
    swapButtonInner: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: COLORS.background
    },

    button: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 30, shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowOffset: { height: 4 }, elevation: 8 },
    disabled: { opacity: 0.7 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

    infoBox: { flexDirection: 'row', marginTop: 30, padding: 15, backgroundColor: '#E1F5FE', borderRadius: 10 },
    infoText: { flex: 1, marginLeft: 10, color: '#0277BD', fontSize: 13, lineHeight: 18 }
});
