# 🔄 Architecture et Flux de Données - Paramètres

## 📐 Architecture Globale

```
┌─────────────────────────────────────────────────────────────┐
│                      ÉCRANS (Screens)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Manage     │  │   Network    │  │   Change     │      │
│  │   Wallets    │  │   Switcher   │  │   Password   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                     SERVICES (Logic)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Wallet     │  │  Blockchain  │  │   Database   │      │
│  │   Service    │  │   Service    │  │   Service    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   STOCKAGE (Storage)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    SQLite    │  │ AsyncStorage │  │   Ethers.js  │      │
│  │   Database   │  │  (Settings)  │  │   Provider   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔀 Flux de Données par Fonctionnalité

### 1️⃣ Gestion des Wallets

#### Création de Wallet
```
User Action: "Créer un nouveau wallet"
    │
    ├─► ManageWalletsScreen
    │       │
    │       └─► WalletService.createWallet(password)
    │               │
    │               ├─► ethers.Wallet.createRandom()
    │               │       └─► Génère: { address, mnemonic, privateKey }
    │               │
    │               └─► Return wallet
    │
    ├─► DatabaseService.saveWallet({ address, mnemonic, password })
    │       │
    │       ├─► encryptMnemonic(mnemonic, password)
    │       │       └─► XOR encryption + Base64
    │       │
    │       └─► SQLite INSERT INTO wallets
    │               └─► Stocke: { name, address, encrypted_mnemonic }
    │
    └─► UI Update: Affiche le nouveau wallet dans la liste
```

#### Importation de Wallet
```
User Input: Phrase mnémonique + Mot de passe
    │
    ├─► ManageWalletsScreen (Modal)
    │       │
    │       └─► WalletService.importWallet(mnemonic, password)
    │               │
    │               └─► ethers.Wallet.fromMnemonic(mnemonic)
    │                       └─► Valide et crée wallet
    │
    ├─► DatabaseService.saveWallet({ address, mnemonic, password })
    │       └─► Même processus que création
    │
    └─► UI Update: Ferme modal, affiche wallet importé
```

#### Changement de Wallet Actif
```
User Action: Clic sur "Basculer"
    │
    ├─► ManageWalletsScreen
    │       │
    │       └─► navigation.navigate('Dashboard', { walletAddress: newAddress })
    │               │
    │               └─► Dashboard recharge avec nouveau wallet
    │
    └─► DatabaseService.setActiveWallet(address)
            └─► SQLite UPDATE wallets SET is_active = 1 WHERE address = ?
```

#### Suppression de Wallet
```
User Action: Clic sur "Supprimer" + Confirmation
    │
    ├─► Vérification: wallets.length > 1 ?
    │       │
    │       ├─► OUI: Continue
    │       └─► NON: Alert "Impossible"
    │
    ├─► DatabaseService.deleteWallet(address)
    │       │
    │       └─► SQLite DELETE FROM wallets WHERE address = ?
    │
    └─► UI Update: Recharge la liste des wallets
```

---

### 2️⃣ Sélection de Réseau

#### Chargement Initial
```
Screen Mount: useEffect()
    │
    ├─► AsyncStorage.getItem('selectedNetwork')
    │       └─► Récupère: "hardhat" ou "mainnet"
    │
    ├─► AsyncStorage.getItem('testMode')
    │       └─► Récupère: "true" ou "false"
    │
    ├─► BlockchainService.setNetwork(networkKey)
    │       │
    │       └─► Crée nouveau JsonRpcProvider avec RPC URL
    │
    └─► UI Update: Affiche réseau actuel
```

#### Changement de Réseau
```
User Action: Sélection d'un réseau
    │
    ├─► networkKey === 'mainnet' ?
    │       │
    │       ├─► OUI: Alert avec avertissement sécurité
    │       │       └─► Utilisateur confirme ?
    │       │               ├─► OUI: Continue
    │       │               └─► NON: Annule
    │       │
    │       └─► NON: Continue directement
    │
    ├─► BlockchainService.setNetwork(networkKey)
    │       │
    │       ├─► this.currentNetwork = NETWORKS[networkKey]
    │       │
    │       └─► this.provider = new JsonRpcProvider(rpcUrl, config)
    │
    ├─► AsyncStorage.setItem('selectedNetwork', networkKey)
    │       └─► Persiste le choix
    │
    └─► UI Update: Affiche nouveau réseau + navigation.goBack()
```

#### Toggle Mode Test
```
User Action: Switch ON/OFF
    │
    ├─► setTestMode(value)
    │       │
    │       └─► AsyncStorage.setItem('testMode', value.toString())
    │
    └─► value === false && currentNetwork.chainId === 1 ?
            │
            └─► Alert: "Attention, Mainnet sans mode test !"
```

---

### 3️⃣ Changement de Mot de Passe

#### Validation en Temps Réel
```
User Input: Nouveau mot de passe (onChange)
    │
    ├─► validatePassword(newPassword)
    │       │
    │       ├─► Check minLength >= 8
    │       ├─► Check hasUpperCase
    │       ├─► Check hasLowerCase
    │       ├─► Check hasNumbers
    │       └─► Check hasSpecialChar
    │
    └─► UI Update: Affiche indicateurs ✓/✗ en temps réel
```

#### Processus de Changement
```
User Action: "Changer le Mot de Passe" + Confirmation
    │
    ├─► Validation 1: oldPassword === currentPassword ?
    │       └─► NON: Alert "Ancien mot de passe incorrect"
    │
    ├─► Validation 2: validatePassword(newPassword).isValid ?
    │       └─► NON: Alert avec critères manquants
    │
    ├─► Validation 3: newPassword === confirmPassword ?
    │       └─► NON: Alert "Mots de passe ne correspondent pas"
    │
    ├─► Validation 4: oldPassword !== newPassword ?
    │       └─► NON: Alert "Nouveau mot de passe doit être différent"
    │
    ├─► WalletService.getWallet(currentPassword)
    │       │
    │       └─► Récupère wallet avec mnemonic.phrase
    │
    ├─► DatabaseService.deleteWallet(walletAddress)
    │       └─► Supprime l'ancien wallet
    │
    ├─► WalletService.importWallet(mnemonic, newPassword)
    │       └─► Recrée wallet avec nouveau mot de passe
    │
    ├─► DatabaseService.saveWallet({ address, mnemonic, password: newPassword })
    │       │
    │       └─► Re-chiffre mnémonique avec nouveau mot de passe
    │
    └─► navigation.replace('Login')
            └─► Force reconnexion avec nouveau mot de passe
```

---

## 🔐 Flux de Chiffrement

### Sauvegarde du Mnémonique
```
Mnemonic (plaintext)
    │
    ├─► encryptMnemonic(mnemonic, password)
    │       │
    │       ├─► XOR chaque caractère avec password
    │       │       └─► char XOR password[i % password.length]
    │       │
    │       └─► Buffer.from(encrypted).toString('base64')
    │
    └─► Stockage: encrypted_mnemonic (Base64 string)
```

### Récupération du Mnémonique
```
Database: encrypted_mnemonic (Base64 string)
    │
    ├─► decryptMnemonic(encrypted, password)
    │       │
    │       ├─► Buffer.from(encrypted, 'base64').toString()
    │       │
    │       └─► XOR inverse avec password
    │               └─► char XOR password[i % password.length]
    │
    └─► Mnemonic (plaintext)
```

---

## 💾 Schéma de Base de Données

### Table: wallets
```sql
┌────────────────────────────────────────────────────────┐
│ id (PK)  │ name      │ address    │ encrypted_mnemonic │
├──────────┼───────────┼────────────┼────────────────────┤
│ 1        │ Wallet 1  │ 0x1234...  │ aGVsbG8gd29ybGQ=   │
│ 2        │ Wallet 2  │ 0x5678...  │ dGVzdCBkYXRh       │
│ 3        │ Imported  │ 0xabcd...  │ bXkgc2VjcmV0       │
└──────────┴───────────┴────────────┴────────────────────┘
│ created_at │ is_active │
├────────────┼───────────┤
│ 1703456789 │ 1         │  ← Wallet actif
│ 1703456790 │ 0         │
│ 1703456791 │ 0         │
└────────────┴───────────┘
```

### AsyncStorage: settings
```javascript
{
  "selectedNetwork": "hardhat",      // ou "mainnet"
  "testMode": "true"                 // ou "false"
}
```

---

## 🔄 Cycle de Vie des Composants

### ManageWalletsScreen
```
Mount
  │
  ├─► useEffect(() => loadWallets())
  │       │
  │       └─► DatabaseService.getAllWallets()
  │               └─► setWallets(rows)
  │
  └─► Render: Liste des wallets

User Action (Create/Import/Delete)
  │
  ├─► Mutation Database
  │
  └─► loadWallets() → Re-render
```

### NetworkSwitcherScreen
```
Mount
  │
  ├─► useEffect(() => loadNetworkSettings())
  │       │
  │       ├─► AsyncStorage.getItem('selectedNetwork')
  │       ├─► AsyncStorage.getItem('testMode')
  │       └─► BlockchainService.setNetwork(savedNetwork)
  │
  └─► Render: Réseau actuel + Liste

User Action (Change Network/Toggle Test)
  │
  ├─► Update State
  ├─► AsyncStorage.setItem()
  ├─► BlockchainService.setNetwork()
  │
  └─► Re-render
```

### ChangePasswordScreen
```
Mount
  │
  └─► Render: Formulaire vide

User Input (onChange)
  │
  ├─► setState(value)
  ├─► validatePassword(value)
  │
  └─► Re-render: Indicateurs mis à jour

User Submit
  │
  ├─► Validations multiples
  ├─► Database operations
  ├─► Alert success
  │
  └─► navigation.replace('Login')
```

---

## 🎯 Points Clés de l'Architecture

### ✅ Séparation des Responsabilités
- **Screens** : UI et interactions utilisateur
- **Services** : Logique métier et accès aux données
- **Storage** : Persistance (SQLite, AsyncStorage)

### ✅ Sécurité Multi-Couches
1. Chiffrement du mnémonique dans la DB
2. Validation des entrées utilisateur
3. Confirmations pour actions sensibles
4. Avertissements contextuels

### ✅ Persistance des Données
- **SQLite** : Wallets et transactions (structurées)
- **AsyncStorage** : Préférences utilisateur (clé-valeur)
- **Ethers.js** : État blockchain (en mémoire)

### ✅ Gestion d'Erreurs
- Try-catch sur toutes les opérations async
- Logs console pour debugging
- Alerts utilisateur pour feedback
- Validation avant mutations

---

**Cette architecture garantit une application robuste, sécurisée et maintenable !**
