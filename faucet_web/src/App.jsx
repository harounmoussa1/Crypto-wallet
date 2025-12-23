import React, { useState } from 'react';
import { ethers } from 'ethers';
import './App.css';

function App() {
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('1.0');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const [txHash, setTxHash] = useState('');

  const validateAddress = (addr) => {
    return ethers.utils.isAddress(addr);
  };

  const handleSend = async () => {
    setStatus('loading');
    setMessage('');
    setTxHash('');

    if (!address) {
      setStatus('error');
      setMessage('L\'adresse est requise.');
      return;
    }

    if (!validateAddress(address)) {
      setStatus('error');
      setMessage('Adresse Nexora invalide.');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setStatus('error');
      setMessage('Le montant doit être supérieur à 0.');
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address, amount }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message);
        setTxHash(data.txHash);
      } else {
        setStatus('error');
        setMessage(data.error || 'Une erreur est survenue.');
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
      setMessage('Impossible de contacter le Faucet. Vérifiez que le backend tourne.');
    }
  };

  return (
    <div className="app-container">
      <div className="glass-card">
        <header>
          <h1>💧 Local Web3 Faucet</h1>
          <p>Obtenez des NXR de test instantanément sur votre réseau local.</p>
        </header>

        <div className="form-group">
          <label>Adresse Publique</label>
          <input
            type="text"
            placeholder="0x..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={status === 'error' && !validateAddress(address) && address ? 'input-error' : ''}
          />
        </div>

        <div className="form-group">
          <label>Montant (NXR)</label>
          <input
            type="number"
            placeholder="1.0"
            value={amount}
            max="10"
            step="0.1"
            onChange={(e) => setAmount(e.target.value)}
          />
          <small>Max 10 NXR par requête</small>
        </div>

        <button
          onClick={handleSend}
          disabled={status === 'loading'}
          className="send-button"
        >
          {status === 'loading' ? 'Envoi en cours...' : 'Envoyer les Fonds'}
        </button>

        {status === 'loading' && (
          <div className="loader-container">
            <div className="spinner"></div>
          </div>
        )}

        {status === 'success' && (
          <div className="result success">
            <h3>🚀 Transaction Envoyée !</h3>
            <p>{message}</p>
            <div className="hash-box">
              <span>Hash:</span>
              <a href="#" onClick={(e) => e.preventDefault()} title={txHash}>{txHash.substring(0, 20)}...</a>
            </div>
            <button className="reset-btn" onClick={() => { setStatus('idle'); setAddress(''); }}>Envoyer à une autre adresse</button>
          </div>
        )}

        {status === 'error' && (
          <div className="result error">
            <h3>❌ Erreur</h3>
            <p>{message}</p>
          </div>
        )}
      </div>

      <footer>
        <p>Powered by Hardhat & React • Local Dev Environment</p>
      </footer>
    </div>
  );
}

export default App;
