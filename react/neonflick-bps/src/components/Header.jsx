import { useWalletAuth } from "./WalletAuthContext";
import { useState, useRef } from "react";

function shortenAddress(address) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export default function Header({ activeSection, setActiveSection }) {
  const { user, logout } = useWalletAuth();
  const [showDisconnect, setShowDisconnect] = useState(false);
  const timerRef = useRef(null);

  const handleMouseOver = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
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

    timerRef.current = setTimeout(() => {
      setShowDisconnect(false);
    }, 5000);
  };

  return (
    <header className="header flex items-center justify-between px-6 py-4">
      {/* LOGO */}
      <h1 className="logo text-cyan-300 text-xl font-semibold tracking-wide">
        Neonflick-bps
      </h1>

      {/* NAV */}
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

      {/* WALLET */}
      {user && (
        <div
          className="wallet-wrapper relative"
          onMouseOver={handleMouseOver}
          onMouseOut={handleMouseOut}
        >
          <div className="wallet-chip">
            {shortenAddress(user.wallet)}
          </div>

          {showDisconnect && (
            <button
              onClick={logout}
              className="wallet-disconnect visible"
            >
              Disconnect
            </button>
          )}
        </div>
      )}
    </header>
  );
}
