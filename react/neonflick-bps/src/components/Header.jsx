import { useWalletAuth } from "./WalletAuthContext";
import { useState, useRef } from "react";
import ConnectWallet from "./ConnectWallet";
import ChangeWalletModal from "./ChangeWalletModal";

function shortenAddress(address) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export default function Header({ activeSection, setActiveSection }) {
  const { user, logout } = useWalletAuth();
  const [showActions, setShowActions] = useState(false);
  const [showChangeWalletModal, setShowChangeWalletModal] = useState(false);
  const timerRef = useRef(null);

  // Показ кнопок при hover
  const handleMouseOver = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowActions(true);
  };

  const handleMouseOut = (e) => {
    const toElement = e.relatedTarget;
    if (
      toElement &&
      (toElement.closest(".wallet-wrapper") ||
        toElement.closest(".wallet-action-btn"))
    ) return;

    timerRef.current = setTimeout(() => setShowActions(false), 6000);
  };

  // Logout
  const handleLogout = async () => {
    try {
      if (window.solana?.isPhantom) { try { await window.solana.disconnect(); } catch {} }
    } catch (err) {
      console.error("Failed to disconnect Phantom:", err);
    }

    try {
      if (window.ethereum?.isMetaMask || window.ethereum?.isCoinbaseWallet) {
        try { await window.ethereum.request({ method: "eth_requestAccounts" }); } catch {}
      }
    } catch (err) {
      console.error("Failed to handle Ethereum disconnect:", err);
    } finally {
      logout();
    }
  };

  return (
    <header className="header flex items-center justify-between px-6 py-4">
      <h1 className="logo text-cyan-300 text-xl font-semibold tracking-wide">
        Neonflick-bps
      </h1>

      {/* NAV */}
      {user ? (
        <nav className="nav flex items-center gap-8">
          <button
            onClick={() => setActiveSection("products")}
            className={`nav-btn ${activeSection === "products" ? "nav-active" : ""}`}
          >
            Products
          </button>
          <button
            onClick={() => setActiveSection("create")}
            className={`nav-btn ${activeSection === "create" ? "nav-active" : ""}`}
          >
            Create
          </button>
        </nav>
      ) : (
        <ConnectWallet mode="header" />
      )}

      {/* WALLET */}
      {user && (
        <div
          className="wallet-wrapper relative"
          onMouseOver={handleMouseOver}
          onMouseOut={handleMouseOut}
        >
          <div className="wallet-chip">{shortenAddress(user.wallet)}</div>

          {showActions && (
            <div className="wallet-action-container">
              <button
                onClick={() => setShowChangeWalletModal(true)}
                className="wallet-action-btn change-wallet"
              >
                Change Wallet
              </button>
              <button
                onClick={handleLogout}
                className="wallet-action-btn disconnect"
              >
                Disconnect
              </button>
            </div>
          )}

          {showChangeWalletModal && (
            <ChangeWalletModal onClose={() => setShowChangeWalletModal(false)} />
          )}
        </div>
      )}
    </header>
  );
}
