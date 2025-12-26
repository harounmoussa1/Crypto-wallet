import React, { useState } from 'react';
import { ethers } from 'ethers';
import './App.css';

function App() {
  const [network, setNetwork] = useState('nexora'); // 'nexora' | 'novalink'
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('1.0');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const [txHash, setTxHash] = useState('');

  // FIXED: Straightforward logic - no inversion
  // network = 'nexora' -> Nexora (NXR, Purple, Port 8545)
  // network = 'novalink' -> NovaLink (NVL, Cyan, Port 8546)
  const isNexora = network === 'nexora';

  const currency = isNexora ? 'NXR' : 'NVL';
  const currentName = isNexora ? 'Nexora' : 'NovaLink';
  const otherName = isNexora ? 'NovaLink' : 'Nexora';

  // Nexora color = Purple (#6200ee), NovaLink color = Cyan (#00bcd4)
  const themeColor = isNexora ? '#6200ee' : '#00bcd4';

  const validateAddress = (addr) => {
    return ethers.utils.isAddress(addr);
  };

  const handleSend = async () => {
    setStatus('loading');
    setMessage(`Vérification de la compatibilité ${currentName}...`);
    setTxHash('');

    // Simulated Network Check Delay
    await new Promise(r => setTimeout(r, 800));

    if (!address) {
      setStatus('error');
      setMessage(`L'adresse de destination ${currentName} est requise.`);
      return;
    }

    if (!validateAddress(address)) {
      setStatus('error');
      setMessage(`Adresse invalide pour le réseau ${currentName}. Vérifiez le format.`);
      return;
    }

    // --- STRICT NETWORK ISOLATION CHECK ---
    const normalizedAddr = address.toLowerCase();
    const registeredNetwork = localStorage.getItem(`net_binding_${normalizedAddr}`);

    if (registeredNetwork && registeredNetwork !== network) {
      const regName = registeredNetwork === 'nexora' ? 'Nexora' : 'NovaLink';

      setStatus('permissive_error');
      setMessage(`⛔ CETTE ADRESSE EST LIEE A ${regName.toUpperCase()}.\n\nElle a été activée sur ${regName} en premier. Voulez-vous forcer son utilisation sur ${currentName} ?`);
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setStatus('error');
      setMessage('Le montant doit être supérieur à 0.');
      return;
    }

    try {
      setMessage(`Envoi des ${currency} en cours...`);
      const response = await fetch('http://localhost:4000/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address, amount, network }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message);
        setTxHash(data.txHash);

        // Critical: Bind this address to the current network to prevent cross-chain usage in the future
        localStorage.setItem(`net_binding_${normalizedAddr}`, network);
      } else {
        setStatus('error');
        setMessage(`${data.error || 'Erreur inconnue'} (Réseau: ${currentName})`);
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
      setMessage(`Échec de connexion au nœud ${currentName}.`);
    }
  };

  return (
    <div className="app-container" style={{ '--primary-color': themeColor }}>
      <div className="glass-card">
        <header>
          <h1>💧 {currentName} Faucet</h1>
          <p>Obtenez des {currency} de test instantanément sur le réseau <strong>{currentName}</strong>.</p>
        </header>

        {/* Network Selector */}
        <div className="network-selector">
          <button
            className={`net-btn ${isNexora ? 'active' : ''}`}
            onClick={() => setNetwork('nexora')}
          >
            Nexora (NXR)
          </button>
          <button
            className={`net-btn ${!isNexora ? 'active' : ''}`}
            onClick={() => setNetwork('novalink')}
          >
            NovaLink (NVL)
          </button>
        </div>

        <div className="form-group">
          <label>Adresse Publique <span style={{ color: themeColor, fontWeight: 'bold' }}>({currentName})</span></label>
          <input
            type="text"
            placeholder={`Adresse ${currency} (0x...)`}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={status === 'error' && !validateAddress(address) && address ? 'input-error' : ''}
          />
        </div>

        <div className="form-group">
          <label>Montant ({currency})</label>
          <input
            type="number"
            placeholder="1.0"
            value={amount}
            max="10"
            step="0.1"
            onChange={(e) => setAmount(e.target.value)}
          />
          <small>Max 10 {currency} par requête</small>
        </div>

        <button
          onClick={handleSend}
          disabled={status === 'loading'}
          className="send-button"
          style={{
            background: isNexora
              ? 'linear-gradient(90deg, #6200ee, #7c4dff)' // Nexora Purple
              : 'linear-gradient(90deg, #00BCD4, #009688)', // NovaLink Cyan
            boxShadow: status === 'loading' ? 'none' : `0 4px 15px ${isNexora ? 'rgba(98,0,238,0.4)' : 'rgba(0,188,212,0.4)'}`
          }}
        >
          {status === 'loading' ? 'Traitement en cours...' : `Envoyer les Fonds (${currency})`}
        </button>

        {status === 'loading' && (
          <div className="loader-container">
            <p className="loading-text" style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: 10 }}>{message}</p>
            <div className="spinner" style={{ borderTopColor: themeColor }}></div>
          </div>
        )}

        {status === 'success' && (
          <div className="result success" style={{ borderColor: themeColor, background: isNexora ? 'rgba(98, 0, 238, 0.1)' : 'rgba(0, 188, 212, 0.1)' }}>
            <h3 style={{ color: themeColor }}>🚀 Transaction Confirmée !</h3>
            <p><strong>{amount} {currency}</strong> envoyés sur {currentName}.</p>
            <div className="hash-box">
              <span>Hash:</span>
              <a href="#" onClick={(e) => e.preventDefault()} title={txHash} style={{ color: themeColor }}>{txHash.substring(0, 20)}...</a>
            </div>
            <button className="reset-btn" onClick={() => { setStatus('idle'); setAddress(''); }}>Envoyer à une autre adresse</button>
          </div>
        )}

        {status === 'error' && (
          <div className="result error">
            <h3>❌ Erreur Réseau</h3>
            <p style={{ whiteSpace: 'pre-line' }}>{message}</p>
          </div>
        )}

        {status === 'permissive_error' && (
          <div className="result error" style={{ border: '1px solid orange', background: 'rgba(255, 165, 0, 0.1)' }}>
            <h3 style={{ color: 'orange' }}>⚠️ Conflit de Réseau</h3>
            <p style={{ whiteSpace: 'pre-line' }}>{message}</p>
            <button
              className="send-button"
              style={{ marginTop: 15, background: 'orange', color: '#000' }}
              onClick={() => {
                const normalizedAddr = address.toLowerCase();
                localStorage.setItem(`net_binding_${normalizedAddr}`, network);
                setStatus('idle');
                setMessage('Conflit résolu. Vous pouvez envoyer.');
              }}
            >
              🔓 Forcer le transfert sur {currentName}
            </button>
          </div>
        )}
      </div>

      <footer>
        <p>Distributing Testnet Tokens for {currentName}</p>
      </footer>
    </div>
  );
}

export default App;
