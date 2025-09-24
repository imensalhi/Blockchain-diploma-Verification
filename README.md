# 🎓 Système de Vérification de Diplômes Blockchain

> **🚀 PRÊT POUR LA PRODUCTION** - Système complet de vérification de diplômes basé sur blockchain avec contrats intelligents et interface web moderne

[![Status](https://img.shields.io/badge/Statut-Prêt%20Production-brightgreen)](https://github.com/imensalhi/Blockchain-diploma-Verification.git)
[![Tests](https://img.shields.io/badge/Tests-30%2F30%20Réussis-brightgreen)](./test)
[![Réseau](https://img.shields.io/badge/Réseau-Localhost%20%7C%20Sepolia-blue)](./hardhat.config.js)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%7C%20Vite-brightgreen)](./frontend)

**🔗 Dépôt**: https://github.com/imensalhi/Blockchain-diploma-Verification.git  
**📅 Dernière mise à jour**: 25 septembre 2025  
**✅ Statut**: Complet et entièrement fonctionnel

## 🌟 Fonctionnalités

### 🏛️ Pour les Universités
- **Autorisation d'universités** : Les administrateurs peuvent autoriser les universités à émettre des diplômes
- **Émission de diplômes** : Télécharger des diplômes PDF et enregistrer leur empreinte cryptographique sur blockchain
- **Gestion des certificats** : Visualiser tous les diplômes émis et leur statut de vérification
- **Confidentialité d'abord** : Seules les empreintes des documents sont stockées sur blockchain, pas les données personnelles

### 🔍 Pour les Vérificateurs
- **Vérification instantanée** : Télécharger un PDF de diplôme et le nom de l'université pour vérifier l'authenticité
- **Résultats en temps réel** : Obtenir les résultats de vérification en moins de 2 secondes
- **Détection de falsification** : Détecter toute modification du diplôme original
- **Accès public** : Tout le monde peut vérifier des diplômes sans permissions spéciales

### ⚡ Fonctionnalités Techniques
- **Optimisé pour le gaz** : Conception efficace du contrat intelligent minimisant les coûts de transaction
- **Architecture évolutive** : Conception modulaire supportant plusieurs universités
- **Support de révocation** : Les universités peuvent révoquer des diplômes compromis
- **Journalisation d'événements** : Piste d'audit complète de toutes les opérations de diplômes

## 🏗️ Architecture

```
diploma_verif/
├── 📂 contracts/           # Contrats intelligents (Solidity)
│   └── DiplomaRegistry.sol
├── 📂 frontend/            # Interface web React + Vite
│   ├── src/
│   │   ├── App.jsx        # Application principale
│   │   ├── components/    # Composants React
│   │   └── assets/        # Ressources statiques
│   ├── public/            # Fichiers publics
│   ├── package.json       # Dépendances frontend
│   └── vite.config.js     # Configuration Vite
├── 📂 scripts/            # Scripts de déploiement et utilitaires
├── 📂 test/              # Tests des contrats intelligents
├── 📂 ignition/          # Modules de déploiement Hardhat Ignition
└── 📂 docs/              # Documentation
```

## 🚀 Démarrage Rapide

### Prérequis
- Node.js >= 18.0.0
- npm ou yarn
- Extension navigateur MetaMask
- Git

### 1. Clonage et Configuration

```bash
# Cloner le dépôt
git clone https://github.com/imensalhi/Blockchain-diploma-Verification.git
cd Blockchain-diploma-Verification

# Installer les dépendances du projet principal
npm install
```

### 2. Configuration de l'Environnement

```bash
# Copier le modèle d'environnement
cp .env.example .env

# Éditer .env avec votre configuration
# Ajouter votre clé privée pour le déploiement Sepolia (optionnel)
```

### 3. Configuration du Développement

```bash
# Démarrer la blockchain locale
npm run node

# Déployer les contrats (dans un nouveau terminal)
npm run deploy:local

# Configuration du frontend React
cd frontend
npm install
npm run dev
```

### 4. Accéder à l'Application

Ouvrez votre navigateur et naviguez vers :

- **Frontend React**: http://localhost:5173 (Vite dev server)
- **Réseau local**: http://127.0.0.1:8545

## 📋 Scripts Disponibles

### 🔧 Développement
```bash
npm run setup              # Installer toutes les dépendances
npm run compile           # Compiler les contrats intelligents
npm run test             # Exécuter les tests des contrats
npm run test:verbose     # Exécuter les tests avec sortie détaillée
```

### 🚀 Déploiement
```bash
npm run node             # Démarrer le réseau Hardhat local
npm run deploy:local     # Déployer sur le réseau local
npm run verify:deployment # Vérifier le déploiement
```

### 🌐 Frontend React
```bash
cd frontend
npm run dev              # Serveur de développement Vite
npm run build            # Build de production
npm run preview          # Prévisualisation du build
npm run lint             # Vérification du code
```

### 🔄 Utilitaires
```bash
npm run utils            # Exécuter les scripts utilitaires
npm run clean           # Nettoyer les artefacts
npm run clean:all       # Nettoyer tous les fichiers de build
npm run status          # Vérifier le statut du projet
```

### ⚡ Développement Complet
```bash
npm run dev:full        # Démarrer réseau + déploiement + frontend
```

## 🔧 Configuration

### Configuration Réseau
Le projet supporte plusieurs réseaux :

- **Développement local** : Réseau Hardhat (Chain ID: 31337)
- **Testnet Sepolia** : Réseau de test Ethereum

### Configuration MetaMask

**Ajouter le Réseau Local :**
- Nom du réseau : Hardhat Local
- URL RPC : http://127.0.0.1:8545
- ID de chaîne : 31337
- Symbole de devise : ETH

**Importer un Compte de Test :** Utilisez une des clés privées de `npx hardhat node`

## 📖 Guide d'Utilisation

### 👨‍💼 Flux de Travail Administrateur
1. **Déployer le Contrat** : L'admin déploie le contrat DiplomaRegistry
2. **Autoriser les Universités** : L'admin accorde le UNIVERSITY_ROLE aux institutions éducatives
3. **Surveiller le Système** : Suivre l'émission et la vérification des diplômes

### 🏫 Flux de Travail Université
1. **Connecter le Portefeuille** : L'université se connecte avec un compte autorisé
2. **Télécharger le Diplôme** : Sélectionner le fichier PDF du diplôme
3. **Émettre sur Blockchain** : Le système calcule l'empreinte et l'enregistre sur blockchain
4. **Partager avec l'Étudiant** : Fournir le fichier de diplôme au diplômé

### 🔍 Flux de Travail Vérification
1. **Accéder au Portail de Vérification** : Ouvrir l'interface publique de vérification
2. **Télécharger le Diplôme** : Sélectionner le PDF du diplôme à vérifier
3. **Entrer l'Université** : Saisir le nom de l'université émettrice
4. **Obtenir les Résultats** : Recevoir le statut de vérification instantané

#### Exemple de Résultat de Vérification :
```
✅ DIPLÔME VÉRIFIÉ
📄 Document : Master_Informatique_Sciences.pdf
🏛️ Émetteur : Université de Sfax
📅 Date d'émission : 21/09/2024
🔒 Statut : Valide et Authentique
```

## 🧪 Tests

### Exécuter la Suite de Tests Complète
```bash
npm test
```

### Catégories de Tests
- **Tests unitaires** : Test de fonctions individuelles
- **Tests d'intégration** : Test d'interaction des contrats
- **Tests d'optimisation de gaz** : Validation de l'efficacité des coûts
- **Tests de sécurité** : Contrôle d'accès et test de vulnérabilités

#### Exemple de Sortie de Test :
```
✅ Tests DiplomaRegistry
  ✅ Devrait se déployer correctement
  ✅ Devrait autoriser les universités
  ✅ Devrait émettre des diplômes
  ✅ Devrait vérifier les diplômes
  ✅ Devrait révoquer les diplômes
  ✅ Devrait gérer les cas limites
```

## 🔐 Fonctionnalités de Sécurité

### Sécurité du Contrat Intelligent
- **Contrôle d'Accès** : Permissions basées sur les rôles utilisant OpenZeppelin
- **Protection contre la Rééntrance** : Prévention des attaques de réentrance
- **Validation d'Entrée** : Vérification complète des paramètres
- **Optimisation du Gaz** : Modèles de stockage efficaces

### Protection de la Vie Privée
- **Stockage d'Empreintes Uniquement** : Seules les empreintes Keccak-256 stockées sur blockchain
- **Aucune Donnée Personnelle** : Les informations étudiants ne touchent jamais la blockchain
- **Conforme RGPD** : Droit à l'oubli supporté

### Piste d'Audit
- **Journalisation d'Événements** : Toutes les opérations émettent des événements
- **Enregistrements Immuables** : Preuve de falsification basée sur blockchain
- **Vérification Transparente** : Processus de vérification public

## 📊 Coûts de Gaz (Optimisés)

| Opération | Coût en Gaz | EUR (@ 20 gwei) |
|-----------|-------------|------------------|
| Déployer Contrat | ~800,000 | ~2,40€ |
| Autoriser Université | ~45,000 | ~0,14€ |
| Émettre Diplôme | ~55,000 | ~0,17€ |
| Vérifier Diplôme | Gratuit | 0,00€ |
| Révoquer Diplôme | ~25,000 | ~0,08€ |

## 🛠️ Stack Technologique

### Blockchain
- **Solidity ^0.8.24** - Langage de contrat intelligent
- **Hardhat** - Framework de développement
- **OpenZeppelin** - Bibliothèques de sécurité
- **Ethers.js** - Bibliothèque Ethereum

### Frontend
- **React 18** - Bibliothèque d'interface utilisateur moderne
- **Vite** - Outil de build ultra-rapide
- **JavaScript ES6+** - Langage de programmation moderne
- **CSS3** - Stylisation avancée
- **MetaMask** - Intégration de portefeuille

### Outils de Développement
- **Node.js** - Environnement d'exécution
- **npm** - Gestionnaire de paquets
- **Git** - Contrôle de version
- **ESLint** - Analyse de code statique

## 🤝 Contribution

Nous accueillons les contributions ! Veuillez suivre ces étapes :

1. Fork le dépôt
2. Créer une branche de fonctionnalité (`git checkout -b feature/fonctionnalite-incroyable`)
3. Commiter vos changements (`git commit -m 'Ajouter fonctionnalité incroyable'`)
4. Pousser vers la branche (`git push origin feature/fonctionnalite-incroyable`)
5. Ouvrir une Pull Request

### Directives de Développement
- Suivre le guide de style Solidity
- Ajouter des tests pour les nouvelles fonctionnalités
- Mettre à jour la documentation
- Assurer l'optimisation du gaz
- Respecter les conventions React/JavaScript

## 📚 Documentation

### Documentation du Contrat Intelligent
- **DiplomaRegistry.sol** - Documentation du contrat principal
- **Référence API** - Référence complète des fonctions
- **Audit de Sécurité** - Considérations de sécurité

### Guides d'Architecture
- **Architecture Système** - Conception de haut niveau
- **Schéma de Base de Données** - Conception de structure de données
- **Guide de Déploiement** - Déploiement en production

### Documentation Frontend
- **Guide des Composants React** - Architecture des composants
- **Guide Vite** - Configuration et optimisation
- **Guide de Style** - Conventions CSS et design

## 🐛 Dépannage

### Problèmes Courants

#### Problèmes de Connexion MetaMask
```bash
# Réinitialiser le compte MetaMask
Paramètres > Avancé > Réinitialiser le Compte
```

#### Échec de Déploiement du Contrat
```bash
# Nettoyer et redéployer
npm run clean:all
npm run compile
npm run deploy:local
```

#### Le Frontend ne se Charge Pas
```bash
# Vérifier si les contrats sont déployés
npm run verify:deployment

# Redémarrer le serveur de développement Vite
cd frontend
npm run dev
```

#### Erreurs de Build Vite
```bash
# Nettoyer le cache Vite
cd frontend
rm -rf node_modules/.vite
npm install
npm run dev
```

## 📜 Licence

Ce projet est sous licence MIT - voir le fichier LICENSE pour les détails.

## 🙏 Remerciements

- **OpenZeppelin** - Bibliothèques de contrats intelligents axées sur la sécurité
- **Équipe Hardhat** - Framework de développement excellent
- **Fondation Ethereum** - Plateforme blockchain
- **Équipe React** - Bibliothèque d'interface utilisateur moderne
- **Équipe Vite** - Outil de build révolutionnaire
- **Université de Sfax** - Collaboration académique et guidance

---

**Construit avec ❤️ pour l'avenir de la vérification de l'éducation**

*Rendre la vérification des diplômes transparente, sécurisée et accessible à tous.*
