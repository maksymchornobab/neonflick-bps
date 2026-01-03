import { useState, useEffect, useRef } from "react";
import { useWalletAuth } from "./WalletAuthContext";
import Notification from "./Notification";

export default function EditSection({ product, onCancel }) {
  const { token } = useWalletAuth();
  const fileInputRef = useRef(null);

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(product.image);

  const [title, setTitle] = useState(product.title);
  const [description, setDescription] = useState(product.description);
  const [price, setPrice] = useState(String(product.price));
  const [currency, setCurrency] = useState(product.currency);
  const [showCommissionTable, setShowCommissionTable] = useState(false);

  const [commission, setCommission] = useState(null);
  const [finalPrice, setFinalPrice] = useState(null); // ✅
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState("");
  const BACKEND = process.env.REACT_APP_BACKEND;

  // 🔹 cleanup blob URL
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

const calculateCommission = async (priceValue) => {
  try {
    if (!priceValue) {
      setCommission(null);
      setFinalPrice(null);
      return;
    }

    const res = await fetch(
      `${BACKEND}/calculate_commission_sol?price=${priceValue}`
    );

    if (!res.ok) {
      throw new Error("Failed to calculate commission. Please check the price.");
    }

    const data = await res.json();
    setCommission(data.commission);
    setFinalPrice(data.final_price); // ✅ only set values, no success notification
  } catch (err) {
    console.error(err);
    setCommission(null);
    setFinalPrice(null);
    setNotification(err.message || "Unable to calculate commission.");
  }
};

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

  // ---------- VALIDATION ----------
  const numPrice = parseFloat(price);

  if (!title.trim() || !description.trim() || isNaN(numPrice) || !currency) {
    setNotification("Please fill all required fields correctly.");
    return;
  }

  if (!product?.id) {
    setNotification("Product data not loaded. Please refresh the page.");
    return;
  }

  // ---------- BUILD FORM DATA ----------
  const formData = new FormData();
  formData.append("id", product.id);
  formData.append("title", title.trim());
  formData.append("description", description.trim());
  formData.append("price", numPrice.toFixed(3));
  formData.append("currency", currency);

  if (image) {
    formData.append("image", image);
    formData.append("old_image", product.image || "");
  }

  setLoading(true);

  // ---------- SEND REQUEST ----------
  try {
    const res = await fetch(`${BACKEND}/update_product`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Product update failed.");
    }

    // ---------- SUCCESS ----------
    setNotification("Product updated successfully!");
    onCancel(); // close modal / reset form

  } catch (err) {
    console.error(err);

    // ---------- ERROR HANDLING ----------
    if (err.name === "TypeError") {
      setNotification("Network error. Please check your connection and try again.");
    } else {
      setNotification(err.message || "Error updating product. Please try again.");
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <section id="edit" className="section">
  {notification && (
    <Notification message={notification} onClose={() => setNotification("")} />
  )}

  <form className="create-form" onSubmit={handleSubmit} encType="multipart/form-data">
    <p className="edit-warning-text">
      Warning: All entered data will be lost if you leave this page!
    </p>

    <h2>Edit product</h2>

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
      />
      <span className="file-name">{image ? image.name : "Upload image"}</span>
      {imagePreview && (
    <>
      <button
        type="button"
        className="img-btn remove"
        onClick={handleRemoveImage}
        title="Remove image"
      />
      <button
        type="button"
        className="img-btn replace"
        onClick={handleReplaceImage}
        title="Replace image"
      />
    </>
  )}
    </label>

    <div className="input-wrapper">
      <span className="char-counter">{title.length}/50</span>
      <input
        className="edit-title-input"
        placeholder="Title (max 50 symbols)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={50}
        required
      />
    </div>

    <div className="input-wrapper">
      <span className="char-counter1">{description.length}/1000</span>
      <textarea
        className="edit-descr-textarea"
        placeholder="Description (max 1000 symbols)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={1000}
        required
      />
    </div>

    <div className="price-row">
      <input
        className="edit-price-input"
        value={price}
        onChange={handlePriceChange}
        required
        placeholder="Price (0.001 - 1,000,000)"
      />
      <select
        className="edit-currency-select"
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        required
      >
        <option value="">Select currency</option>
        <option value="SOL">SOL</option>
      </select>
    </div>

    {/* 🔹 Commission */}
    {currency === "SOL" && commission !== null && (
      <p
        className="edit-commission-text"
        onClick={() => setShowCommissionTable(!showCommissionTable)}
      >
        <strong className="commission-word">Commission:</strong>{" "}
        {commission} SOL (click to view table)
      </p>
    )}

    {/* 🔹 Commission Table */}
    {showCommissionTable && currency === "SOL" && (
      <table className="commission-table edit-commission-table">
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
      <p className="edit-final-price-text">
        You will receive: {finalPrice} SOL
      </p>
    )}

    <div className="actions">
      <button disabled={loading}>
        {loading ? "Saving..." : "Save changes"}
      </button>
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </div>
  </form>
</section>

  );
}
