import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import WalletManager from '../services/WalletManager';

export default function ChangePasswordScreen({ navigation, route }) {
    const { walletAddress, password: currentPassword } = route.params;

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const validatePassword = (password) => {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        return {
            isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers,
            minLength: password.length >= minLength,
            hasUpperCase,
            hasLowerCase,
            hasNumbers,
            hasSpecialChar
        };
    };

    const handleChangePassword = async () => {
        // Validation de l'ancien mot de passe
        const isValid = await WalletManager.verifyPassword(oldPassword);
        if (!isValid) {
            Alert.alert('Erreur', 'L\'ancien mot de passe est incorrect');
            return;
        }

        // Validation du nouveau mot de passe
        const validation = validatePassword(newPassword);
        if (!validation.isValid) {
            Alert.alert(
                'Mot de passe faible',
                'Le mot de passe doit contenir :\n' +
                `${validation.minLength ? '✓' : '✗'} Au moins 8 caractères\n` +
                `${validation.hasUpperCase ? '✓' : '✗'} Une lettre majuscule\n` +
                `${validation.hasLowerCase ? '✓' : '✗'} Une lettre minuscule\n` +
                `${validation.hasNumbers ? '✓' : '✗'} Un chiffre`
            );
            return;
        }

        // Vérification de la confirmation
        if (newPassword !== confirmPassword) {
            Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
            return;
        }

        // Vérifier que le nouveau mot de passe est différent de l'ancien
        if (oldPassword === newPassword) {
            Alert.alert('Erreur', 'Le nouveau mot de passe doit être différent de l\'ancien');
            return;
        }

        Alert.alert(
            'Confirmation',
            '⚠️ IMPORTANT ⚠️\n\n' +
            'Vous êtes sur le point de changer votre mot de passe maître.\n\n' +
            '• Assurez-vous de vous souvenir de ce nouveau mot de passe\n' +
            '• Conservez votre phrase de récupération en lieu sûr\n' +
            '• Vous devrez utiliser ce nouveau mot de passe pour toutes les futures connexions\n\n' +
            'Voulez-vous continuer ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Confirmer',
                    style: 'destructive',
                    onPress: performPasswordChange
                }
            ]
        );
    };

    const performPasswordChange = async () => {
        try {
            setLoading(true);

            // Récupérer le mnémonique du wallet actuel
            const mnemonic = await WalletManager.getMnemonic(walletAddress, oldPassword);

            if (!mnemonic) {
                throw new Error('Impossible de récupérer la phrase de récupération');
            }

            // Utiliser la méthode resetPasswordWithMnemonic
            await WalletManager.resetPasswordWithMnemonic(mnemonic, newPassword);

            Alert.alert(
                'Succès',
                'Votre mot de passe a été changé avec succès !\n\nVous allez être redirigé vers l\'écran de connexion.',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.replace('Login')
                    }
                ]
            );
        } catch (error) {
            console.error('Error changing password:', error);
            Alert.alert('Erreur', error.message || 'Impossible de changer le mot de passe');
        } finally {
            setLoading(false);
        }
    };

    const passwordStrength = validatePassword(newPassword);

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#6200ee', '#3700b3']} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Changer le Mot de Passe</Text>
                    <View style={{ width: 24 }} />
                </View>
            </LinearGradient>

            <ScrollView style={styles.content}>
                {/* Information Card */}
                <View style={styles.infoCard}>
                    <Ionicons name="shield-checkmark" size={32} color="#6200ee" />
                    <Text style={styles.infoTitle}>Sécurité de votre Wallet</Text>
                    <Text style={styles.infoText}>
                        Votre mot de passe maître protège l'accès à votre wallet.
                        Choisissez un mot de passe fort et unique que vous n'utilisez nulle part ailleurs.
                    </Text>
                </View>

                {/* Ancien mot de passe */}
                <View style={styles.inputSection}>
                    <Text style={styles.label}>Ancien Mot de Passe</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Entrez votre ancien mot de passe"
                            value={oldPassword}
                            onChangeText={setOldPassword}
                            secureTextEntry={!showOldPassword}
                            autoCapitalize="none"
                        />
                        <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)}>
                            <Ionicons
                                name={showOldPassword ? "eye-off-outline" : "eye-outline"}
                                size={20}
                                color="#999"
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Nouveau mot de passe */}
                <View style={styles.inputSection}>
                    <Text style={styles.label}>Nouveau Mot de Passe</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="key-outline" size={20} color="#999" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Entrez votre nouveau mot de passe"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry={!showNewPassword}
                            autoCapitalize="none"
                        />
                        <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                            <Ionicons
                                name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                                size={20}
                                color="#999"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Indicateur de force du mot de passe */}
                    {newPassword.length > 0 && (
                        <View style={styles.strengthIndicator}>
                            <View style={styles.strengthItem}>
                                <Ionicons
                                    name={passwordStrength.minLength ? "checkmark-circle" : "close-circle"}
                                    size={16}
                                    color={passwordStrength.minLength ? "#4CAF50" : "#ccc"}
                                />
                                <Text style={[styles.strengthText, passwordStrength.minLength && styles.strengthTextValid]}>
                                    8 caractères minimum
                                </Text>
                            </View>
                            <View style={styles.strengthItem}>
                                <Ionicons
                                    name={passwordStrength.hasUpperCase ? "checkmark-circle" : "close-circle"}
                                    size={16}
                                    color={passwordStrength.hasUpperCase ? "#4CAF50" : "#ccc"}
                                />
                                <Text style={[styles.strengthText, passwordStrength.hasUpperCase && styles.strengthTextValid]}>
                                    Une majuscule
                                </Text>
                            </View>
                            <View style={styles.strengthItem}>
                                <Ionicons
                                    name={passwordStrength.hasLowerCase ? "checkmark-circle" : "close-circle"}
                                    size={16}
                                    color={passwordStrength.hasLowerCase ? "#4CAF50" : "#ccc"}
                                />
                                <Text style={[styles.strengthText, passwordStrength.hasLowerCase && styles.strengthTextValid]}>
                                    Une minuscule
                                </Text>
                            </View>
                            <View style={styles.strengthItem}>
                                <Ionicons
                                    name={passwordStrength.hasNumbers ? "checkmark-circle" : "close-circle"}
                                    size={16}
                                    color={passwordStrength.hasNumbers ? "#4CAF50" : "#ccc"}
                                />
                                <Text style={[styles.strengthText, passwordStrength.hasNumbers && styles.strengthTextValid]}>
                                    Un chiffre
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Confirmation du mot de passe */}
                <View style={styles.inputSection}>
                    <Text style={styles.label}>Confirmer le Nouveau Mot de Passe</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="key-outline" size={20} color="#999" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Confirmez votre nouveau mot de passe"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                            autoCapitalize="none"
                        />
                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                            <Ionicons
                                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                                size={20}
                                color="#999"
                            />
                        </TouchableOpacity>
                    </View>
                    {confirmPassword.length > 0 && (
                        <View style={styles.matchIndicator}>
                            {newPassword === confirmPassword ? (
                                <View style={styles.matchSuccess}>
                                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                                    <Text style={styles.matchSuccessText}>Les mots de passe correspondent</Text>
                                </View>
                            ) : (
                                <View style={styles.matchError}>
                                    <Ionicons name="close-circle" size={16} color="#F44336" />
                                    <Text style={styles.matchErrorText}>Les mots de passe ne correspondent pas</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* Bouton de changement */}
                <TouchableOpacity
                    style={[styles.changeButton, loading && styles.changeButtonDisabled]}
                    onPress={handleChangePassword}
                    disabled={loading || !oldPassword || !newPassword || !confirmPassword}
                >
                    <LinearGradient
                        colors={loading ? ['#ccc', '#999'] : ['#6200ee', '#3700b3']}
                        style={styles.changeButtonGradient}
                    >
                        <Ionicons name="shield-checkmark" size={20} color="#fff" />
                        <Text style={styles.changeButtonText}>
                            {loading ? 'Changement en cours...' : 'Changer le Mot de Passe'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Warning */}
                <View style={styles.warningBox}>
                    <Ionicons name="warning" size={20} color="#FF9800" />
                    <Text style={styles.warningText}>
                        N'oubliez pas votre nouveau mot de passe ! Il n'y a aucun moyen de le récupérer.
                        Assurez-vous d'avoir sauvegardé votre phrase de récupération.
                    </Text>
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

    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginBottom: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2
    },
    infoTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 10, marginBottom: 8 },
    infoText: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },

    inputSection: { marginBottom: 25 },
    label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, paddingVertical: 15, fontSize: 16, color: '#333' },

    strengthIndicator: { marginTop: 10, backgroundColor: '#f9f9f9', borderRadius: 8, padding: 10 },
    strengthItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    strengthText: { fontSize: 13, color: '#999', marginLeft: 8 },
    strengthTextValid: { color: '#4CAF50' },

    matchIndicator: { marginTop: 10 },
    matchSuccess: { flexDirection: 'row', alignItems: 'center' },
    matchSuccessText: { fontSize: 13, color: '#4CAF50', marginLeft: 8 },
    matchError: { flexDirection: 'row', alignItems: 'center' },
    matchErrorText: { fontSize: 13, color: '#F44336', marginLeft: 8 },

    changeButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 10,
        marginBottom: 20
    },
    changeButtonDisabled: { opacity: 0.6 },
    changeButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
    },
    changeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },

    warningBox: {
        flexDirection: 'row',
        backgroundColor: '#FFF3E0',
        borderRadius: 12,
        padding: 15,
        borderWidth: 1,
        borderColor: '#FFE0B2',
        marginBottom: 30
    },
    warningText: { flex: 1, fontSize: 13, color: '#E65100', marginLeft: 10, lineHeight: 18 }
});
