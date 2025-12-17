import { useWalletAuth } from "./WalletAuthContext";
import { useState, useRef } from "react";

function shortenAddress(address) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export default function Header() {
  const { user, logout } = useWalletAuth();
  const [showDisconnect, setShowDisconnect] = useState(false);
  const timerRef = useRef(null);

  const handleMouseOver = (e) => {
    // Якщо таймер був на зникнення — прибираємо його
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setShowDisconnect(true);
  };

  const handleMouseOut = (e) => {
    const toElement = e.relatedTarget;
    // Якщо курсор все ще в wrapper або на кнопці — нічого не робимо
    if (toElement && (toElement.closest(".wallet-wrapper") || toElement.closest(".wallet-disconnect"))) {
      return;
    }

    // Інакше запускаємо таймер на 5 секунд
    timerRef.current = setTimeout(() => {
      setShowDisconnect(false);
    }, 5000);
  };

  return (
    <header className="header flex items-center justify-between px-6 py-4">
      <h1 className="logo text-cyan-300 text-xl font-semibold">
        Neonflick-bps
      </h1>

      {user && (
        <div
          className="wallet-wrapper"
          onMouseOver={handleMouseOver}
          onMouseOut={handleMouseOut}
        >
          <div className="wallet-chip">{shortenAddress(user.wallet)}</div>

          {showDisconnect && (
  <button
    onClick={logout}
    className={`wallet-disconnect ${showDisconnect ? "visible" : ""}`}
  >
    Disconnect
  </button>
)}

        </div>
      )}

      <nav className="nav flex items-center gap-6">
        <a href="#create">Create</a>
        <a href="#products">Products</a>
      </nav>
    </header>
  );
}
