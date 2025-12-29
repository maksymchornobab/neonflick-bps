import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Connection } from "@solana/web3.js";
import { useWalletAuth } from "./WalletAuthContext";
import Notification from "./Notification";

export default function ConnectWallet({ onConnect }) {
  const { loginWithWallet } = useWalletAuth();

  const [connecting, setConnecting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [notification, setNotification] = useState("");

  const RPC_URL = process.env.REACT_APP_SOLANA_RPC;

  useEffect(() => {
    // 🔹 Перевірка згоди з localStorage
    const savedConsent = localStorage.getItem("cryptoRiskConsent");
    setAgreed(savedConsent === "true");

    // 🔹 Перехоплення події connect з Phantom
    const provider = window.solana;
    if (provider?.isPhantom) {
      provider.on("connect", (publicKey) => {
        if (!localStorage.getItem("cryptoRiskConsent")) {
          setNotification(
            "You must agree to Crypto Risk Disclosure before connecting your wallet"
          );
          provider.disconnect();
        }
      });
    }

    return () => {
      if (provider?.isPhantom) provider.removeAllListeners("connect");
    };
  }, []);

  const detectWallets = () => {
    if (!window.solana) {
      setNotification("Solana wallet not found in your browser");
      return;
    }
    if (!window.solana.isPhantom) {
      setNotification("Only Phantom wallet is supported");
      return;
    }
    setShowModal(true);
  };

  const connectPhantom = async () => {
    if (!agreed) {
      setNotification(
        "You must agree to Crypto Risk Disclosure before connecting your wallet"
      );
      return;
    }

    const provider = window.solana;
    if (!provider?.isPhantom) {
      setNotification("Phantom wallet not detected");
      return;
    }

    try {
      setConnecting(true);
      setNotification("Connecting to Phantom…");

      const res = await provider.connect({ onlyIfTrusted: false });
      if (!res?.publicKey) throw new Error("No publicKey returned from Phantom");

      const walletAddress = res.publicKey.toString();
      const connection = new Connection(RPC_URL, "confirmed");

      await loginWithWallet(walletAddress);
      if (onConnect) onConnect(walletAddress);

      setNotification(`Wallet connected: ${walletAddress}`);
      setShowModal(false);
    } catch (err) {
      console.error("❌ Phantom connection error full:", err);
      setNotification(`Failed to connect Phantom wallet: ${err?.message || err}`);
    } finally {
      setConnecting(false);
    }
  };

  const handleConsentChange = (e) => {
    const checked = e.target.checked;
    setAgreed(checked);
    localStorage.setItem("cryptoRiskConsent", checked.toString());
  };

  const modal = showModal
    ? createPortal(
        <div className="wallet-modal-overlay">
          <div className="wallet-modal">
            <h2 className="wallet-modal__title">Connect Wallet</h2>

            <div className="wallet-modal__list">
              <button
                className="wallet-modal__item"
                onClick={connectPhantom}
                disabled={connecting || !agreed}
              >
                Phantom
              </button>
            </div>

            <p className="risks-agree">To connect your wallet, you have to agree to 
               <strong style={{ fontWeight: "bold", color: "#00ffff", marginLeft: "3px" }}>Crypto Risk 
                Disclosure.</strong> 
            </p>

            <div className="wallet-modal__consent">
              <input
                type="checkbox"
                id="consent"
                checked={agreed}
                onChange={handleConsentChange}
                style={{ marginRight: "10px" }}
              />
              <label htmlFor="consent">
                I agree to the{" "}
                <a
                  href="/legal/crypto-risks"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontWeight: "bold", textDecoration: "underline", color: "#00ffff" }}
                >
                  Crypto Risk Disclosure
                </a>
              </label>
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
