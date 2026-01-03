import { useState, useEffect, useRef } from "react";
import { useWalletAuth } from "./WalletAuthContext";
import Notification from "./Notification";
import TermsConsentModal from "./TermsConsentModal";

export default function CreateSection() {
  const { token } = useWalletAuth();
  const fileInputRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("");

  const [commission, setCommission] = useState(null);
  const [finalPrice, setFinalPrice] = useState(null);

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState("");
  const maxProductsReached = products?.length >= 10;

  const [amlFromDB, setAmlFromDB] = useState(false);
  const [disclaimerFromDB, setDisclaimerFromDB] = useState(false);
  const [consentsLoaded, setConsentsLoaded] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  const [wallet, setWallet] = useState(null);
  const [showCommissionTable, setShowCommissionTable] = useState(false);

  const [termsConsent, setTermsConsent] = useState(false);
  const [riskConsent, setRiskConsent] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(null);

  /* ---------------- INIT ---------------- */
  useEffect(() => {
    if (!token) return;
    fetchMeAndConsents();
  }, [token]);

  useEffect(() => {
    if (wallet) fetchProducts();
  }, [wallet]);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  useEffect(() => {
    if (currency === "SOL" && price) calculateCommission(price);
    else {
      setCommission(null);
      setFinalPrice(null);
    }
  }, [price, currency]);

  /* ---------------- API ---------------- */
  const fetchProducts = async () => {
  try {
    const res = await fetch("https://neonflick-bps-production.up.railway.app/products", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.ok) {
      throw new Error("Failed to load products.");
    }

    const data = await res.json();
    setProducts(data.products || []);
  } catch (err) {
    console.error(err);
    setNotification("Unable to load products. Please refresh the page.");
  }
};

const fetchMeAndConsents = async () => {
  try {
    setConsentsLoaded(false);

    const meRes = await fetch("https://neonflick-bps-production.up.railway.app/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!meRes.ok) {
      setNotification("Authentication failed. Please reconnect your wallet.");
      return;
    }

    const meData = await meRes.json();
    const userWallet = meData?.user?.wallet;

    if (!userWallet) {
      setNotification("Wallet not found. Please reconnect.");
      return;
    }

    setWallet(userWallet);

    const consentRes = await fetch("https://neonflick-bps-production.up.railway.app/auth/consent/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet: userWallet }),
    });

    if (!consentRes.ok) {
      setNotification("Failed to load consent status.");
      return;
    }

    const data = await consentRes.json();
    setAmlFromDB(Boolean(data.aml));
    setDisclaimerFromDB(Boolean(data.platform_disclaimer));
    setTermsConsent(Boolean(data.terms));
    setRiskConsent(Boolean(data.crypto_risk_disclosure));
  } catch (err) {
    console.error(err);
    setNotification("Unable to load user information.");
  } finally {
    setConsentsLoaded(true);
  }
};

const calculateCommission = async (priceValue) => {
  try {
    if (!priceValue) {
      setCommission(null);
      setFinalPrice(null);
      return;
    }

    const res = await fetch(`https://neonflick-bps-production.up.railway.app/calculate_commission_sol?price=${priceValue}`);
    if (!res.ok) {
      throw new Error("Failed to calculate commission.");
    }

    const data = await res.json();
    setCommission(data.commission);
    setFinalPrice(data.final_price);
  } catch (err) {
    console.error(err);
    setCommission(null);
    setFinalPrice(null);
    setNotification("Unable to calculate commission. Please check the price.");
  }
};

const submitConsent = async (consentName) => {
  try {
    const res = await fetch("https://neonflick-bps-production.up.railway.app/auth/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet, consent: consentName }),
    });

    if (!res.ok) {
      throw new Error("Consent submission failed.");
    }
  } catch (err) {
    console.error(err);
    setNotification("Failed to save consent. Please try again.");
    throw err;
  }
};

/* ---------------- HANDLERS ---------------- */
const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  setImage(file);
  setImagePreview(URL.createObjectURL(file));
};

const handleRemoveImage = () => {
  setImage(null);
  setImagePreview(null);
  if (fileInputRef.current) fileInputRef.current.value = "";
};

const handleReplaceImage = () => fileInputRef.current?.click();

const handlePriceChange = (e) => {
  let value = e.target.value;
  if (!/^[0-9.]*$/.test(value)) return;
  if ((value.match(/\./g) || []).length > 1) return;
  const [int = "", dec = ""] = value.split(".");
  if (int.length > 7 || dec.length > 3) return;
  setPrice(value);
};

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!token || !wallet) {
    setNotification("Wallet not connected. Please reconnect.");
    return;
  }

  if (needsConsent && !consentChecked) {
    setNotification("You must accept AML Policy and Platform Disclaimer.");
    return;
  }

  if (maxProductsReached) {
    setNotification("Operation canceled: Maximum of 10 products reached.");
    return;
  }

  if (!termsConsent || !riskConsent) {
    setPendingSubmit({ image, title, description, price, currency, duration });
    setShowConsentModal(true);
    return;
  }

  const numPrice = parseFloat(price);
  if (!image || !title.trim() || !description.trim() || isNaN(numPrice) || !currency || !duration) {
    setNotification("Please fill all required fields correctly.");
    return;
  }

  try {
    setLoading(true);

    if (!amlFromDB) await submitConsent("aml");
    if (!disclaimerFromDB) await submitConsent("platform_disclaimer");

    const formData = new FormData();
    formData.append("image", image);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("price", numPrice.toFixed(3));
    formData.append("currency", currency);
    formData.append("duration", duration);

    const res = await fetch("https://neonflick-bps-production.up.railway.app/create_product", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Error creating product.");
    }


    setNotification("Product created successfully!");
    handleRemoveImage();
    setTitle("");
    setDescription("");
    setPrice("");
    setCurrency("");
    setDuration("");
    setCommission(null);
    setFinalPrice(null);
    setConsentChecked(false);
    setPendingSubmit(null);

    fetchProducts();
    fetchMeAndConsents();
  } catch (err) {
    console.error(err);
    setNotification(err.message || "Network or server error. Please try again.");
  } finally {
    setLoading(false);
  }
};


const handleConsentAgree = async () => {
  try {
    await submitConsent("terms");
    await submitConsent("crypto_risk_disclosure");
    setTermsConsent(true);
    setRiskConsent(true);
    setShowConsentModal(false);

    if (pendingSubmit) {
      handleSubmit({ preventDefault: () => {} });
    }
  } catch (err) {
    console.error(err);
    setNotification("Failed to save consents.");
  }
};

const handleConsentReject = () => {
  setShowConsentModal(false);
  setNotification("Cannot create product without accepting Terms & Crypto Risk Disclosure.");
};

const needsConsent = consentsLoaded && (!amlFromDB || !disclaimerFromDB);


  /* ---------------- RENDER ---------------- */
  return (
    <section id="create" className="section">
  {notification && (
    <Notification message={notification} onClose={() => setNotification("")} />
  )}

  {showConsentModal && (
    <TermsConsentModal
      wallet={wallet}
      token={token}
      onAgree={handleConsentAgree}
      onReject={handleConsentReject}
    />
  )}

  <form className="create-form" onSubmit={handleSubmit} encType="multipart/form-data">
    <p className="warning-text">
      Warning: All entered data will be lost if you leave this page!
    </p>
    <h2>Create product ({products?.length || 0}/10)</h2>

    {maxProductsReached && (
      <p className="max-products-text">
        You have reached the maximum number of products (10).
      </p>
    )}

    {imagePreview && (
      <div className="image-preview-wrapper">
        <div className="image-preview-frame">
          <img src={imagePreview} alt="Preview" />
        </div>
      </div>
    )}

    <label className="file-input">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        disabled={maxProductsReached}
        required
      />
      <span className="file-name">{image ? image.name : "Upload image"}</span>
      {imagePreview && (
    <>
      <button
        type="button"
        className="img-btn remove"
        onClick={handleRemoveImage}
        title="Remove image"
        disabled={maxProductsReached}
      />
      <button
        type="button"
        className="img-btn replace"
        onClick={handleReplaceImage}
        title="Replace image"
        disabled={maxProductsReached}
      />
    </>
  )}
    </label>

    <div className="input-wrapper input-title">
      <span className="char-counter">{title.length}/50</span>
      <input
        className="create-title-input"
        placeholder="Title (max 50 symbols)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={50}
        disabled={maxProductsReached}
        required
      />
    </div>

    <div className="input-wrapper input-description">
      <span className="char-counter1">{description.length}/1000</span>
      <textarea
        className="create-descr-textarea"
        placeholder="Description (max 1000 symbols)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={1000}
        disabled={maxProductsReached}
        required
      />
    </div>

    <div className="input-wrapper input-duration">
      <select
        className="create-duration-select"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        disabled={maxProductsReached}
        required
      >
        <option value="">Select a product duration</option>
        <option value="3h">3 hours</option>
        <option value="6h">6 hours</option>
        <option value="12h">12 hours</option>
        <option value="1d">1 day</option>
        <option value="3d">3 days</option>
      </select>
    </div>

    <div className="price-row">
      <input
        className="create-price-input"
        value={price}
        onChange={handlePriceChange}
        disabled={maxProductsReached}
        required
        placeholder="Price (0.001 - 1,000,000)"
      />
      <select
        className="create-currency-select"
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        disabled={maxProductsReached}
        required
      >
        <option value="">Select currency</option>
        <option value="SOL">SOL</option>
      </select>
    </div>

    {currency === "SOL" && commission !== null && (
      <p className="commission-text" onClick={() => setShowCommissionTable(!showCommissionTable)}>
        <strong className="commission-word">Commission:</strong> {commission} SOL (click to view table)
      </p>
    )}

    {showCommissionTable && currency === "SOL" && (
      <table className="commission-table">
        <thead>
          <tr>
            <th>Price Range (SOL)</th>
            <th>Commission</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>0.001 – 0.01</td><td>10%</td></tr>
          <tr><td>0.01 – 0.1</td><td>5%</td></tr>
          <tr><td>0.1 – 1</td><td>1%</td></tr>
          <tr><td>1 – 100</td><td>0.25%</td></tr>
          <tr><td>100 - 1 000 000</td><td>0.25 SOL fixed</td></tr>
        </tbody>
      </table>
    )}

    {currency === "SOL" && finalPrice !== null && (
      <p className="final-price-text">
        You will receive: {finalPrice} SOL
      </p>
    )}

    {needsConsent && (
      <label className="consent-box">
        <input
          type="checkbox"
          checked={consentChecked}
          onChange={(e) => setConsentChecked(e.target.checked)}
          className="consent-checkbox"
        />
        I accept{" "}
        <a href="/legal/aml" target="_blank" className="consent-link">
          AML Policy
        </a>{" "}
        and{" "}
        <a href="/legal/disclaimer" target="_blank" className="consent-link">
          Platform Disclaimer
        </a>
      </label>
    )}

    <strong className="attention-text">Attention!</strong>
    <p className="wallet-warning">
      Make sure that you have at least <strong className="wallet-amount">0.001 SOL</strong> on your wallet.
      <a href="/howto/payment-instruction" className="wallet-readmore">Read More</a>
    </p>

    <button
  className="create-submit-btn1"
  disabled={
    loading ||
    maxProductsReached ||
    (needsConsent && !consentChecked)
  }
>
  {loading ? "Creating..." : "Create product"}
</button>

  </form>
</section>
  );
}
