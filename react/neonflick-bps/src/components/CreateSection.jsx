import { useState } from "react";
import { useWalletAuth } from "./WalletAuthContext";

export default function CreateSection() {
  const { token } = useWalletAuth(); // 🔹 user прибрано
  const [image, setImage] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("SOL");
  const [loading, setLoading] = useState(false);

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
    Authorization: `Bearer ${token}`, // 🔑 важливо
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
            type="number"
            step="0.001"
            min="0.001"
            max="1000000"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
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
