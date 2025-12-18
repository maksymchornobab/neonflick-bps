import { useState } from "react";
import Header from "./components/Header";
import CreateSection from "./components/CreateSection";
import ProductsSection from "./components/ProductsSection";
import ConnectWallet from "./components/ConnectWallet";
import { useWalletAuth } from "./components/WalletAuthContext";
import "./index.css";

export default function App() {
  const { user, loading } = useWalletAuth();

  // 👇 яка секція активна
  const [activeSection, setActiveSection] = useState("products");

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black">
        Loading...
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black">
        <ConnectWallet />
      </main>
    );
  }

  return (
    <>
      <Header
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />

      <main>
        {activeSection === "products" && <ProductsSection />}
        {activeSection === "create" && <CreateSection />}
      </main>
    </>
  );
}
