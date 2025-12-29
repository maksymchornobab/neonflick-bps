import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useWalletAuth } from "./WalletAuthContext";
import Notification from "./Notification";
import TermsConsentModal from "./TermsConsentModal";

export default function ConnectWallet({ onConnect }) {
  const { loginWithWallet } = useWalletAuth();

  const [connecting, setConnecting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [forceBlock, setForceBlock] = useState(false);

  const [notification, setNotification] = useState("");

  // 🔑 локальна pending-сесія ДО прийняття Terms
  const [sessionWallet, setSessionWallet] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);

  useEffect(() => {
    const savedConsent = localStorage.getItem("cryptoRiskConsent");
    setAgreed(savedConsent === "true");
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
    const provider = window.solana;
    if (!provider?.isPhantom) {
      setNotification("Phantom wallet not detected");
      return;
    }

    try {
      setConnecting(true);
      setNotification("Connecting to Phantom…");

      // 1️⃣ Phantom connect
      const res = await provider.connect();
      if (!res?.publicKey) throw new Error("No publicKey returned");

      const walletAddress = res.publicKey.toString();

      // 2️⃣ Backend auth
      const loginRes = await fetch("http://127.0.0.1:5000/auth/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: walletAddress,
          consent: true,
        }),
      });

      const loginData = await loginRes.json();
      if (!loginData?.token) throw new Error("Auth failed");

      // 3️⃣ pending session (ВАЖЛИВО)
      setSessionWallet(walletAddress);
      setSessionToken(loginData.token);

      localStorage.setItem("jwt_token", loginData.token);
      localStorage.setItem("cryptoRiskConsent", "true");

      setShowModal(false);

      // 4️⃣ Перевірка Terms
      const meRes = await fetch("http://127.0.0.1:5000/auth/me", {
        headers: {
          Authorization: `Bearer ${loginData.token}`,
        },
      });

      const meData = await meRes.json();
      const hasTerms = meData?.user?.consents?.includes("terms");

      if (!hasTerms) {
        setShowTermsModal(true);
        return; // ⛔️ стоп — чекаємо згоди
      }

      // ✅ якщо Terms вже прийняті
      await loginWithWallet(walletAddress);
      if (onConnect) onConnect(walletAddress);
    } catch (err) {
      console.error(err);
      setNotification(err.message || "Failed to connect wallet");
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

            <p className="risks-agree">
              To connect your wallet, you must agree to the{" "}
              <strong>Crypto Risk Disclosure</strong>
            </p>

            <div className="wallet-modal__consent">
              <input
                type="checkbox"
                id="consent"
                checked={agreed}
                onChange={handleConsentChange}
              />
              <label htmlFor="consent">
                I agree to the{" "}
                <a
                  href="/legal/crypto-risks"
                  target="_blank"
                  rel="noopener noreferrer"
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

      {showTermsModal && sessionWallet && sessionToken && (
        <TermsConsentModal
          wallet={sessionWallet}
          token={sessionToken}
          onAgree={async () => {
            setShowTermsModal(false);
            await loginWithWallet(sessionWallet);
            if (onConnect) onConnect(sessionWallet);
          }}
          onReject={() => setForceBlock(true)}
        />
      )}

      {forceBlock && (
        <div className="force-block-overlay">
          Sorry, we cannot provide access without agreeing to Terms.
        </div>
      )}

      {notification && (
        <Notification
          message={notification}
          onClose={() => setNotification("")}
        />
      )}
    </>
  );
}
