import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";
import CreateSection from "./components/CreateSection";
import EditSection from "./components/EditSection";
import ProductsSection from "./components/ProductsSection";
import PaymentPage from "./components/PaymentPage";
import CookieConsentBanner from "./components/CookieConsentBanner";

import { useWalletAuth } from "./components/WalletAuthContext";
import LegalNotice from "./legal/LegalNotice"; 
import PrivacyPolicy from "./legal/PrivacyPolicy";
import TermsAndConditions from "./legal/TermsAndConditions"
import WithdrawalInformation from "./legal/WithdrawalInformation"
import PlatformDisclaimer from "./legal/PlatformDisclaimer"
import CryptoRiskDisclosure from "./legal/CryptoRiskDisclosure"
import AbusePreventionStatement from "./legal/AbusePreventionStatement"
import "./index.css";

export default function App() {
  const { user, loading } = useWalletAuth();
  const [activeSection, setActiveSection] = useState("products");
  const [editingProduct, setEditingProduct] = useState(null);

  if (loading) {
    return <main className="center">Loading...</main>;
  }

  // Dashboard Wrapper Component
  const Dashboard = () => (
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

      <Footer />
    </>
  );

  return (
    <BrowserRouter>
    <CookieConsentBanner />
      <Routes>
        {/* 💳 Public routes */}
        <Route path="/pay/:productId" element={<PaymentPage />} />
        <Route path="/legal/legal_notice" element={<LegalNotice />} />
        <Route path="/legal/privacy" element={<PrivacyPolicy />} />
        <Route path="/legal/terms" element={<TermsAndConditions />} />
        <Route path="/legal/withdrawal" element={<WithdrawalInformation />} />
        <Route path="/legal/disclaimer" element={<PlatformDisclaimer />} />
        <Route path="/legal/crypto-risks" element={<CryptoRiskDisclosure />} />
        <Route path="/legal/aml" element={<AbusePreventionStatement />} />

        {/* 🏠 Dashboard route */}
        <Route path="/*" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
