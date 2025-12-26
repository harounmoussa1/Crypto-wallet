# 🚀 Guide de Démarrage Rapide - Nouvelles Fonctionnalités

## 🎯 Objectif

Ce guide vous aide à tester les nouvelles fonctionnalités de paramètres développées pour l'application eWallet.

---

## ⚡ Démarrage Rapide

### 1. Installation (si nécessaire)

```bash
cd mobile_simple
npm install
```

### 2. Lancer l'application

```bash
npx expo start
```

### 3. Scanner le QR code avec Expo Go

---

## 🧪 Scénarios de Test

### 📱 Scénario 1 : Gestion Multi-Wallets

#### Test 1.1 : Créer un nouveau wallet
1. Ouvrir l'app et se connecter
2. Aller dans **⚙️ Paramètres**
3. Cliquer sur **💼 Gérer les Wallets**
4. Cliquer sur **➕ Créer un Nouveau Wallet**
5. Confirmer la création
6. ✅ **Résultat attendu** : Un nouveau wallet apparaît dans la liste

#### Test 1.2 : Importer un wallet existant
1. Dans **Gérer les Wallets**
2. Cliquer sur **📥 Importer un Wallet**
3. Entrer une phrase mnémonique valide (12 mots)
   ```
   Exemple de test :
   abandon abandon abandon abandon abandon abandon 
   abandon abandon abandon abandon abandon about
   ```
4. Entrer votre mot de passe maître
5. Cliquer sur **Importer**
6. ✅ **Résultat attendu** : Le wallet est importé et visible dans la liste

#### Test 1.3 : Basculer entre wallets
1. Dans la liste des wallets
2. Cliquer sur l'icône **🔄** (swap) d'un wallet non-actif
3. Confirmer le changement
4. ✅ **Résultat attendu** : Retour au dashboard avec le nouveau wallet actif

#### Test 1.4 : Supprimer un wallet
1. Dans la liste des wallets (avoir au moins 2 wallets)
2. Cliquer sur l'icône **🗑️** (poubelle)
3. Lire l'avertissement et confirmer
4. ✅ **Résultat attendu** : Le wallet est supprimé de la liste

#### Test 1.5 : Protection dernier wallet
1. Avoir un seul wallet
2. Essayer de le supprimer
3. ✅ **Résultat attendu** : Alert "Vous devez avoir au moins un wallet actif"

---

### 🌐 Scénario 2 : Sélection de Réseau

#### Test 2.1 : Voir le réseau actuel
1. Aller dans **⚙️ Paramètres**
2. Cliquer sur **🌐 Réseau**
3. ✅ **Résultat attendu** : Carte affichant "Nexora Private Chain" avec détails

#### Test 2.2 : Basculer vers Hardhat
1. Dans l'écran Réseau
2. Cliquer sur **Nexora Private Chain**
3. ✅ **Résultat attendu** : Confirmation du changement (déjà actif)

#### Test 2.3 : Tenter de basculer vers Mainnet
1. Cliquer sur **Ethereum Mainnet**
2. ✅ **Résultat attendu** : 
   - Alert d'avertissement détaillé
   - Mention des risques (vrais ETH, frais réels)
   - Bouton "Je comprends les risques"

#### Test 2.4 : Mode Test
1. Activer/désactiver le switch **Mode Test**
2. ✅ **Résultat attendu** : 
   - Switch change d'état
   - Si désactivé sur Mainnet : Alert supplémentaire

#### Test 2.5 : Persistance du réseau
1. Changer de réseau
2. Fermer complètement l'app
3. Relancer l'app
4. Retourner dans Réseau
5. ✅ **Résultat attendu** : Le réseau sélectionné est conservé

---

### 🔐 Scénario 3 : Changement de Mot de Passe

#### Test 3.1 : Validation ancien mot de passe
1. Aller dans **⚙️ Paramètres**
2. Cliquer sur **🔒 Changer le Mot de Passe**
3. Entrer un **mauvais** ancien mot de passe
4. Essayer de valider
5. ✅ **Résultat attendu** : Alert "L'ancien mot de passe est incorrect"

#### Test 3.2 : Validation force du mot de passe
1. Entrer le bon ancien mot de passe
2. Entrer un nouveau mot de passe **faible** (ex: "test")
3. Observer les indicateurs
4. ✅ **Résultat attendu** : 
   - Indicateurs ✗ en rouge pour critères non remplis
   - Impossible de valider

#### Test 3.3 : Indicateurs en temps réel
1. Taper progressivement : "Test1234"
2. Observer les indicateurs changer
3. ✅ **Résultat attendu** :
   - ✓ 8 caractères (après "Test1234")
   - ✓ Majuscule (après "T")
   - ✓ Minuscule (après "e")
   - ✓ Chiffre (après "1")

#### Test 3.4 : Confirmation non correspondante
1. Nouveau mot de passe : "Test1234"
2. Confirmation : "Test5678"
3. Essayer de valider
4. ✅ **Résultat attendu** : Alert "Les mots de passe ne correspondent pas"

#### Test 3.5 : Changement réussi
1. Ancien mot de passe : (correct)
2. Nouveau mot de passe : "NewTest123"
3. Confirmation : "NewTest123"
4. Cliquer sur **Changer le Mot de Passe**
5. Confirmer l'avertissement
6. ✅ **Résultat attendu** :
   - Alert de succès
   - Redirection vers écran Login
   - Ancien mot de passe ne fonctionne plus
   - Nouveau mot de passe fonctionne

---

## 🐛 Tests d'Erreurs

### Test E1 : Import avec mnémonique invalide
```
Phrase invalide : "hello world test invalid phrase"
Résultat attendu : Erreur "Invalid mnemonic"
```

### Test E2 : Même mot de passe ancien/nouveau
```
Ancien : "Test1234"
Nouveau : "Test1234"
Résultat attendu : Alert "Nouveau mot de passe doit être différent"
```

### Test E3 : Champs vides
```
Laisser des champs vides et essayer de valider
Résultat attendu : Bouton désactivé ou alert
```

---

## 📊 Checklist Complète

### Gestion des Wallets
- [ ] Affichage de la liste des wallets
- [ ] Badge "Actif" sur le wallet en cours
- [ ] Création d'un nouveau wallet
- [ ] Importation avec mnémonique valide
- [ ] Importation avec mnémonique invalide (doit échouer)
- [ ] Changement de wallet actif
- [ ] Suppression d'un wallet
- [ ] Protection du dernier wallet
- [ ] Persistance après redémarrage

### Sélection de Réseau
- [ ] Affichage du réseau actuel
- [ ] Détails du réseau (Chain ID, RPC, devise)
- [ ] Changement vers Hardhat
- [ ] Avertissement Mainnet
- [ ] Toggle mode test
- [ ] Persistance du réseau sélectionné
- [ ] Badges visuels (Recommandé, Warning)

### Changement de Mot de Passe
- [ ] Validation ancien mot de passe
- [ ] Indicateurs de force en temps réel
- [ ] Validation 8 caractères minimum
- [ ] Validation majuscule
- [ ] Validation minuscule
- [ ] Validation chiffre
- [ ] Vérification confirmation
- [ ] Protection même mot de passe
- [ ] Changement réussi
- [ ] Déconnexion automatique
- [ ] Reconnexion avec nouveau mot de passe

---

## 🎨 Points d'Attention UX

### Design
- ✅ Gradients violets cohérents
- ✅ Icônes colorées et significatives
- ✅ Cards avec ombres subtiles
- ✅ Badges visuels (Actif, Recommandé, Warning)
- ✅ Animations de transition

### Feedback Utilisateur
- ✅ Alerts de confirmation pour actions destructives
- ✅ Messages d'erreur clairs
- ✅ Indicateurs de chargement
- ✅ Validation en temps réel
- ✅ Avertissements de sécurité

### Sécurité
- ✅ Confirmations multiples
- ✅ Avertissements Mainnet
- ✅ Validation de force de mot de passe
- ✅ Chiffrement du mnémonique
- ✅ Mode test

---

## 📝 Notes Importantes

### ⚠️ Sécurité
- Le chiffrement actuel (XOR) est pour **démonstration uniquement**
- En production, utiliser **AES-256** avec **PBKDF2**
- Ne jamais exposer les clés privées ou mnémoniques

### 💡 Conseils
- Toujours sauvegarder la phrase de récupération
- Utiliser des mots de passe forts et uniques
- Tester d'abord sur le réseau local (Hardhat)
- Activer le mode test pour éviter les erreurs

### 🔧 Dépannage
- Si l'app crash : Vérifier les logs console
- Si la DB est corrompue : Supprimer et réinstaller l'app
- Si le réseau ne change pas : Vérifier AsyncStorage

---

## 📚 Documentation Complète

Pour plus de détails, consultez :
- **`GUIDE_PARAMETRES.md`** : Documentation détaillée
- **`ARCHITECTURE_PARAMETRES.md`** : Flux de données et architecture
- **`RESUME_PARAMETRES.md`** : Résumé visuel

---

## 🎉 Félicitations !

Vous avez maintenant toutes les informations pour tester les nouvelles fonctionnalités.

**Bon test ! 🚀**
