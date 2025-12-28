import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import CreateSection from "./components/CreateSection";
import EditSection from "./components/EditSection";
import ProductsSection from "./components/ProductsSection";
import PaymentPage from "./components/PaymentPage";

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
    <BrowserRouter>
      <main>
        <Routes>
          {/* 💳 Сторінка оплати (публічна) */}
          <Route path="/pay/:productId" element={<PaymentPage />} />

          {/* 🏠 Основна сторінка (dashboard) */}
          <Route
            path="/"
            element={
              <>
                <Header
                  user={user}
                  activeSection={activeSection}
                  setActiveSection={setActiveSection}
                />

                {!user && <div className="center"></div>}

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
              </>
            }
          />
        </Routes>
      </main>
    </BrowserRouter>
  );
}