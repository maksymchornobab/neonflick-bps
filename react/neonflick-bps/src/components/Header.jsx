import { useWalletAuth } from "./WalletAuthContext";
import { useEffect, useMemo, useRef } from "react";
import {
  WalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import "@solana/wallet-adapter-react-ui/styles.css";

/* 🔹 Wallet ↔ Auth sync (НЕ впливає на UI кнопки) */
function WalletAuthSync() {
  const { publicKey, connected } = useWallet();
  const { connectedWallet, loginWithWallet, logout } = useWalletAuth();

  const wasConnectedRef = useRef(false);

  useEffect(() => {
    // 🔌 connected
    if (connected && publicKey) {
      const address = publicKey.toString();
      wasConnectedRef.current = true;

      if (address !== connectedWallet) {
        loginWithWallet(address);
      }
      return;
    }

    // 🔌 disconnected
    if (!connected && wasConnectedRef.current) {
      wasConnectedRef.current = false;

      if (connectedWallet) {
        logout(); // ❗ тільки auth logout
      }
    }
  }, [connected, publicKey, connectedWallet, loginWithWallet, logout]);

  return null;
}

/* 🔹 Stable Wallet UI (адреса завжди видна) */
function WalletSection() {
  const { publicKey, connected } = useWallet();

  return (
    <div className="flex items-center gap-3">
      {/* адреса — source of truth */}
      {connected && publicKey && (
        <div className="wallet-chip">
          {publicKey.toString().slice(0, 4)}...
          {publicKey.toString().slice(-4)}
        </div>
      )}

      {/* єдина кнопка */}
      <WalletMultiButton />
    </div>
  );
}

export default function Header({ activeSection, setActiveSection }) {
  // ❗ adapters створюються ОДИН раз
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <WalletAuthSync />

        <header className="header flex items-center justify-between px-6 py-4">
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

          {/* 🔐 WALLET UI */}
          <WalletSection />
        </header>
      </WalletModalProvider>
    </WalletProvider>
  );
}
