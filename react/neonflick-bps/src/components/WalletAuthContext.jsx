import { createContext, useContext, useEffect, useState } from "react";

const WalletAuthContext = createContext(null);

export function WalletAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const [connectedWallet, setConnectedWallet] = useState(null);
  const [pendingWallet, setPendingWallet] = useState(null);

  // 🔒 Blocked wallet modal
  const [blockedWallet, setBlockedWallet] = useState(null);
  const [showBlockedModal, setShowBlockedModal] = useState(false);

  // 📜 Terms + Crypto Risk modal
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentWallet, setConsentWallet] = useState(null);
  const BACKEND = process.env.REACT_APP_BACKEND;

  // 🔁 Restore session
  useEffect(() => {
    const savedToken = localStorage.getItem("jwt_token");
    if (!savedToken) {
      setLoading(false);
      return;
    }

    fetch(`${BACKEND}/auth/me`, {
      headers: { Authorization: `Bearer ${savedToken}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          setToken(savedToken);
          setConnectedWallet(data.user.wallet);
        } else {
          localStorage.removeItem("jwt_token");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  /* 🔎 CHECK REQUIRED CONSENTS (TERMS + CRYPTO RISK ONLY) */
  const checkAccessConsents = async (wallet, jwt) => {
    try {
      const res = await fetch(
        `${BACKEND}/auth/consent/check`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`,
          },
          body: JSON.stringify({ wallet }),
        }
      );

      if (!res.ok) return;

      const data = await res.json();

      const hasTerms = data.terms === true;
      const hasRisk = data.crypto_risk_disclosure === true;

      if (!hasTerms || !hasRisk) {
        setConsentWallet(wallet);
        setShowConsentModal(true);
      }
    } catch (err) {
      console.error("Consent check failed:", err);
    }
  };

  // 🔐 Login / Change wallet
  const loginWithWallet = async (publicKey) => {
    try {
      const res = await fetch(`${BACKEND}/auth/wallet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: publicKey }),
      });

      // 🚫 BLOCKED WALLET
      if (res.status === 403) {
        const data = await res.json();
        if (data?.error === "wallet_blocked") {
          setBlockedWallet(publicKey);
          setShowBlockedModal(true);
          return;
        }
      }

      const data = await res.json();

      if (data?.user && data?.token) {
        setUser(data.user);
        setToken(data.token);
        setConnectedWallet(data.user.wallet);
        localStorage.setItem("jwt_token", data.token);

        // 🔍 CHECK TERMS + CRYPTO RISK
        await checkAccessConsents(data.user.wallet, data.token);
      }
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  // 🚪 Logout (AUTH ONLY)
  const logout = async () => {
    setUser(null);
    setToken(null);
    setConnectedWallet(null);
    setPendingWallet(null);
    setShowConsentModal(false);
    setConsentWallet(null);
    localStorage.removeItem("jwt_token");
  };

  // 🔁 Change wallet confirm
  const changeWallet = async () => {
    if (pendingWallet) {
      await loginWithWallet(pendingWallet);
      setPendingWallet(null);
    }
  };

  // ❌ Close blocked modal
  const closeBlockedModal = () => {
    setShowBlockedModal(false);
    setBlockedWallet(null);
  };

  // ✅ Called when Terms + Risk accepted
  const confirmAccessConsents = () => {
    setShowConsentModal(false);
    setConsentWallet(null);
  };

  // ❌ Reject Terms/Risk → full logout
  const rejectAccessConsents = () => {
    logout();
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

        // 🔒 blocked wallet
        showBlockedModal,
        blockedWallet,
        closeBlockedModal,

        // 📜 terms + crypto risk
        showConsentModal,
        consentWallet,
        confirmAccessConsents,
        rejectAccessConsents,
      }}
    >
      {children}
    </WalletAuthContext.Provider>
  );
}

export const useWalletAuth = () => useContext(WalletAuthContext);
