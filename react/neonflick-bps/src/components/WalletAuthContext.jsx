import { createContext, useContext, useEffect, useState } from "react";

const WalletAuthContext = createContext(null);

export function WalletAuthProvider({ children }) {
  const [user, setUser] = useState(null); // активний акаунт
  const [token, setToken] = useState(null); // JWT
  const [loading, setLoading] = useState(true);
  const [connectedWallet, setConnectedWallet] = useState(null); // гаманець для UI
  const [pendingWallet, setPendingWallet] = useState(null); // гаманець для ChangeWallet

  // 🔁 Restore session
  useEffect(() => {
    const savedToken = localStorage.getItem("jwt_token");
    if (!savedToken) {
      setLoading(false);
      return;
    }

    fetch("http://127.0.0.1:5000/auth/me", {
      headers: { Authorization: `Bearer ${savedToken}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          setToken(savedToken);
          setConnectedWallet(data.user.wallet);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // 🔐 Login / ChangeWallet
  const loginWithWallet = async (publicKey) => {
    try {
      const res = await fetch("http://127.0.0.1:5000/auth/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: publicKey }),
      });

      const data = await res.json();
      if (data?.user && data?.token) {
        setUser(data.user);
        setToken(data.token);
        setConnectedWallet(data.user.wallet);
        localStorage.setItem("jwt_token", data.token);
      }
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  // 🚪 Logout
  const logout = async () => {
    setUser(null);
    setToken(null);
    setConnectedWallet(null);
    setPendingWallet(null);
    localStorage.removeItem("jwt_token");

    if (window.solana?.isPhantom) {
      try { await window.solana.disconnect(); } catch {}
    }
  };

  // 🔹 ChangeWallet action
  const changeWallet = async () => {
    if (pendingWallet) {
      await loginWithWallet(pendingWallet);
      setPendingWallet(null);
    }
  };

  return (
    <WalletAuthContext.Provider
      value={{
        user,
        token,
        connectedWallet,
        pendingWallet,
        setPendingWallet,
        changeWallet,
        loginWithWallet,
        logout,
        loading,
      }}
    >
      {children}
    </WalletAuthContext.Provider>
  );
}

export const useWalletAuth = () => useContext(WalletAuthContext);
