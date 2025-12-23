# 🚰 Guide du Faucet Web3 Local

Votre système "Google Cloud Web3 Local" est prêt ! Voici comment le lancer.

## 1. Architecture
*   **Blockchain** : Hardhat Node (Port 8545)
*   **Backend Faucet** : Node.js Express (Port 4000) - Signe les transactions.
*   **Frontend** : React + Vite (Port 5173) - Interface utilisateur moderne.

## 2. Lancer les Services

Il vous faut **3 terminaux** ouverts :

### Terminal 1 : La Blockchain
C'est le réseau local.
```powershell
cd c:\Users\Haroun\Desktop\eWalletOfflineTx\smart_contracts
npx hardhat node
```
*Laissez ce terminal tourner.*

### Terminal 2 : Le Backend (Le "Serveur")
C'est lui qui possède la clé privée et envoie l'argent.
```powershell
cd c:\Users\Haroun\Desktop\eWalletOfflineTx\nodejs_api
node faucet.js
```
*Vous verrez "Faucet Backend running on http://localhost:4000"*

### Terminal 3 : Le Frontend (L'Interface Web)
C'est le site web pour demander des fonds.
```powershell
cd c:\Users\Haroun\Desktop\eWalletOfflineTx\faucet_web
npm run dev
```

## 3. Utilisation
1.  Ouvrez **`http://localhost:5173`** dans votre navigateur.
2.  Copiez l'adresse de votre wallet mobile (depuis l'app eWallet).
3.  Collez-la dans le Faucet.
4.  Cliquez sur **"Envoyer les Fonds"**.
5.  Admirez le solde augmenter sur votre mobile ! 🚀

## 4. Configuration
*   **Clé Privée du Faucet** : Vous pouvez la changer dans `nodejs_api/faucet.js` (Variable `FAUCET_PRIVATE_KEY`). Par défaut, c'est le compte #0 de Hardhat.
*   **Montant Max** : Limité à 10 ETH par envoi dans `faucet.js`.
