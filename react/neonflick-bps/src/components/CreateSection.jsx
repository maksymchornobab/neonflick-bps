import { useState } from "react";
import { useWalletAuth } from "./WalletAuthContext";

export default function CreateSection() {
  const { token } = useWalletAuth();
  const [image, setImage] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("SOL");
  const [loading, setLoading] = useState(false);

  // 🔹 Обробка ціни в реальному часі
  const handlePriceChange = (e) => {
    let value = e.target.value;

    // Дозволяємо лише цифри та крапку, лише одну крапку
    value = value.replace(/[^0-9.]/g, "");
    const dotCount = (value.match(/\./g) || []).length;
    if (dotCount > 1) {
      value = value.slice(0, value.lastIndexOf(".")) + value.slice(value.lastIndexOf(".") + 1);
    }

    const parts = value.split(".");
    let integerPart = parts[0] || "";
    let decimalPart = parts[1] || "";

    // Обмежуємо цілу частину до 7 цифр
    if (integerPart.length > 7) integerPart = integerPart.slice(0, 7);

    // Обмежуємо дробову частину до 3 цифр
    if (decimalPart.length > 3) decimalPart = decimalPart.slice(0, 3);

    // Збираємо назад
    value = decimalPart ? `${integerPart}.${decimalPart}` : integerPart;

    // Дозволяємо залишати порожнє поле, або "0.", "0.0" для зручності
    if (value === "" || value === "." || value === "0." || value.startsWith("0.") || value === "0") {
      setPrice(value);
      return;
    }

    // Перевіряємо мін і макс
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      if (numValue < 0.001) value = "0.001";
      if (numValue > 1000000) value = "1000000";
    }

    setPrice(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!image || !title || !description || !price) {
      alert("All fields are required");
      return;
    }

    const formData = new FormData();
    formData.append("image", image);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("currency", currency);

    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:5000/create_product", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        alert(`Failed to create product: ${data.error || res.statusText}`);
        return;
      }

      alert("Product created!");
      setImage(null);
      setTitle("");
      setDescription("");
      setPrice("");
    } catch (err) {
      setLoading(false);
      console.error(err);
      alert("An error occurred while creating the product");
    }
  };

  return (
    <section id="create" className="section">
      <h2>Create product</h2>

      <form className="create-form" onSubmit={handleSubmit}>
        {/* Image */}
        <label className="file-input">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
            required
          />
          <span>{image ? image.name : "Upload image"}</span>
        </label>

        {/* Title */}
        <input
          type="text"
          placeholder="Title (max 50 chars)"
          maxLength={50}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* Description */}
        <textarea
          placeholder="Description (max 500 chars)"
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        {/* Price + Currency */}
        <div className="price-row">
          <input
            type="text"
            placeholder="Price"
            value={price}
            onChange={handlePriceChange}
            required
          />

          <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="SOL">SOL</option>
          </select>
        </div>

        <button disabled={loading}>
          {loading ? "Creating..." : "Create product"}
        </button>
      </form>
    </section>
  );
}
