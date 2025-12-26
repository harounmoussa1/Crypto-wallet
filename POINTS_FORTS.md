# Points Forts du Projet eWalletOfflineTx

Ce projet se distingue par plusieurs aspects techniques et fonctionnels qui en font une base solide pour un portefeuille crypto non-custodial et résilient.

## 1. Architecture "Offline First" & Résiliente
*   **Base de Données Locale (SQLite)** : Contrairement à beaucoup de wallets légers qui dépendent entièrement d'API distantes, ce projet stocke l'état des portefeuilles et l'historique des transactions localement. Cela permet une consultation hors-ligne et une meilleure réactivité.
*   **Indépendance du Réseau** : L'architecture est conçue pour fonctionner avec n'importe quel nœud RPC (Local, Cloudflare, Infura, Alchemy), offrant une résilience totale face aux pannes de fournisseurs de services.

## 2. Sécurité & Confidentialité (Non-Custodial)
*   **Contrôle Total des Clés** : Les clés privées et mnémoniques sont chiffrées et stockées exclusivement sur l'appareil de l'utilisateur (via `Expo SecureStore`). Aucune donnée sensible ne transite jamais vers un serveur tiers.
*   **Chiffrement Avancé** : Utilisation de standards de chiffrement (AES) pour protéger les données au repos, avec une architecture prête pour PBKDF2.

## 3. Stack Technique Moderne & Flexible
*   **React Native & Expo** : Utilisation des dernières versions d'Expo (SDK 50+) garantissant une compatibilité cross-platform (iOS, Android) et une maintenance aisée.
*   **Ethers.js** : Intégration robuste avec la blockchain Ethereum via une librairie standard de l'industrie.
*   **Gestion Multi-Réseaux** : Le système de `NetworkSwitcher` permet de basculer instantanément entre différents environnements (Testnet local, Sepolia, Mainnet) sans reconfiguration complexe.

## 4. Expérience Utilisateur (UX) Soignée
*   **Feedback Visuel** : Gestion des états de chargement, messages d'erreur clairs et alertes de sécurité (ex: avertissement Mainnet).
*   **Interface Intuitive** : Navigation fluide entre les écrans (Envoi, Réception, Paramètres) avec une hiérarchie visuelle claire.
*   **Mode "Test"** : Une fonctionnalité de sécurité dédiée pour éviter les erreurs coûteuses sur le réseau principal.
