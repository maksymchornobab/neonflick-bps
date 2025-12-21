import { useState, useEffect, useRef } from "react";
import { useWalletAuth } from "./WalletAuthContext";
import Notification from "./Notification"; // імпорт універсального сповіщення

export default function CreateSection() {
  const [products, setProducts] = useState([]);
  const { token } = useWalletAuth();
  const fileInputRef = useRef(null);

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("");
  const [loading, setLoading] = useState(false);

  const [notification, setNotification] = useState(""); // стан для сповіщення

  useEffect(() => {
    fetchProducts();

    return () => {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/products");
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error(err);
      setNotification("Failed to fetch products");
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

  // 🔹 Перевірка максимальних продуктів
  if (maxProductsReached) {
    setNotification("Operation canceled: Maximum of 10 products reached.");
    return; // далі сабміт не виконується
  }

  const numPrice = parseFloat(price);
  if (!image || !title.trim() || !description.trim() || isNaN(numPrice) || !currency) {
    setNotification("Please fill all required fields");
    return;
  }

  const formData = new FormData();
  formData.append("image", image);
  formData.append("title", title);
  formData.append("description", description);
  formData.append("price", numPrice.toFixed(3));
  formData.append("currency", currency);

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

    fetchProducts(); // оновлюємо лічильник
  } catch (err) {
    console.error(err);
    setLoading(false);
    setNotification("Network or server error");
  }
};


  const maxProductsReached = products.length >= 10;

  return (
    <section id="create" className="section">
      {notification && (
        <Notification message={notification} onClose={() => setNotification("")} />
      )}

      <form className="create-form" onSubmit={handleSubmit} encType="multipart/form-data">
        <h2>Create product ({products.length}/10)</h2>

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
