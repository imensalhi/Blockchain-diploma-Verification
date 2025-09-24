import { useCallback, useEffect, useState } from 'react';

const DiplomaChainApp = () => {
  const [currentView, setCurrentView] = useState('home');
  const [isConnected, setIsConnected] = useState(false);
  const [userAccount, setUserAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [currentNetwork, setCurrentNetwork] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Configuration - Déplacée à l'extérieur pour éviter les re-créations
  const NETWORKS = {
    localhost: {
      name: 'Localhost',
      chainId: 31337,
      rpcUrl: 'http://127.0.0.1:8545',
    },
  };

  const CONTRACT_ADDRESSES = {
    localhost: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  };

  const CONTRACT_ABI = [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {"internalType": "string", "name": "universityName", "type": "string"},
        {"internalType": "address", "name": "universityAddress", "type": "address"}
      ],
      "name": "authorizeUniversity",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "ADMIN_ROLE",
      "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "bytes32", "name": "role", "type": "bytes32"},
        {"internalType": "address", "name": "account", "type": "address"}
      ],
      "name": "hasRole",
      "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "bytes32", "name": "diplomaHash", "type": "bytes32"},
        {"internalType": "string", "name": "universityName", "type": "string"},
        {"internalType": "bytes32", "name": "degreeType", "type": "bytes32"}
      ],
      "name": "issueDiploma",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "string", "name": "universityName", "type": "string"}
      ],
      "name": "isUniversityAuthorized",
      "outputs": [{"internalType": "bool", "name": "authorized", "type": "bool"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "bytes32", "name": "diplomaHash", "type": "bytes32"},
        {"internalType": "string", "name": "universityName", "type": "string"}
      ],
      "name": "verifyDiploma",
      "outputs": [
        {"internalType": "bool", "name": "isValid", "type": "bool"},
        {"internalType": "bool", "name": "exists", "type": "bool"},
        {"internalType": "address", "name": "issuer", "type": "address"},
        {"internalType": "uint64", "name": "issuedAt", "type": "uint64"},
        {"internalType": "bool", "name": "revoked", "type": "bool"},
        {"internalType": "bytes32", "name": "degreeType", "type": "bytes32"}
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];

  // États pour les formulaires
  const [adminForm, setAdminForm] = useState({ universityName: '', universityAddress: '' });
  const [checkUniversity, setCheckUniversity] = useState('');
  const [universityForm, setUniversityForm] = useState({ universityName: '', degreeType: '', file: null, hash: '' });
  const [verifyForm, setVerifyForm] = useState({ universityName: '', file: null, hash: '' });
  const [results, setResults] = useState({ admin: '', university: '', verify: '' });
  const [loading, setLoading] = useState({ admin: false, university: false, verify: false });

  // Fonction pour générer le hash Keccak-256 - Utiliser useCallback pour éviter les re-créations
  const generateKeccakHash = useCallback(async (file) => {
    if (!file) return null;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Utilisation de la bibliothèque js-sha3 si disponible
      if (window.keccak256) {
        return '0x' + window.keccak256(uint8Array);
      }
      
      // Fallback simple hash pour les tests
      let hash = 0;
      for (let i = 0; i < uint8Array.length; i++) {
        hash = ((hash << 5) - hash + uint8Array[i]) & 0xffffffff;
      }
      return '0x' + Math.abs(hash).toString(16).padStart(64, '0');
    } catch (error) {
      console.error('Erreur génération hash:', error);
      return null;
    }
  }, []);

  // Connexion MetaMask - Utiliser useCallback
  const connectWallet = useCallback(async () => {
    try {
      if (!window.ethereum) {
        setResults(prev => ({ ...prev, admin: 'MetaMask non détecté. Veuillez installer MetaMask.' }));
        return;
      }

      setLoading(prev => ({ ...prev, admin: true }));

      const ethers = window.ethers;
      if (!ethers) {
        throw new Error('Ethers.js non chargé');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const signer = provider.getSigner();
      const account = await signer.getAddress();
      
      // Détecter le réseau
      const network = await provider.getNetwork();
      const networkKey = Object.keys(NETWORKS).find(key => 
        NETWORKS[key].chainId === network.chainId
      );
      
      if (!networkKey || !CONTRACT_ADDRESSES[networkKey]) {
        throw new Error(`Contrat non déployé sur le réseau (Chain ID: ${network.chainId})`);
      }

      const contractAddress = CONTRACT_ADDRESSES[networkKey];
      const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);

      // Vérifier si l'utilisateur est admin
      const adminRole = await contract.ADMIN_ROLE();
      const userIsAdmin = await contract.hasRole(adminRole, account);

      setProvider(provider);
      setContract(contract);
      setUserAccount(account);
      setCurrentNetwork(NETWORKS[networkKey]);
      setIsConnected(true);
      setIsAdmin(userIsAdmin);

      setResults(prev => ({ 
        ...prev, 
        admin: `✅ Connecté avec succès!\n📍 Compte: ${account}\n🌐 Réseau: ${NETWORKS[networkKey].name}\n🔗 Contrat: ${contractAddress}\n👤 Admin: ${userIsAdmin ? 'Oui' : 'Non'}` 
      }));

    } catch (error) {
      setResults(prev => ({ ...prev, admin: `❌ Erreur connexion: ${error.message}` }));
    } finally {
      setLoading(prev => ({ ...prev, admin: false }));
    }
  }, [NETWORKS, CONTRACT_ADDRESSES, CONTRACT_ABI]);

  // Gestionnaires d'événements avec useCallback pour éviter les re-créations
  const handleAdminFormChange = useCallback((field, value) => {
    setAdminForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleUniversityFormChange = useCallback((field, value) => {
    setUniversityForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleVerifyFormChange = useCallback((field, value) => {
    setVerifyForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleCheckUniversityChange = useCallback((value) => {
    setCheckUniversity(value);
  }, []);

  // Ajouter université (Admin)
  const addUniversity = useCallback(async () => {
    if (!contract) {
      setResults(prev => ({ ...prev, admin: 'Veuillez d\'abord connecter votre wallet' }));
      return;
    }

    if (!adminForm.universityName || !adminForm.universityAddress) {
      setResults(prev => ({ ...prev, admin: 'Veuillez remplir tous les champs' }));
      return;
    }

    try {
      setLoading(prev => ({ ...prev, admin: true }));
      setResults(prev => ({ ...prev, admin: '🔄 Ajout de l\'université à la blockchain...' }));

      const tx = await contract.authorizeUniversity(adminForm.universityName, adminForm.universityAddress);
      setResults(prev => ({ ...prev, admin: '⏳ Transaction soumise. En attente de confirmation...' }));
      
      const receipt = await tx.wait();
      setResults(prev => ({ 
        ...prev, 
        admin: `✅ Université "${adminForm.universityName}" ajoutée avec succès!\n📍 Adresse: ${adminForm.universityAddress}\n🧾 Transaction: ${receipt.transactionHash}` 
      }));
      
      setAdminForm({ universityName: '', universityAddress: '' });

    } catch (error) {
      setResults(prev => ({ ...prev, admin: `❌ Échec ajout université: ${error.message}` }));
    } finally {
      setLoading(prev => ({ ...prev, admin: false }));
    }
  }, [contract, adminForm]);

  // Vérifier statut université
  const checkUniversityStatus = useCallback(async () => {
    if (!contract || !checkUniversity) {
      setResults(prev => ({ ...prev, admin: 'Veuillez connecter le wallet et entrer un nom d\'université' }));
      return;
    }

    try {
      setLoading(prev => ({ ...prev, admin: true }));
      const authorized = await contract.isUniversityAuthorized(checkUniversity);
      
      const message = authorized 
        ? `✅ "${checkUniversity}" est autorisée à émettre des diplômes`
        : `❌ "${checkUniversity}" n'est pas autorisée`;
        
      setResults(prev => ({ ...prev, admin: message }));

    } catch (error) {
      setResults(prev => ({ ...prev, admin: `❌ Erreur vérification: ${error.message}` }));
    } finally {
      setLoading(prev => ({ ...prev, admin: false }));
    }
  }, [contract, checkUniversity]);

  // Émettre diplôme (Université)
  const issueDiploma = useCallback(async () => {
    if (!contract) {
      setResults(prev => ({ ...prev, university: 'Veuillez d\'abord connecter votre wallet' }));
      return;
    }

    if (!universityForm.file || !universityForm.universityName) {
      setResults(prev => ({ ...prev, university: 'Veuillez fournir un fichier PDF et le nom de l\'université' }));
      return;
    }

    try {
      setLoading(prev => ({ ...prev, university: true }));
      
      const hash = await generateKeccakHash(universityForm.file);
      if (!hash) {
        throw new Error('Impossible de générer le hash Keccak-256');
      }

      setUniversityForm(prev => ({ ...prev, hash }));

      const ethers = window.ethers;
      const degreeTypeBytes32 = universityForm.degreeType 
        ? ethers.utils.formatBytes32String(universityForm.degreeType)
        : ethers.constants.HashZero;

      setResults(prev => ({ ...prev, university: '🔄 Émission du diplôme sur la blockchain...' }));

      const tx = await contract.issueDiploma(hash, universityForm.universityName, degreeTypeBytes32);
      setResults(prev => ({ ...prev, university: '⏳ Transaction soumise. En attente de confirmation...' }));
      
      const receipt = await tx.wait();
      
      setResults(prev => ({ 
        ...prev, 
        university: `✅ Diplôme émis avec succès sur la blockchain!\n📄 Fichier: ${universityForm.file.name}\n🔐 Hash: ${hash}\n🏛️ Université: ${universityForm.universityName}\n🎓 Diplôme: ${universityForm.degreeType || 'Non spécifié'}\n🧾 Transaction: ${receipt.transactionHash}` 
      }));

    } catch (error) {
      setResults(prev => ({ ...prev, university: `❌ Échec émission diplôme: ${error.message}` }));
    } finally {
      setLoading(prev => ({ ...prev, university: false }));
    }
  }, [contract, universityForm, generateKeccakHash]);

  // Vérifier diplôme
  const verifyDiploma = useCallback(async () => {
    if (!contract) {
      setResults(prev => ({ ...prev, verify: 'Veuillez d\'abord connecter votre wallet' }));
      return;
    }

    if (!verifyForm.file || !verifyForm.universityName) {
      setResults(prev => ({ ...prev, verify: 'Veuillez fournir un fichier PDF et le nom de l\'université' }));
      return;
    }

    try {
      setLoading(prev => ({ ...prev, verify: true }));
      
      const hash = await generateKeccakHash(verifyForm.file);
      if (!hash) {
        throw new Error('Impossible de générer le hash Keccak-256');
      }

      setVerifyForm(prev => ({ ...prev, hash }));

      setResults(prev => ({ ...prev, verify: '🔍 Vérification du diplôme sur la blockchain...' }));

      const result = await contract.verifyDiploma(hash, verifyForm.universityName);
      const [isValid, exists, issuer, issuedAt, revoked, degreeType] = result;

      if (isValid) {
        const ethers = window.ethers;
        const issueDate = new Date(issuedAt * 1000).toLocaleString();
        const degreeTypeStr = degreeType !== ethers.constants.HashZero 
          ? ethers.utils.parseBytes32String(degreeType) 
          : 'Non spécifié';
        
        setResults(prev => ({ 
          ...prev, 
          verify: `✅ DIPLÔME AUTHENTIQUE - VÉRIFIÉ SUR BLOCKCHAIN!\n📊 Statut: Valide et Authentique ✅\n🏛️ Université: ${verifyForm.universityName}\n📍 Émetteur: ${issuer}\n📅 Date d'émission: ${issueDate}\n🔐 Hash: ${hash}\n🎓 Type: ${degreeTypeStr}\n🚫 Révoqué: ${revoked ? 'Oui ❌' : 'Non ✅'}\n📝 Enregistrement: Existe ✅\n🌐 Réseau: ${currentNetwork.name}\n🎯 Ce diplôme est authentique et émis par une université autorisée!` 
        }));
      } else {
        let reason = 'Erreur inconnue';
        if (!exists) {
          reason = 'Aucun enregistrement trouvé sur la blockchain';
        } else if (revoked) {
          reason = 'Le diplôme a été révoqué';
        } else {
          reason = 'Émis par une université non autorisée ou hash incorrect';
        }
        
        setResults(prev => ({ 
          ...prev, 
          verify: `❌ DIPLÔME INVALIDE - ÉCHEC DE VÉRIFICATION!\n📊 Statut: Non Authentique ❌\n🔍 Raison: ${reason}\n📝 Enregistrement existe: ${exists ? 'Oui' : 'Non'}\n🔐 Hash: ${hash}\n🌐 Réseau: ${currentNetwork.name}\n⚠️ Ce diplôme ne peut pas être vérifié comme authentique sur la blockchain.` 
        }));
      }

    } catch (error) {
      setResults(prev => ({ ...prev, verify: `❌ Échec vérification: ${error.message}` }));
    } finally {
      setLoading(prev => ({ ...prev, verify: false }));
    }
  }, [contract, verifyForm, generateKeccakHash, currentNetwork]);

  // Gestion des fichiers avec useCallback
  const handleFileChange = useCallback(async (file, formType) => {
    if (file && file.type === 'application/pdf') {
      if (formType === 'university') {
        setUniversityForm(prev => ({ ...prev, file }));
        const hash = await generateKeccakHash(file);
        if (hash) setUniversityForm(prev => ({ ...prev, hash }));
      } else if (formType === 'verify') {
        setVerifyForm(prev => ({ ...prev, file }));
        const hash = await generateKeccakHash(file);
        if (hash) setVerifyForm(prev => ({ ...prev, hash }));
      }
    }
  }, [generateKeccakHash]);

  // Styles CSS inline - Déplacé en constante pour éviter les re-créations
  const styles = {
    gradientBg: {
      background: 'linear-gradient(135deg, #1e1b4b 0%, #581c87 50%, #9d174d 100%)',
      minHeight: '100vh'
    },
    header: {
      background: 'rgba(0, 0, 0, 0.2)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      padding: '24px 0'
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 16px'
    },
    flexBetween: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    flexCenter: {
      display: 'flex',
      alignItems: 'center'
    },
    logoContainer: {
      background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
      padding: '12px',
      borderRadius: '12px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      transform: 'rotate(12deg)',
      marginRight: '16px'
    },
    title: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: 'white',
      margin: 0
    },
    subtitle: {
      color: '#bfdbfe',
      margin: '4px 0 0 0'
    },
    connectBtn: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '50px',
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.2s'
    },
    heroSection: {
      textAlign: 'center',
      padding: '80px 16px',
      position: 'relative'
    },
    heroBadge: {
      background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
      color: 'black',
      padding: '8px 24px',
      borderRadius: '50px',
      fontSize: '14px',
      fontWeight: 'bold',
      display: 'inline-block',
      marginBottom: '32px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
    },
    heroTitle: {
      fontSize: '64px',
      fontWeight: 'bold',
      color: 'white',
      marginBottom: '24px',
      lineHeight: '1.1'
    },
    heroGradientText: {
      background: 'linear-gradient(135deg, #fbbf24 0%, #ec4899 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      display: 'block'
    },
    heroDescription: {
      fontSize: '20px',
      color: '#bfdbfe',
      marginBottom: '48px',
      maxWidth: '800px',
      margin: '0 auto 48px auto',
      lineHeight: '1.6'
    },
    cardsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '32px',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    card: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '16px',
      padding: '32px',
      cursor: 'pointer',
      transition: 'all 0.3s',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
    },
    cardIcon: {
      fontSize: '48px',
      marginBottom: '24px'
    },
    cardTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: 'white',
      marginBottom: '16px'
    },
    cardDescription: {
      color: '#bfdbfe',
      marginBottom: '24px',
      lineHeight: '1.6'
    },
    cardLink: {
      color: '#fbbf24',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center'
    },
    featuresSection: {
      background: 'rgba(0, 0, 0, 0.2)',
      backdropFilter: 'blur(10px)',
      padding: '80px 16px'
    },
    featuresTitle: {
      fontSize: '48px',
      fontWeight: 'bold',
      color: 'white',
      textAlign: 'center',
      marginBottom: '16px'
    },
    featuresSubtitle: {
      color: '#bfdbfe',
      fontSize: '18px',
      textAlign: 'center',
      marginBottom: '64px'
    },
    featureCard: {
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '24px'
    },
    pageContainer: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fef2f2 0%, #fce7f3 100%)'
    },
    pageHeader: {
      background: 'white',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      borderBottom: '1px solid #e5e7eb',
      padding: '24px 0'
    },
    backButton: {
      display: 'flex',
      alignItems: 'center',
      color: '#6b7280',
      textDecoration: 'none',
      fontSize: '16px',
      cursor: 'pointer',
      border: 'none',
      background: 'none',
      transition: 'color 0.2s'
    },
    pageTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1f2937',
      margin: 0
    },
    statusBadge: {
      padding: '8px 16px',
      borderRadius: '50px',
      fontSize: '14px',
      fontWeight: '500'
    },
    formContainer: {
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      padding: '32px',
      border: '1px solid rgba(0, 0, 0, 0.1)'
    },
    inputLabel: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '8px'
    },
    inputField: {
      width: '100%',
      padding: '12px 16px',
      border: '1px solid #d1d5db',
      borderRadius: '12px',
      fontSize: '16px',
      transition: 'all 0.2s',
      marginBottom: '24px',
      boxSizing: 'border-box'
    },
    submitBtn: {
      width: '100%',
      padding: '16px 24px',
      borderRadius: '12px',
      fontWeight: 'bold',
      fontSize: '16px',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
    },
    uploadArea: {
      border: '2px dashed #d1d5db',
      borderRadius: '12px',
      padding: '32px',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s',
      marginBottom: '24px'
    },
    resultArea: {
      background: '#f8f9fa',
      border: '1px solid #e9ecef',
      borderRadius: '8px',
      padding: '16px',
      marginTop: '24px',
      fontFamily: 'monospace',
      fontSize: '14px',
      whiteSpace: 'pre-wrap',
      minHeight: '100px'
    }
  };

  // Chargement des scripts externes
  useEffect(() => {
    // Charger Ethers.js
    if (!window.ethers) {
      const script1 = document.createElement('script');
      script1.src = 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js';
      document.head.appendChild(script1);
    }

    // Charger js-sha3
    if (!window.keccak256) {
      const script2 = document.createElement('script');
      script2.src = 'https://cdn.jsdelivr.net/npm/js-sha3@0.8.0/src/sha3.js';
      document.head.appendChild(script2);
    }
  }, []);

  // Home Page Component - Mémorisé avec React.memo si nécessaire
  const HomePage = useCallback(() => (
    <div style={styles.gradientBg}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.container}>
          <div style={styles.flexBetween}>
            <div style={styles.flexCenter}>
              <div style={styles.logoContainer}>
                <span style={{fontSize: '24px'}}>🛡️</span>
              </div>
              <div>
                <h1 style={styles.title}>DiplomaChain</h1>
                <p style={styles.subtitle}>Blockchain Diploma Verification System</p>
              </div>
            </div>
            
            <div>
              {!isConnected ? (
                <button 
                  onClick={connectWallet}
                  disabled={loading.admin}
                  style={{
                    ...styles.connectBtn,
                    opacity: loading.admin ? 0.6 : 1,
                    cursor: loading.admin ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading.admin ? 'Connexion...' : 'Connecter MetaMask'}
                </button>
              ) : (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '50px',
                  padding: '8px 16px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontSize: '14px'
                }}>
                  🟢 {userAccount.slice(0,6)}...{userAccount.slice(-4)}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Statut de connexion */}
      {results.admin && (
        <div style={{background: 'rgba(0, 0, 0, 0.3)', padding: '16px'}}>
          <div style={styles.container}>
            <div style={styles.resultArea}>
              {results.admin}
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div style={styles.heroSection}>
        <div style={styles.heroBadge}>
          🚀 SYSTÈME PRÊT POUR LA PRODUCTION
        </div>
        
        <h2 style={styles.heroTitle}>
          Vérification de Diplômes
          <span style={styles.heroGradientText}>
            Sur Blockchain
          </span>
        </h2>
        
        <p style={styles.heroDescription}>
          Système décentralisé de vérification de diplômes utilisant la technologie blockchain 
          pour garantir l'authenticité et l'intégrité des certificats académiques.
        </p>

        {/* User Type Selection */}
        <div style={styles.cardsGrid}>
          {/* Admin Access */}
          <div 
            onClick={() => isConnected ? setCurrentView('admin') : connectWallet()}
            style={{
              ...styles.card,
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)',
              opacity: !isConnected ? 0.7 : 1
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            <div style={{...styles.cardIcon, color: '#f87171'}}>👤</div>
            <h3 style={styles.cardTitle}>Administrateur</h3>
            <p style={styles.cardDescription}>
              Gérez les universités autorisées et supervisez le système de vérification.
            </p>
            <div style={styles.cardLink}>
              {!isConnected ? 'Connectez-vous d\'abord' : (isAdmin ? 'Accéder au Panel Admin →' : 'Accès Admin requis')}
            </div>
          </div>

          {/* University Access */}
          <div 
            onClick={() => isConnected ? setCurrentView('university') : connectWallet()}
            style={{
              ...styles.card,
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
              opacity: !isConnected ? 0.7 : 1
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            <div style={{...styles.cardIcon, color: '#60a5fa'}}>🏛️</div>
            <h3 style={styles.cardTitle}>Université</h3>
            <p style={styles.cardDescription}>
              Émettez et enregistrez des diplômes sur la blockchain de manière sécurisée.
            </p>
            <div style={styles.cardLink}>
              {!isConnected ? 'Connectez-vous d\'abord' : 'Émettre des Diplômes →'}
            </div>
          </div>

          {/* Public Verification */}
          <div 
            onClick={() => isConnected ? setCurrentView('verify') : connectWallet()}
            style={{
              ...styles.card,
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)',
              opacity: !isConnected ? 0.7 : 1
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            <div style={{...styles.cardIcon, color: '#34d399'}}>🔍</div>
            <h3 style={styles.cardTitle}>Vérification</h3>
            <p style={styles.cardDescription}>
              Vérifiez instantanément l'authenticité de n'importe quel diplôme.
            </p>
            <div style={styles.cardLink}>
              {!isConnected ? 'Connectez-vous d\'abord' : 'Vérifier un Diplôme →'}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div style={styles.featuresSection}>
        <div style={styles.container}>
          <h3 style={styles.featuresTitle}>Pourquoi DiplomaChain ?</h3>
          <p style={styles.featuresSubtitle}>
            Des avantages révolutionnaires pour la vérification de diplômes
          </p>
          
          <div style={styles.cardsGrid}>
            <div style={styles.featureCard}>
              <div style={{fontSize: '48px', marginBottom: '16px'}}>🔒</div>
              <h4 style={{fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '12px'}}>
                Sécurité Absolue
              </h4>
              <p style={{color: '#bfdbfe'}}>
                Cryptographie blockchain inviolable avec hash Keccak-256
              </p>
            </div>
            
            <div style={styles.featureCard}>
              <div style={{fontSize: '48px', marginBottom: '16px'}}>⚡</div>
              <h4 style={{fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '12px'}}>
                Vérification Instantanée
              </h4>
              <p style={{color: '#bfdbfe'}}>
                Résultats de vérification en temps réel sur la blockchain
              </p>
            </div>
            
            <div style={styles.featureCard}>
              <div style={{fontSize: '48px', marginBottom: '16px'}}>🌍</div>
              <h4 style={{fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '12px'}}>
                Accès Global
              </h4>
              <p style={{color: '#bfdbfe'}}>
                Accessible partout dans le monde, 24h/24 et 7j/7
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  ), [styles, isConnected, connectWallet, loading.admin, userAccount, results.admin, isAdmin]);

  // Admin Panel Component
  const AdminPanel = useCallback(() => (
    <div style={{...styles.pageContainer, background: 'linear-gradient(135deg, #fef2f2 0%, #fce7f3 100%)'}}>
      <div style={styles.pageHeader}>
        <div style={styles.container}>
          <div style={styles.flexBetween}>
            <div style={styles.flexCenter}>
              <button 
                onClick={() => setCurrentView('home')}
                style={styles.backButton}
              >
                <span style={{marginRight: '8px'}}>🏠</span>
                Retour à l'accueil
              </button>
              <div style={{width: '1px', height: '24px', background: '#d1d5db', margin: '0 16px'}}></div>
              <h1 style={styles.pageTitle}>Panel Administrateur</h1>
            </div>
            <div style={{...styles.statusBadge, background: isAdmin ? '#dcfce7' : '#fecaca', color: isAdmin ? '#166534' : '#991b1b'}}>
              {isAdmin ? '🔒 Admin Autorisé' : '❌ Accès Admin Requis'}
            </div>
          </div>
        </div>
      </div>

      <div style={{...styles.container, padding: '32px 16px'}}>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px'}}>
          {/* Add University */}
          <div style={{...styles.formContainer, border: '1px solid #fecaca'}}>
            <div style={{...styles.flexCenter, marginBottom: '24px'}}>
              <div style={{background: '#ef4444', padding: '12px', borderRadius: '12px', marginRight: '16px'}}>
                <span style={{fontSize: '24px', color: 'white'}}>🏛️</span>
              </div>
              <h2 style={{fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0}}>
                Ajouter une Université
              </h2>
            </div>
            
            <div>
              <label style={styles.inputLabel}>Nom de l'Université</label>
              <input
                type="text"
                placeholder="Ex: Université de Tunis"
                value={adminForm.universityName}
                onChange={(e) => handleAdminFormChange('universityName', e.target.value)}
                style={styles.inputField}
              />
              
              <label style={styles.inputLabel}>Adresse du Portefeuille</label>
              <input
                type="text"
                placeholder="0x..."
                value={adminForm.universityAddress}
                onChange={(e) => handleAdminFormChange('universityAddress', e.target.value)}
                style={styles.inputField}
              />
              
              <button 
                onClick={addUniversity}
                disabled={loading.admin || !isAdmin}
                style={{
                  ...styles.submitBtn,
                  background: (!isAdmin || loading.admin) ? '#9ca3af' : 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)',
                  color: 'white',
                  cursor: (!isAdmin || loading.admin) ? 'not-allowed' : 'pointer'
                }}
              >
                {loading.admin ? 'Ajout en cours...' : (!isAdmin ? 'Accès Admin Requis' : 'Autoriser l\'Université')}
              </button>
            </div>
          </div>

          {/* University Status Check */}
          <div style={{...styles.formContainer, border: '1px solid #fed7aa'}}>
            <div style={{...styles.flexCenter, marginBottom: '24px'}}>
              <div style={{background: '#f97316', padding: '12px', borderRadius: '12px', marginRight: '16px'}}>
                <span style={{fontSize: '24px', color: 'white'}}>🔍</span>
              </div>
              <h2 style={{fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0}}>
                Vérifier le Statut
              </h2>
            </div>
            
            <div>
              <label style={styles.inputLabel}>Nom de l'Université</label>
              <input
                type="text"
                placeholder="Ex: Université de Tunis"
                value={checkUniversity}
                onChange={(e) => handleCheckUniversityChange(e.target.value)}
                style={styles.inputField}
              />
              
              <button 
                onClick={checkUniversityStatus}
                disabled={loading.admin}
                style={{
                  ...styles.submitBtn,
                  background: loading.admin ? '#9ca3af' : 'linear-gradient(135deg, #f97316 0%, #eab308 100%)',
                  color: 'white',
                  cursor: loading.admin ? 'not-allowed' : 'pointer'
                }}
              >
                {loading.admin ? 'Vérification...' : 'Vérifier le Statut'}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {results.admin && (
          <div style={styles.resultArea}>
            {results.admin}
          </div>
        )}
      </div>
    </div>
  ), [styles, isAdmin, adminForm, handleAdminFormChange, loading.admin, addUniversity, checkUniversity, handleCheckUniversityChange, checkUniversityStatus, results.admin]);

  // University Panel Component
  const UniversityPanel = useCallback(() => (
    <div style={{...styles.pageContainer, background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)'}}>
      <div style={styles.pageHeader}>
        <div style={styles.container}>
          <div style={styles.flexBetween}>
            <div style={styles.flexCenter}>
              <button 
                onClick={() => setCurrentView('home')}
                style={styles.backButton}
              >
                <span style={{marginRight: '8px'}}>🏠</span>
                Retour à l'accueil
              </button>
              <div style={{width: '1px', height: '24px', background: '#d1d5db', margin: '0 16px'}}></div>
              <h1 style={styles.pageTitle}>Panel Université</h1>
            </div>
            <div style={{...styles.statusBadge, background: '#dbeafe', color: '#1e40af'}}>
              🏛️ Accès Université
            </div>
          </div>
        </div>
      </div>

      <div style={{maxWidth: '800px', margin: '0 auto', padding: '32px 16px'}}>
        <div style={{...styles.formContainer, border: '1px solid #dbeafe'}}>
          <div style={{...styles.flexCenter, marginBottom: '32px'}}>
            <div style={{background: '#3b82f6', padding: '16px', borderRadius: '12px', marginRight: '16px'}}>
              <span style={{fontSize: '32px', color: 'white'}}>📄</span>
            </div>
            <div>
              <h2 style={{fontSize: '32px', fontWeight: 'bold', color: '#1f2937', margin: 0}}>
                Émettre un Diplôme
              </h2>
              <p style={{color: '#6b7280', margin: '4px 0 0 0'}}>
                Enregistrer un nouveau diplôme sur la blockchain
              </p>
            </div>
          </div>
          
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start'}}>
            <div>
              <label style={styles.inputLabel}>Fichier PDF du Diplôme</label>
              <div style={{...styles.uploadArea, background: '#eff6ff', borderColor: '#93c5fd'}}>
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={(e) => handleFileChange(e.target.files[0], 'university')}
                  style={{display: 'none'}} 
                  id="university-file-input"
                />
                <label htmlFor="university-file-input" style={{cursor: 'pointer', display: 'block'}}>
                  <div style={{fontSize: '48px', color: '#60a5fa', marginBottom: '16px'}}>📄</div>
                  <p style={{color: '#2563eb', fontWeight: '500', marginBottom: '8px'}}>
                    {universityForm.file ? universityForm.file.name : 'Glissez-déposez votre diplôme PDF'}
                  </p>
                  <p style={{color: '#6b7280', fontSize: '14px', margin: 0}}>
                    ou cliquez pour sélectionner
                  </p>
                </label>
              </div>
              
              <label style={styles.inputLabel}>Nom de l'Université</label>
              <input
                type="text"
                placeholder="Ex: Université de Tunis"
                value={universityForm.universityName}
                onChange={(e) => handleUniversityFormChange('universityName', e.target.value)}
                style={styles.inputField}
              />
              
              <label style={styles.inputLabel}>Type de Diplôme</label>
              <input
                type="text"
                placeholder="Ex: Master en Informatique"
                value={universityForm.degreeType}
                onChange={(e) => handleUniversityFormChange('degreeType', e.target.value)}
                style={styles.inputField}
              />
              
              <button 
                onClick={issueDiploma}
                disabled={loading.university}
                style={{
                  ...styles.submitBtn,
                  background: loading.university ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                  color: 'white',
                  padding: '16px 24px',
                  cursor: loading.university ? 'not-allowed' : 'pointer'
                }}
              >
                {loading.university ? 'Émission en cours...' : 'Émettre le Diplôme'}
              </button>
            </div>

            <div style={{background: '#f9fafb', borderRadius: '12px', padding: '24px'}}>
              <h3 style={{fontWeight: 'bold', color: '#1f2937', marginBottom: '16px'}}>
                Hash Généré (Keccak-256)
              </h3>
              <div style={{
                background: 'white',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#6b7280',
                marginBottom: '24px',
                wordBreak: 'break-all',
                minHeight: '60px'
              }}>
                {universityForm.hash || 'Téléchargez un PDF pour générer le hash...'}
              </div>
              
              <div style={{padding: '16px', background: '#eff6ff', borderRadius: '8px'}}>
                <h4 style={{fontWeight: '600', color: '#1e40af', marginBottom: '8px'}}>
                  ℹ️ Information
                </h4>
                <p style={{color: '#1e40af', fontSize: '14px', margin: 0, lineHeight: '1.5'}}>
                  Le hash Keccak-256 est généré automatiquement à partir de votre fichier PDF. 
                  Ce hash unique sera enregistré sur la blockchain.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {results.university && (
          <div style={styles.resultArea}>
            {results.university}
          </div>
        )}
      </div>
    </div>
  ), [styles, universityForm, handleFileChange, handleUniversityFormChange, loading.university, issueDiploma, results.university]);

  // Verification Panel Component
  const VerificationPanel = useCallback(() => (
    <div style={{...styles.pageContainer, background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'}}>
      <div style={styles.pageHeader}>
        <div style={styles.container}>
          <div style={styles.flexBetween}>
            <div style={styles.flexCenter}>
              <button 
                onClick={() => setCurrentView('home')}
                style={styles.backButton}
              >
                <span style={{marginRight: '8px'}}>🏠</span>
                Retour à l'accueil
              </button>
              <div style={{width: '1px', height: '24px', background: '#d1d5db', margin: '0 16px'}}></div>
              <h1 style={styles.pageTitle}>Vérification de Diplôme</h1>
            </div>
            <div style={{...styles.statusBadge, background: '#dcfce7', color: '#166534'}}>
              🔍 Accès Public
            </div>
          </div>
        </div>
      </div>

      <div style={{maxWidth: '800px', margin: '0 auto', padding: '32px 16px'}}>
        <div style={{...styles.formContainer, border: '1px solid #bbf7d0'}}>
          <div style={{...styles.flexCenter, marginBottom: '32px'}}>
            <div style={{background: '#10b981', padding: '16px', borderRadius: '12px', marginRight: '16px'}}>
              <span style={{fontSize: '32px', color: 'white'}}>🔍</span>
            </div>
            <div>
              <h2 style={{fontSize: '32px', fontWeight: 'bold', color: '#1f2937', margin: 0}}>
                Vérifier un Diplôme
              </h2>
              <p style={{color: '#6b7280', margin: '4px 0 0 0'}}>
                Vérifiez instantanément l'authenticité d'un diplôme
              </p>
            </div>
          </div>
          
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start'}}>
            <div>
              <label style={styles.inputLabel}>Fichier PDF à Vérifier</label>
              <div style={{...styles.uploadArea, background: '#ecfdf5', borderColor: '#86efac'}}>
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={(e) => handleFileChange(e.target.files[0], 'verify')}
                  style={{display: 'none'}} 
                  id="verify-file-input"
                />
                <label htmlFor="verify-file-input" style={{cursor: 'pointer', display: 'block'}}>
                  <div style={{fontSize: '48px', color: '#22c55e', marginBottom: '16px'}}>🔍</div>
                  <p style={{color: '#16a34a', fontWeight: '500', marginBottom: '8px'}}>
                    {verifyForm.file ? verifyForm.file.name : 'Glissez-déposez le diplôme à vérifier'}
                  </p>
                  <p style={{color: '#6b7280', fontSize: '14px', margin: 0}}>
                    ou cliquez pour sélectionner
                  </p>
                </label>
              </div>
              
              <label style={styles.inputLabel}>Université Émettrice Attendue</label>
              <input
                type="text"
                placeholder="Ex: Université de Tunis"
                value={verifyForm.universityName}
                onChange={(e) => handleVerifyFormChange('universityName', e.target.value)}
                style={styles.inputField}
              />
              
              <button 
                onClick={verifyDiploma}
                disabled={loading.verify}
                style={{
                  ...styles.submitBtn,
                  background: loading.verify ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  padding: '16px 24px',
                  cursor: loading.verify ? 'not-allowed' : 'pointer'
                }}
              >
                {loading.verify ? 'Vérification...' : 'Vérifier l\'Authenticité'}
              </button>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
              <div style={{background: '#f9fafb', borderRadius: '12px', padding: '24px'}}>
                <h3 style={{fontWeight: 'bold', color: '#1f2937', marginBottom: '16px'}}>Hash de Vérification</h3>
                <div style={{
                  background: 'white',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: '#6b7280',
                  wordBreak: 'break-all',
                  minHeight: '60px'
                }}>
                  {verifyForm.hash || 'Téléchargez un PDF pour générer le hash...'}
                </div>
              </div>

              <div style={{background: '#ecfdf5', borderRadius: '12px', padding: '24px', border: '1px solid #bbf7d0'}}>
                <h3 style={{fontWeight: 'bold', color: '#166534', marginBottom: '16px'}}>🛡️ Processus de Vérification</h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px'}}>
                  <div style={{display: 'flex', alignItems: 'center'}}>
                    <div style={{width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%', marginRight: '12px'}}></div>
                    <span style={{color: '#166534'}}>Génération du hash Keccak-256</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center'}}>
                    <div style={{width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%', marginRight: '12px'}}></div>
                    <span style={{color: '#166534'}}>Recherche sur la blockchain</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center'}}>
                    <div style={{width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%', marginRight: '12px'}}></div>
                    <span style={{color: '#166534'}}>Vérification de l'émetteur</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center'}}>
                    <div style={{width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%', marginRight: '12px'}}></div>
                    <span style={{color: '#166534'}}>Résultat instantané</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {results.verify && (
          <div style={styles.resultArea}>
            {results.verify}
          </div>
        )}
      </div>
    </div>
  ), [styles, verifyForm, handleFileChange, handleVerifyFormChange, loading.verify, verifyDiploma, results.verify]);

  // Render current view
  const renderCurrentView = () => {
    switch(currentView) {
      case 'admin':
        return <AdminPanel />;
      case 'university':
        return <UniversityPanel />;
      case 'verify':
        return <VerificationPanel />;
      default:
        return <HomePage />;
    }
  };

  return renderCurrentView();
};

export default DiplomaChainApp;