import Header from "./components/Header";
import CreateSection from "./components/CreateSection";
import ProductsSection from "./components/ProductsSection";
import ConnectWallet from "./components/ConnectWallet";
import { useWalletAuth } from "./components/WalletAuthContext";
import "./index.css";

export default function App() {
  const { user, loading } = useWalletAuth();

  // 🔁 Поки триває відновлення сесії
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black">
        Loading...
      </main>
    );
  }

  // Wallet NOT connected → show only connect button
  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black">
        <ConnectWallet />
      </main>
    );
  }

  // Wallet connected → full app
  return (
    <>
      <Header />
      <main>
        <CreateSection />
        <ProductsSection />
      </main>
    </>
  );
}
