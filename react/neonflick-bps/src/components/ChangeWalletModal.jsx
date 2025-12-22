import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ethers } from "ethers";
import { useWalletAuth } from "./WalletAuthContext";
import { Connection, clusterApiUrl } from "@solana/web3.js";

export default function ChangeWalletModal({ onClose }) {
  const { loginWithWallet } = useWalletAuth();
  const [connecting, setConnecting] = useState(false);
  const [availableWallets, setAvailableWallets] = useState([]);

  // Detect wallets
  useEffect(() => {
    const wallets = [];
    if (window.ethereum) wallets.push({ type: "EVM", name: "MetaMask" });
    if (window.solana?.isPhantom) wallets.push({ type: "SOL", name: "Phantom" });
    setAvailableWallets(wallets);
  }, []);

  const connectSelectedWallet = async (wallet) => {
    try {
      setConnecting(true);
      let walletAddress = "";

      if (wallet.type === "EVM") {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        walletAddress = await signer.getAddress();
      }

      if (wallet.type === "SOL") {
        try { await window.solana.disconnect(); } catch {}
        const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
        const res = await window.solana.connect({ onlyIfTrusted: false });
        walletAddress = res.publicKey.toString();
      }

      await loginWithWallet(walletAddress);
      onClose();
    } catch (err) {
      console.error("Failed to change wallet:", err);
      onClose();
    } finally {
      setConnecting(false);
    }
  };

  return createPortal(
    <div className="wallet-modal-overlay">
      <div className="wallet-modal">
        <h2 className="wallet-modal__title">Select Wallet</h2>

        <div className="wallet-modal__list">
          {availableWallets.length === 0 && (
            <p className="wallet-modal__empty">No wallets detected</p>
          )}

          {availableWallets.map((wallet, idx) => (
            <button
              key={idx}
              className="wallet-modal__item"
              onClick={() => connectSelectedWallet(wallet)}
              disabled={connecting}
            >
              {wallet.name}
            </button>
          ))}
        </div>

        <button className="wallet-modal__cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>,
    document.body
  );
}
