import { useState } from "react";
import { createPortal } from "react-dom";
import { Connection } from "@solana/web3.js";
import { useWalletAuth } from "./WalletAuthContext";
import Notification from "./Notification";

export default function ConnectWallet({ onConnect }) {
  const { loginWithWallet } = useWalletAuth();

  const [connecting, setConnecting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState("");

  const RPC_URL = process.env.REACT_APP_SOLANA_RPC; // mainnet RPC від Helius

  // 🔍 Detect ONLY Phantom (Solana)
  const detectWallets = () => {
    if (!window.solana?.isPhantom) {
      setNotification("Phantom wallet not found");
      return;
    }
    setShowModal(true);
  };

  // 🔐 Connect Phantom (SOL only)
  const connectPhantom = async () => {
    const provider = window.solana;

    try {
      setConnecting(true);

      if (!provider?.isPhantom) {
        setNotification("Phantom wallet not found");
        return;
      }

      // 🔹 Connect
      const res = await provider.connect({ onlyIfTrusted: false });
      const walletAddress = res.publicKey.toString();

      // 🔹 Check network via RPC
      const connection = new Connection(RPC_URL, "confirmed");
      const version = await connection.getVersion();
      console.log("Connected RPC version:", version);
      console.log("Wallet address:", walletAddress);

      // 🔐 Login
      await loginWithWallet(walletAddress);
      if (onConnect) onConnect(walletAddress);

      setNotification(`Wallet connected: ${walletAddress}`);
      setShowModal(false);
    } catch (err) {
      console.error("Phantom connection failed:", err);
      setNotification("Failed to connect Phantom wallet");
    } finally {
      setConnecting(false);
    }
  };

  // 🪟 Modal
  const modal = showModal
    ? createPortal(
        <div className="wallet-modal-overlay">
          <div className="wallet-modal">
            <h2 className="wallet-modal__title">Connect Wallet</h2>

            <div className="wallet-modal__list">
              <button
                className="wallet-modal__item"
                onClick={connectPhantom}
                disabled={connecting}
              >
                Phantom (Solana)
              </button>
            </div>

            <button
              className="wallet-modal__cancel"
              onClick={() => setShowModal(false)}
              disabled={connecting}
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

      {notification && (
        <Notification
          message={notification}
          onClose={() => setNotification("")}
        />
      )}
    </>
  );
}
