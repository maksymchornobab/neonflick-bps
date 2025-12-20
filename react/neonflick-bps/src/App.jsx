import { useState } from "react";
import Header from "./components/Header";
import CreateSection from "./components/CreateSection";
import EditSection from "./components/EditSection";
import ProductsSection from "./components/ProductsSection";
import { useWalletAuth } from "./components/WalletAuthContext";
import "./index.css";

export default function App() {
  const { user, loading } = useWalletAuth();

  const [activeSection, setActiveSection] = useState("products");
  const [editingProduct, setEditingProduct] = useState(null);

  if (loading) {
    return <main className="center">Loading...</main>;
  }

  return (
    <>
      <Header
        user={user}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />

      <main>
        {!user && (
          <div className="center">
          </div>
        )}

        {user && activeSection === "products" && (
          <ProductsSection
            onEdit={(product) => {
              setEditingProduct(product);
              setActiveSection("edit");
            }}
          />
        )}

        {user && activeSection === "create" && <CreateSection />}

        {user && activeSection === "edit" && editingProduct && (
          <EditSection
            product={editingProduct}
            onCancel={() => setActiveSection("products")}
          />
        )}
      </main>
    </>
  );
}
