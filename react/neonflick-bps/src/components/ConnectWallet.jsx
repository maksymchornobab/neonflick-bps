import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useWalletAuth } from "./WalletAuthContext";
import Notification from "./Notification";
import TermsConsentModal from "./TermsConsentModal";

export default function ConnectWallet({ onConnect }) {
  const { loginWithWallet } = useWalletAuth();

  const [connecting, setConnecting] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [sessionWallet, setSessionWallet] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);

  const [notification, setNotification] = useState("");
  const [blockedWallet, setBlockedWallet] = useState(null); // для модалки блокування

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
    setShowWalletModal(true);
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

      const res = await provider.connect();
      if (!res?.publicKey) throw new Error("No publicKey returned");

      const walletAddress = res.publicKey.toString();

      // Backend auth
      const loginRes = await fetch("http://127.0.0.1:5000/auth/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: walletAddress,
          consent: true,
        }),
      });

      if (loginRes.status === 403) {
        setBlockedWallet(walletAddress);
        setShowWalletModal(false);
        return;
      }

      const loginData = await loginRes.json();
      if (!loginData?.token) throw new Error("Auth failed");

      // pending session
      setSessionWallet(walletAddress);
      setSessionToken(loginData.token);

      localStorage.setItem("jwt_token", loginData.token);
      localStorage.setItem("cryptoRiskConsent", "true");

      setShowWalletModal(false);

      // Перевірка Terms
      const meRes = await fetch("http://127.0.0.1:5000/auth/me", {
        headers: { Authorization: `Bearer ${loginData.token}` },
      });

      const meData = await meRes.json();
      const hasTerms = meData?.user?.consents?.includes("terms");

      if (!hasTerms) {
        setShowTermsModal(true);
        return;
      }

      // Якщо Terms вже прийняті
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

  // 🔹 Модалка вибору гаманця
  const walletModal = showWalletModal
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
              onClick={() => setShowWalletModal(false)}
              disabled={connecting}
            >
              Cancel
            </button>
          </div>
        </div>,
        document.body
      )
    : null;

  // 🔹 Модалка заблокованого гаманця
  const blockedModal = blockedWallet
    ? createPortal(
        <div className="blocked-modal-backdrop">
          <div className="blocked-modal">
            <h2>Wallet Blocked</h2>
            <p>
              The wallet <strong>{blockedWallet}</strong> is blocked. <br />
              Please connect another wallet.
            </p>
            <button onClick={() => setBlockedWallet(null)}>Close</button>
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

      {walletModal}

      {showTermsModal && sessionWallet && sessionToken && (
        <TermsConsentModal
          wallet={sessionWallet}
          token={sessionToken}
          onAgree={async () => {
            setShowTermsModal(false);
            await loginWithWallet(sessionWallet);
            if (onConnect) onConnect(sessionWallet);
          }}
          onReject={() => setBlockedWallet(sessionWallet)}
        />
      )}

      {blockedModal}

      {notification && (
        <Notification
          message={notification}
          onClose={() => setNotification("")}
        />
      )}
    </>
  );
}
