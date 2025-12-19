import { useState } from "react";
import Header from "./components/Header";
import CreateSection from "./components/CreateSection";
import EditSection from "./components/EditSection";
import ProductsSection from "./components/ProductsSection";
import ConnectWallet from "./components/ConnectWallet";
import { useWalletAuth } from "./components/WalletAuthContext";
import "./index.css";

export default function App() {
  const { user, loading } = useWalletAuth();

  const [activeSection, setActiveSection] = useState("products");
  const [editingProduct, setEditingProduct] = useState(null);

  if (loading) {
    return <main className="center">Loading...</main>;
  }

  if (!user) {
    return <main className="center"><ConnectWallet /></main>;
  }

  return (
    <>
      <Header
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />

      <main>
        {activeSection === "products" && (
          <ProductsSection
            onEdit={(product) => {
              setEditingProduct(product);
              setActiveSection("edit");
            }}
          />
        )}

        {activeSection === "create" && <CreateSection />}

        {activeSection === "edit" && editingProduct && (
          <EditSection
            product={editingProduct}
            onCancel={() => setActiveSection("products")}
          />
        )}
      </main>
    </>
  );
}
