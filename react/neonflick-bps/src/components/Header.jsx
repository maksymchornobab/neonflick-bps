import { useWalletAuth } from "./WalletAuthContext";
import { useState, useRef } from "react";
import ConnectWallet from "./ConnectWallet";

function shortenAddress(address) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export default function Header({ activeSection, setActiveSection }) {
  const { user, logout } = useWalletAuth();
  const [showActions, setShowActions] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const timerRef = useRef(null);

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
    ) {
      return;
    }
    timerRef.current = setTimeout(() => setShowActions(false), 3000);
  };

  const handleLogout = async () => {
    try {
      if (window.solana?.isPhantom) {
        try { await window.solana.disconnect(); } catch {}
      }
      if (window.ethereum?.isMetaMask || window.ethereum?.isCoinbaseWallet) {
        try { await window.ethereum.request({ method: "eth_requestAccounts" }); } catch {}
      }
    } catch (err) {
      console.error("Failed to disconnect wallet:", err);
    } finally {
      logout();
    }
  };

  return (
    <header className="header flex items-center justify-between px-6 py-4">
      {/* LOGO */}
      <h1 className="logo text-cyan-300 text-xl font-semibold tracking-wide">
        Neonflick-bps
      </h1>

      {/* NAV */}
      {user ? (
        <nav className="nav flex items-center gap-8">
          <button
            onClick={() => setActiveSection("products")}
            className={`nav-btn ${
              activeSection === "products" ? "nav-active" : ""
            }`}
          >
            Products
          </button>

          <button
            onClick={() => setActiveSection("create")}
            className={`nav-btn ${
              activeSection === "create" ? "nav-active" : ""
            }`}
          >
            Create
          </button>
        </nav>
      ) : (
        <div className="header-actions">
          <ConnectWallet />
        </div>
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
            <div className="absolute top-10 right-0 flex flex-col gap-2 z-50">
              <button
                onClick={handleLogout}
                className="wallet-action-btn px-3 py-1 bg-red-500 text-white rounded-md"
              >
                Disconnect
              </button>

              <button
                onClick={() => setShowConnectModal(true)}
                className="wallet-action-btn px-3 py-1 bg-cyan-500 text-black rounded-md"
              >
                Change Wallet
              </button>
            </div>
          )}

          {/* Виклик існуючого ConnectWallet для повторного підключення */}
          {showConnectModal && (
            <ConnectWallet />
          )}
        </div>
      )}
    </header>
  );
}
