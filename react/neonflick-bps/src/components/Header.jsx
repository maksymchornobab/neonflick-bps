import { useWalletAuth } from "./WalletAuthContext";
import { useState, useRef } from "react";
import ConnectWallet from "./ConnectWallet";

function shortenAddress(address) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export default function Header({ activeSection, setActiveSection }) {
  const { user, logout } = useWalletAuth();
  const [showDisconnect, setShowDisconnect] = useState(false);
  const timerRef = useRef(null);

  const handleMouseOver = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowDisconnect(true);
  };

  const handleMouseOut = (e) => {
    const toElement = e.relatedTarget;
    if (
      toElement &&
      (toElement.closest(".wallet-wrapper") ||
        toElement.closest(".wallet-disconnect"))
    ) {
      return;
    }
    timerRef.current = setTimeout(() => setShowDisconnect(false), 3000);
  };

  const handleLogout = async () => {
    try {
      // 🔹 Solana
      if (window.solana?.isPhantom) {
        try { await window.solana.disconnect(); } catch {}
      }

      // 🔹 EVM-гаманець через Web3Modal
      if (window.ethereum?.isMetaMask || window.ethereum?.isCoinbaseWallet) {
        try {
          await window.ethereum.request({ method: "eth_requestAccounts" });
        } catch {}
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
          {/* Використовуємо компонент ConnectWallet для єдиної логіки */}
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

          {showDisconnect && (
            <button
              onClick={handleLogout}
              className="wallet-disconnect visible px-3 py-1 bg-red-500 text-white rounded-md absolute top-10 right-0"
            >
              Disconnect
            </button>
          )}
        </div>
      )}
    </header>
  );
}
