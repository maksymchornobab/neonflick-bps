import { createContext, useContext, useEffect, useState } from "react";

const WalletAuthContext = createContext(null);

export function WalletAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); // 🔹 зберігаємо JWT
  const [loading, setLoading] = useState(true);

  // 🔁 Restore session from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("jwt_token");
    if (savedToken) {
      fetch("http://127.0.0.1:5000/auth/me", {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      })
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
          if (data?.user) {
            setUser(data.user);
            setToken(savedToken);
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // 🔐 Login
  const loginWithWallet = async (publicKey) => {
    const res = await fetch("http://127.0.0.1:5000/auth/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet: publicKey }),
    });

    const data = await res.json();
    if (data?.user && data?.token) {
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem("jwt_token", data.token); // 🔑 зберігаємо токен для наступних запитів
    }
  };

  // 🚪 Logout
  const logout = async () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("jwt_token");

    if (window.solana?.isPhantom) {
      await window.solana.disconnect();
    }
  };

  return (
    <WalletAuthContext.Provider value={{ user, token, loginWithWallet, logout, loading }}>
      {children}
    </WalletAuthContext.Provider>
  );
}

export const useWalletAuth = () => useContext(WalletAuthContext);
