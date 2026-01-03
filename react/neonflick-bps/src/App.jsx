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

import TermsConsentModal, { DeniedScreen } from "./components/TermsConsentModal";

import LegalNotice from "./legal/LegalNotice";
import PrivacyPolicy from "./legal/PrivacyPolicy";
import TermsAndConditions from "./legal/TermsAndConditions";
import WithdrawalInformation from "./legal/WithdrawalInformation";
import PlatformDisclaimer from "./legal/PlatformDisclaimer";
import CryptoRiskDisclosure from "./legal/CryptoRiskDisclosure";
import AbusePreventionStatement from "./legal/AbusePreventionStatement";
import PaymentInstruction from "./howto/PaymentInstruction";

import "./index.css";

export default function App() {
  const {
    user,
    token,
    loading,

    // 🔒 blocked wallet
    showBlockedModal,
    blockedWallet,
    logout,
    closeBlockedModal,

    // 📜 access consents
    showConsentModal,
    consentWallet,
    confirmAccessConsents,
    rejectAccessConsents,
  } = useWalletAuth();

  const [activeSection, setActiveSection] = useState("products");
  const [editingProduct, setEditingProduct] = useState(null);
  const [consentDenied, setConsentDenied] = useState(false);

  if (loading) {
    return <main className="center">Loading...</main>;
  }

  // 🧩 Dashboard Wrapper
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

      {/* ❌ Blocked Wallet Modal */}
      {showBlockedModal && (
        <div className="blocked-modal-backdrop" style={{ zIndex: 1000 }}>
          <div className="blocked-modal">
            <h2>Wallet Blocked</h2>
            <p className="p-block-message">
              The wallet <b>{blockedWallet}</b> has been blocked.
            </p>
            <p className="p-block">Please click on your currently connected wallet and connect a different wallet to continue.</p>
            <button
              type="button"
              onClick={() => {
                logout();
                closeBlockedModal();
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* 📜 Terms + Crypto Risk Consent */}
      {consentDenied ? (
        <DeniedScreen />
      ) : (
        showConsentModal && (
          <TermsConsentModal
            wallet={consentWallet}
            token={token}
            onAgree={confirmAccessConsents}
            onReject={() => setConsentDenied(true)}
          />
        )
      )}

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
        <Route
          path="/howto/payment-instruction"
          element={<PaymentInstruction />}
        />

        {/* 🏠 Dashboard */}
        <Route path="/*" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
