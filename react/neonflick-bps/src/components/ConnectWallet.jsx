import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  WalletProvider,
  useWallet
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton
} from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { useWalletAuth } from "./WalletAuthContext";
import Notification from "./Notification";
import TermsConsentModal from "./TermsConsentModal";
import "@solana/wallet-adapter-react-ui/styles.css";

export default function ConnectWallet({ onConnect }) {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <WalletProvider wallets={wallets} autoConnect={false}>
      <WalletModalProvider>
        <ConnectWalletInner onConnect={onConnect} />
      </WalletModalProvider>

      <style>{`
        .wallet-adapter-dropdown {
          z-index: 1050 !important;
        }
        .wallet-adapter-button {
          font-weight: bold;
          border-radius: 12px;
          padding: 12px 24px;
          cursor: pointer;
          transition: 0.2s all;
        }
        .wallet-adapter-button:hover {
          box-shadow: 0 0 20px #00ffff, 0 0 40px #00ffff;
        }
      `}</style>
    </WalletProvider>
  );
}

function ConnectWalletInner({ onConnect }) {
  const { loginWithWallet } = useWalletAuth();
  const { publicKey, disconnect } = useWallet();

  const [showWalletModal, setShowWalletModal] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [sessionWallet, setSessionWallet] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [notification, setNotification] = useState("");
  const [blockedWallet, setBlockedWallet] = useState(null);

  useEffect(() => {
    const savedConsent = localStorage.getItem("cryptoRiskConsent");
    setAgreed(savedConsent === "true");
  }, []);

  // 🔹 Авторизація при підключеному гаманці
  useEffect(() => {
    if (!publicKey || !agreed) return;

    const walletAddress = publicKey.toString();
    setSessionWallet(walletAddress);

    const authenticate = async () => {
      try {
        const loginRes = await fetch("http://127.0.0.1:5000/auth/wallet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet: walletAddress, consent: true }),
        });

        if (loginRes.status === 403) {
          setBlockedWallet(walletAddress);
          return;
        }

        const loginData = await loginRes.json();
        if (!loginData?.token) throw new Error("Auth failed");

        setSessionToken(loginData.token);
        localStorage.setItem("jwt_token", loginData.token);
        localStorage.setItem("cryptoRiskConsent", "true");

        const meRes = await fetch("http://127.0.0.1:5000/auth/me", {
          headers: { Authorization: `Bearer ${loginData.token}` },
        });
        const meData = await meRes.json();
        const hasTerms = meData?.user?.consents?.includes("terms");

        if (!hasTerms) {
          setShowTermsModal(true);
          return;
        }

        await loginWithWallet(walletAddress);
        if (onConnect) onConnect(walletAddress);
        setNotification("");
      } catch (err) {
        console.error(err);
        setNotification(err.message || "Failed to connect wallet");
      }
    };

    authenticate();
  }, [publicKey, agreed, loginWithWallet, onConnect]);

  const handleConsentChange = (e) => {
    setAgreed(e.target.checked);
  };

  // 🔹 Reset адаптера перед відкриттям модалки
  const handleOpenModal = async () => {
    try {
      if (publicKey) await disconnect();
      if (window?.localStorage?.getItem("walletadapter")) {
        window.localStorage.removeItem("walletadapter");
      }
      setShowWalletModal(true);
    } catch (err) {
      console.error("Failed to reset wallet adapter:", err);
    }
  };

  // 🔹 Submit кнопка закриває модалку тільки якщо чекбокс вибраний
  const handleSubmit = () => {
    if (!agreed) {
      setNotification("You must agree to the Crypto Risk Disclosure");
      return;
    }
    setShowWalletModal(false);
  };

  const walletModal = showWalletModal
    ? createPortal(
        <div className="wallet-modal-overlay" style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.85)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1040,
        }}>
          <div className="wallet-modal" style={{
            background: "rgba(0,0,0,0.95)",
            border: "2px solid #00ffff",
            borderRadius: "16px",
            padding: "30px",
            width: "360px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
            boxShadow: "0 0 20px #00ffff, 0 0 40px #00ffff",
          }}>
            <h2 style={{ color: "#00ffff", margin: 0 }}>Connect Wallet</h2>

            {/* 🔹 WalletMultiButton залишаємо, але модалка не закривається */}
            <WalletMultiButton />

            <div style={{ fontSize: "12px", color: "#00ffff", textAlign: "center" }}>
              To connect your wallet, you must agree to the Crypto Risk Disclosure
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                id="consent"
                checked={agreed}
                onChange={handleConsentChange}
              />
              <label htmlFor="consent" style={{ color: "#00ffff", fontSize: "14px" }}>
                I agree to the{" "}
                <a href="/legal/crypto-risks" target="_blank" rel="noopener noreferrer" style={{ color: "#00ffff", textDecoration: "underline" }}>
                  Crypto Risk Disclosure
                </a>
              </label>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
              <button
                onClick={() => setShowWalletModal(false)}
                style={{
                  background: "transparent",
                  border: "2px solid #00ffff",
                  color: "#00ffff",
                  borderRadius: "12px",
                  padding: "8px 16px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                style={{
                  background: "#00ffff",
                  border: "2px solid #00ffff",
                  color: "#000",
                  borderRadius: "12px",
                  padding: "8px 16px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  const blockedModal = blockedWallet
    ? createPortal(
        <div className="blocked-modal-backdrop" style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.85)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1040,
        }}>
          <div style={{
            background: "rgba(0,0,0,0.95)",
            borderRadius: "16px",
            padding: "30px",
            textAlign: "center",
            color: "#00ffff",
            boxShadow: "0 0 20px #00ffff, 0 0 40px #00ffff",
          }}>
            <h2>Wallet Blocked</h2>
            <p>
              The wallet <strong>{blockedWallet}</strong> is blocked. <br />
              Please connect another wallet.
            </p>
            <button
              onClick={() => setBlockedWallet(null)}
              style={{
                background: "transparent",
                border: "2px solid #00ffff",
                color: "#00ffff",
                borderRadius: "12px",
                padding: "8px 16px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <button
        onClick={handleOpenModal}
        style={{
          background: "transparent",
          border: "2px solid #00ffff",
          color: "#00ffff",
          borderRadius: "12px",
          padding: "10px 20px",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        {publicKey ? "Wallet Connected" : "Connect Wallet"}
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
