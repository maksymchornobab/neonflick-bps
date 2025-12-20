import { useState, useEffect, useRef } from "react";
import { useWalletAuth } from "./WalletAuthContext";

export default function EditSection({ product, onCancel }) {
  const { token } = useWalletAuth();
  const fileInputRef = useRef(null);

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(product.image);

  const [title, setTitle] = useState(product.title);
  const [description, setDescription] = useState(product.description);
  const [price, setPrice] = useState(String(product.price));
  const [currency, setCurrency] = useState(product.currency);
  const [loading, setLoading] = useState(false);

  // 🔹 cleanup blob URL
  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleReplaceImage = () => {
    fileInputRef.current?.click();
  };

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

    const numPrice = parseFloat(price);
    if (!title || !description || isNaN(numPrice)) {
      alert("Invalid data");
      return;
    }

    const formData = new FormData();
    formData.append("id", product.id);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("price", numPrice.toFixed(3));
    formData.append("currency", currency);

    if (image) {
      formData.append("image", image);
      formData.append("old_image", product.image);
    }

    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:5000/update_product", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        alert(data.error || "Update failed");
        return;
      }

      alert("Product updated");
      onCancel();
    } catch (err) {
      setLoading(false);
      alert("Error updating product");
    }
  };

  return (
    <section id="edit" className="section">

      <form className="create-form" onSubmit={handleSubmit}>
        <h2>Edit product</h2>
        {imagePreview && (
      <div className="image-preview-wrapper">
        <div className="image-preview-frame">
          <img src={imagePreview} alt="Preview" />
        </div>
      </div>
    )}

    {/* FILE INPUT */}
    <label className="file-input">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        required={!image}
      />
      <span className="file-name">
        {image ? image.name : "Upload image"}
      </span>
    </label>

    <input
      placeholder="Title (max 50 symbols)"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      maxLength={50}
      required
    />

    <textarea
      placeholder="Description (max 500 symbols)"
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      maxLength={500}
      required
    />

    <div className="price-row">
      <input 
      value={price} 
      onChange={handlePriceChange} 
      required
      placeholder="Price (0.001 - 1,000,000)" 
      />
      <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
        <option value="SOL">SOL</option>
      </select>
    </div>

        <div className="actions">
          <button disabled={loading}>
            {loading ? "Saving..." : "Save changes"}
          </button>
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
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
    </section>
  );
}
