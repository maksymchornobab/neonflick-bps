import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";

export default function PrivacyPolicy() {
    const navigate = useNavigate();

   const handleSectionChange = (section) => {
    navigate("/"); // переход на дашборд
    localStorage.setItem("initialSection", section); // можна зберегти, щоб дашборд відкрив потрібну секцію
  };
  return (
    <>

    <Header
            activeSection="products" // передамо будь-яку секцію як дефолт
            setActiveSection={handleSectionChange} // кнопки тепер працюють
          />

    <main className="legal-page">
      <h1>Privacy Policy</h1>

      {/* Blockchain Disclosure */}
      <section className="legal-section">
        <h2>Blockchain Transactions</h2>
        <p>
          All payments on this platform occur via the Solana blockchain and are irreversible. 
          The platform does not hold funds and operates as a non-custodial technical marketplace.
        </p>
        <p>
          Transaction hashes (tx_hash) are recorded for verification purposes. 
          Buyer wallet addresses are used temporarily to generate electronic receipts and are not stored in our database.
        </p>
      </section>

      {/* LocalStorage */}
      <section className="legal-section">
        <h2>LocalStorage Usage</h2>
        <p>
          We use localStorage to manage user sessions and store session-related data. 
          Consent for localStorage usage is recorded and can be withdrawn at any time.
        </p>
      </section>

      {/* Data Collected */}
      <section className="legal-section">
        <h2>Data Collected</h2>
        <p>We collect the following types of data:</p>
        <ul>
          <li><strong>User information:</strong> wallet address, creation date, last login</li>
          <li><strong>Product information:</strong> title, description, price, commission, final price, currency, status, transaction stats, image, cloud storage path, creation and expiration dates</li>
          <li><strong>Transaction information:</strong> transaction hash (tx_hash); buyer wallet used temporarily for receipt generation (not stored)</li>
        </ul>
      </section>

      {/* Data Processors */}
      <section className="legal-section">
        <h2>Data Processors</h2>
        <p>
          Your data is stored using the following external processors operating under GDPR compliance:
        </p>
        <ul>
          <li>MongoDB — database storage (EU data residency)</li>
          <li>AWS S3 — cloud storage for product images (EU data residency)</li>
        </ul>
      </section>

      {/* User Rights */}
      <section className="legal-section">
        <h2>User Rights</h2>
        <p>
          Users have the right to access, correct, and request deletion of their personal data. 
          You may also withdraw your consent at any time.
        </p>
        <p>
          To exercise your rights, please contact us at: <a href="mailto:neonflickplatform@gmail.com">neonflickplatform@gmail.com</a>
        </p>
      </section>

      {/* Retention Policy */}
      <section className="legal-section">
        <h2>Data Retention</h2>
        <p>
         Product data is stored until the product's expiration date is reached, after which it is automatically deleted from the platform.
        </p>
        <p>
         Wallet addresses used to create user accounts are stored until the user decides to delete them. 
         Users can delete their wallet data either through the wallet management menu on the platform or by sending a request to <a href="mailto:neonflickplatform@gmail.com">neonflickplatform@gmail.com</a>.
        </p>
        <p>
         Other data is stored only as long as necessary to provide the platform services and to fulfill legal obligations.
        </p>

      </section>

      {/* Global Scope */}
      <section className="legal-section">
        <h2>Scope</h2>
        <p>
          This Privacy Policy applies to all users worldwide. For EU users, GDPR rights are fully enforced.
        </p>
      </section>
    </main>

    <Footer />
    </>
  );
}
