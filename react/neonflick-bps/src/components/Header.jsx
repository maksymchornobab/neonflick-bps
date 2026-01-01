import { useWalletAuth } from "./WalletAuthContext";
import { useState, useRef, useMemo, useEffect } from "react";
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
  SolflareWalletAdapter
} from "@solana/wallet-adapter-wallets";
import ChangeWalletModal from "./ChangeWalletModal";
import "@solana/wallet-adapter-react-ui/styles.css";

function shortenAddress(address) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export default function Header({ activeSection, setActiveSection }) {
  const { user, connectedWallet, loginWithWallet, logout } = useWalletAuth();
  const [showActions, setShowActions] = useState(false);
  const [showChangeWalletModal, setShowChangeWalletModal] = useState(false);
  const timerRef = useRef(null);

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

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

  const handleLogout = async () => {
    try {
      if (window.solana?.isPhantom) {
        try { await window.solana.disconnect(); } catch {}
      }
      localStorage.removeItem("walletadapter"); // reset multi-adapter
    } catch (err) {
      console.error("Failed to disconnect Phantom:", err);
    } finally {
      logout();
    }
  };

  // 🔹 Авто-логін через WalletMultiButton
  const WalletAuthHandler = () => {
    const { publicKey } = useWallet();

    useEffect(() => {
      if (!publicKey) return;
      const walletAddress = publicKey.toString();

      // Якщо гаманець вже підключений в сессії — не робимо нічого
      if (walletAddress === connectedWallet) return;

      // Логін через WalletAuthContext
      loginWithWallet(walletAddress);
    }, [publicKey, connectedWallet, loginWithWallet]);

    return <WalletMultiButton />;
  };

  return (
    <WalletProvider wallets={wallets} autoConnect={false}>
      <WalletModalProvider>
        <header className="header flex items-center justify-between px-6 py-4">
          <h1 className="logo text-cyan-300 text-xl font-semibold tracking-wide">
            Neonflick-bps
          </h1>

          {/* NAV */}
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

          {/* WALLET */}
          {user ? (
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
          ) : (
            <WalletAuthHandler />
          )}
        </header>
      </WalletModalProvider>
    </WalletProvider>
  );
}
