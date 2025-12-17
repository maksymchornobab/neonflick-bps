import { useWalletAuth } from "./WalletAuthContext";

export default function ConnectWallet() {
  const { loginWithWallet } = useWalletAuth();

  const connectWallet = async () => {
    try {
      if (!window.solana || !window.solana.isPhantom) {
        alert("Phantom wallet not found");
        return;
      }

      // Підключення до гаманця
      const res = await window.solana.connect();
      const publicKey = res.publicKey.toString();
      console.log("Wallet publicKey:", publicKey);

      // Надсилаємо wallet на бекенд і отримуємо токен
      await loginWithWallet(publicKey);
      console.log("Logged in with wallet:", publicKey);
    } catch (err) {
      console.error("Failed to connect wallet:", err);
      alert("Failed to connect wallet");
    }
  };

  return (
    <button
      onClick={connectWallet}
      className="px-8 py-4 rounded-2xl bg-cyan-400 text-black font-semibold text-lg shadow-[0_0_40px_rgba(0,255,255,0.6)] hover:bg-cyan-300 transition"
    >
      Connect Wallet
    </button>
  );
}
