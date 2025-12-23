import { useState } from "react";
import { createPortal } from "react-dom";
import { ethers } from "ethers";
import { useWalletAuth } from "./WalletAuthContext";
import { Connection, clusterApiUrl } from "@solana/web3.js";
import Notification from "./Notification"; // 🔹 імпорт Notification

export default function ConnectWallet({ onConnect }) { // 🔹 додано onConnect
  const { loginWithWallet } = useWalletAuth();
  const [connecting, setConnecting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [availableWallets, setAvailableWallets] = useState([]);
  const [notification, setNotification] = useState(""); // 🔹 стан сповіщення

  // 🔹 Detect wallets ONLY (no connection here)
  const detectWallets = () => {
    const wallets = [];

    if (window.ethereum) wallets.push({ type: "EVM", name: "MetaMask" });
    if (window.solana?.isPhantom) wallets.push({ type: "SOL", name: "Phantom" });

    setAvailableWallets(wallets);
    setShowModal(true);
  };

  // 🔹 Connect selected wallet
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

      // 🔹 виклик callback після успішного підключення
      if (onConnect) onConnect(walletAddress);

      setNotification(`Wallet connected: ${walletAddress}`); // 🔹 Notification
      setShowModal(false);
    } catch (err) {
      console.error(err);
      setNotification("Failed to connect wallet"); // 🔹 Notification
    } finally {
      setConnecting(false);
    }
  };

  // 🔹 Modal via portal
  const modal = showModal
    ? createPortal(
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

            <button
              className="wallet-modal__cancel"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <button
        onClick={detectWallets}
        disabled={connecting}
        className="connect-wallet-btn"
      >
        {connecting ? "Connecting..." : "Connect Wallet"}
      </button>

      {modal}

      {/* 🔹 Notification */}
      {notification && (
        <Notification message={notification} onClose={() => setNotification("")} />
      )}
    </>
  );
}
