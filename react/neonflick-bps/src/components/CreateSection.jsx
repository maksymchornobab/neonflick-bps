import { useState, useEffect, useRef } from "react";
import { useWalletAuth } from "./WalletAuthContext";
import Notification from "./Notification";

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

  /* ---------------- INIT ---------------- */
  useEffect(() => {
    if (!token) return;
    fetchMeAndConsents();
  }, [token]);

  useEffect(() => {
    if (wallet) {
      fetchProducts();
    }
  }, [wallet]);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  useEffect(() => {
    if (currency === "SOL" && price) {
      calculateCommission(price);
    } else {
      setCommission(null);
      setFinalPrice(null);
    }
  }, [price, currency]);

  /* ---------------- API ---------------- */
  const fetchProducts = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/products", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error(err);
      setNotification("Failed to fetch products");
    }
  };

  const fetchMeAndConsents = async () => {
    try {
      setConsentsLoaded(false);
      const meRes = await fetch("http://127.0.0.1:5000/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!meRes.ok) return;
      const meData = await meRes.json();
      const userWallet = meData?.user?.wallet;
      if (!userWallet) return;
      setWallet(userWallet);

      const consentRes = await fetch("http://127.0.0.1:5000/auth/consent/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: userWallet }),
      });

      if (!consentRes.ok) return;
      const data = await consentRes.json();
      setAmlFromDB(Boolean(data.aml));
      setDisclaimerFromDB(Boolean(data.platform_disclaimer));
    } catch (err) {
      console.error(err);
    } finally {
      setConsentsLoaded(true);
    }
  };

  const calculateCommission = async (priceValue) => {
    try {
      const res = await fetch(
        `http://127.0.0.1:5000/calculate_commission_sol?price=${priceValue}`
      );
      const data = await res.json();
      if (res.ok) {
        setCommission(data.commission);
        setFinalPrice(data.final_price);
      } else {
        setCommission(null);
        setFinalPrice(null);
      }
    } catch (err) {
      console.error(err);
      setCommission(null);
      setFinalPrice(null);
    }
  };

  const submitConsent = async (consentName) => {
    await fetch("http://127.0.0.1:5000/auth/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet, consent: consentName }),
    });
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
      setNotification("Wallet not connected");
      return;
    }

    if (maxProductsReached) {
      setNotification("Operation canceled: Maximum of 10 products reached.");
      return;
    }

    const needsConsent = !amlFromDB || !disclaimerFromDB;
    if (needsConsent && !consentChecked) {
      setNotification("You must accept legal terms");
      return;
    }

    const numPrice = parseFloat(price);
    if (!image || !title.trim() || !description.trim() || isNaN(numPrice) || !currency || !duration) {
      setNotification("Please fill all required fields");
      return;
    }

    if (!amlFromDB) await submitConsent("aml");
    if (!disclaimerFromDB) await submitConsent("platform_disclaimer");

    const formData = new FormData();
    formData.append("image", image);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("price", numPrice.toFixed(3));
    formData.append("currency", currency);
    formData.append("duration", duration);

    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/create_product", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setNotification(data.error || "Error creating product");
        return;
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

      fetchProducts();
      fetchMeAndConsents();
    } catch (err) {
      console.error(err);
      setLoading(false);
      setNotification("Network or server error");
    }
  };

  const needsConsent = consentsLoaded && (!amlFromDB || !disclaimerFromDB);

  /* ---------------- RENDER ---------------- */
  return (
    <section id="create" className="section">
      {notification && (
        <Notification message={notification} onClose={() => setNotification("")} />
      )}

      <form className="create-form" onSubmit={handleSubmit} encType="multipart/form-data">
      <p style={{ color: "red", fontSize: "20px", fontWeight: "bold", marginTop: "10px", marginBottom: "8px", textAlign: "center" }}>
        Warning: All entered data will be lost if you leave this page!
      </p>
        <h2>Create product ({products?.length || 0}/10)</h2>

        {maxProductsReached && (
          <p style={{ color: "red", fontWeight: "bold" }}>
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
        </label>

        <div className="input-wrapper">
          <span className="char-counter">{title.length}/50</span>
          <input
            placeholder="Title (max 50 symbols)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={50}
            disabled={maxProductsReached}
            required
          />
        </div>

        <div className="input-wrapper">
          <span className="char-counter1">{description.length}/1000</span>
          <textarea
            placeholder="Description (max 1000 symbols)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
            disabled={maxProductsReached}
            required
          />
        </div>

        <div className="input-wrapper">
          <select
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

        {/* 🔹 Price */}
        <div className="price-row">
          <input
            value={price}
            onChange={handlePriceChange}
            disabled={maxProductsReached}
            required
            placeholder="Price (0.001 - 1,000,000)"
          />
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            disabled={maxProductsReached}
            required
          >
            <option value="">Select currency</option>
            <option value="SOL">SOL</option>
          </select>
        </div>

        {/* 🔹 Commission */}
        {currency === "SOL" && commission !== null && (
          <p
            style={{ color: "#00ffff", fontWeight: "bold", cursor: "pointer" }}
            onClick={() => setShowCommissionTable(!showCommissionTable)}
          >
            <strong className="commission-word">Commission:</strong> {commission} SOL (click to view table)
          </p>
        )}

        {/* 🔹 Commission Table */}
        {showCommissionTable && currency === "SOL" && (
          <table className="commission-table" style={{ marginBottom: "10px" }}>
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

        {/* 🔹 Final price */}
        {currency === "SOL" && finalPrice !== null && (
          <p style={{ color: "#00ff88", fontWeight: "bold" }}>
            You will receive: {finalPrice} SOL
          </p>
        )}

        {needsConsent && (
  <label
    className="consent-box"
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      cursor: "pointer",
      fontSize: "16px", // можна підкоригувати
      color: "#00ffff"

    }}
  >
    <input
      type="checkbox"
      checked={consentChecked}
      onChange={(e) => setConsentChecked(e.target.checked)}
      style={{
        width: "18px",   // більший квадратик
        height: "18px",
        flexShrink: 0,   // не стискається
        cursor: "pointer",
      }}
    />
    I accept{" "}
    <a href="/legal/aml" target="_blank" style={{ color: "#00ffff", textDecoration: "underline", margin: "0 2px", fontWeight: "bold" }}>
      AML Policy
    </a>{" "}
    and{" "}
    <a href="/legal/disclaimer" target="_blank" style={{color: "#00ffff", textDecoration: "underline", margin: "0 2px", fontWeight: "bold" }}>
      Platform Disclaimer
    </a>
  </label>
)}



        <button disabled={loading || maxProductsReached}>
          {loading ? "Creating..." : "Create product"}
        </button>
      </form>

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
    </section>
  );
}
