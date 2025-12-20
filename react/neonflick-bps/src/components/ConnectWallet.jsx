import { useState } from "react";
import { createPortal } from "react-dom";
import { ethers } from "ethers"; // ethers v6
import { useWalletAuth } from "./WalletAuthContext";
import { Connection, clusterApiUrl } from "@solana/web3.js";

export default function ConnectWallet() {
  const { loginWithWallet } = useWalletAuth();
  const [connecting, setConnecting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [availableWallets, setAvailableWallets] = useState([]);

  // 🔹 Виявлення доступних гаманців
  const detectWallets = () => {
    const wallets = [];

    // EVM
    if (window.ethereum) wallets.push({ type: "EVM", name: "MetaMask" });

    // Solana
    if (window.solana && window.solana.isPhantom) wallets.push({ type: "SOL", name: "Phantom" });

    setAvailableWallets(wallets);
    setShowModal(true);
  };

  // 🔹 Підключення обраного гаманця
  const connectSelectedWallet = async (wallet) => {
    try {
      setConnecting(true);
      let walletAddress = "";

      if (wallet.type === "EVM") {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        walletAddress = await signer.getAddress();
      } else if (wallet.type === "SOL") {
        const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
        try { await window.solana.disconnect(); } catch {}
        const res = await window.solana.connect({ onlyIfTrusted: false });
        walletAddress = res.publicKey.toString();
      }

      await loginWithWallet(walletAddress);
      setShowModal(false);
    } catch (err) {
      console.error("Failed to connect wallet:", err);
      alert("Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  };

  // 🔹 Кастомне модальне вікно як портал
  const modal = showModal ? createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-[#0a0a0a] border border-cyan-400 rounded-2xl p-6 w-96 flex flex-col items-center shadow-[0_0_60px_rgba(0,255,255,0.7)]">
        <h2 className="text-2xl font-bold text-[#00ffff] mb-4">Select Wallet</h2>
        {availableWallets.length === 0 && <p className="text-white">No wallets found</p>}
        {availableWallets.map((wallet, idx) => (
          <button
            key={idx}
            onClick={() => connectSelectedWallet(wallet)}
            className="w-full mb-3 px-4 py-3 bg-[#00ffff] text-black font-semibold rounded-lg hover:bg-cyan-500 transition"
          >
            {wallet.name}
          </button>
        ))}
        <button
          onClick={() => setShowModal(false)}
          className="mt-3 px-4 py-2 bg-gray-800 text-[#00ffff] border border-cyan-400 rounded-lg hover:bg-gray-700 transition"
        >
          Cancel
        </button>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        onClick={detectWallets}
        disabled={connecting}
        className="px-8 py-4 rounded-2xl bg-cyan-400 text-black font-semibold text-lg shadow-[0_0_40px_rgba(0,255,255,0.6)] hover:bg-cyan-300 transition disabled:opacity-50"
      >
        {connecting ? "Connecting..." : "Connect Wallet"}
      </button>
      {modal}
    </>
  );
}
