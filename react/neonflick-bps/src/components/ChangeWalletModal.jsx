import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Connection } from "@solana/web3.js";
import { useWalletAuth } from "./WalletAuthContext";

export default function ChangeWalletModal({ onClose }) {
  const { loginWithWallet } = useWalletAuth();

  const [connecting, setConnecting] = useState(false);
  const [phantomAvailable, setPhantomAvailable] = useState(false);

  const RPC_URL = process.env.REACT_APP_SOLANA_RPC; // mainnet RPC від Helius

  // 🔍 Detect Phantom ONLY
  useEffect(() => {
    setPhantomAvailable(!!window.solana?.isPhantom);
  }, []);

  const connectPhantom = async () => {
    const provider = window.solana;

    try {
      setConnecting(true);

      if (!provider?.isPhantom) {
        alert("Phantom wallet not found");
        return;
      }

      // 🔹 Connect wallet
      const res = await provider.connect({ onlyIfTrusted: false });
      const walletAddress = res.publicKey.toString();

      // 🔹 Check network via RPC
      const connection = new Connection(RPC_URL, "confirmed");
      const version = await connection.getVersion();
      console.log("Connected RPC version:", version);
      console.log("Wallet address:", walletAddress);

      // 🔐 Login via explicit change
      await loginWithWallet(walletAddress);
      onClose();
    } catch (err) {
      console.error("Failed to change wallet:", err);
      alert("Failed to connect Phantom wallet");
      onClose();
    } finally {
      setConnecting(false);
    }
  };

  return createPortal(
    <div className="wallet-modal-overlay">
      <div className="wallet-modal">
        <h2 className="wallet-modal__title">Change Wallet</h2>

        <div className="wallet-modal__list">
          {!phantomAvailable && (
            <p className="wallet-modal__empty">Phantom wallet not detected</p>
          )}

          {phantomAvailable && (
            <button
              className="wallet-modal__item"
              onClick={connectPhantom}
              disabled={connecting}
            >
              Phantom (Solana)
            </button>
          )}
        </div>

        <button
          className="wallet-modal__cancel"
          onClick={onClose}
          disabled={connecting}
        >
          Cancel
        </button>
      </div>
    </div>,
    document.body
  );
}
