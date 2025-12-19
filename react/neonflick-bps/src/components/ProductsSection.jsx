import { useEffect, useState } from "react";

export default function ProductsSection({ onEdit }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null); // Для відкриття меню конкретного продукту

  useEffect(() => {
    fetch("http://127.0.0.1:5000/products")
      .then(res => res.json())
      .then(data => setProducts(data.products || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="products-loading">Loading products...</p>;
  if (products.length === 0) return <p className="products-empty">No products yet</p>;

  const toggleMenu = (id) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleEdit = (product) => {
  onEdit(product);
};

  const handleDelete = async (product) => {

  try {
    const s3Key = product.image.split("/").slice(-2).join("/"); // правильний ключ
    const res = await fetch("http://127.0.0.1:5000/delete-product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: product.id, s3_key: s3Key }),
    });

    const data = await res.json();
    if (data.success) {
      setProducts(products.filter(p => p.id !== product.id));
      alert(`${product.title} deleted successfully`);
    } else {
      alert("Error: " + (data.error || "Unknown error"));
    }
  } catch (err) {
    console.error(err);
    alert("Failed to delete product: " + err.message);
  }
};

  const handleShare = (product) => alert(`Share ${product.title}`);

  return (
    <section id="products" className="section">
      <h2 className="products-title">PRODUCTS</h2>

      <div className="products-grid">
        {products.map(product => (
          <div className="product-card" key={product.id}>
            <div className="product-image-wrapper">
              <img src={product.image} alt={product.title} className="product-image" />
            </div>

            <div className="product-content">
              <h3 className="product-name">{product.title}</h3>
              <p className="product-description">{product.description}</p>

              <div className="product-footer">
                <span className="product-price">{product.price} {product.currency}</span>
              </div>

              <button className="product-button">View</button>
            </div>

            {/* Три крапки */}
            <div className="three-dots-container">
              <button className="three-dots" onClick={() => toggleMenu(product.id)}>
                &#8942;
              </button>

              {openMenuId === product.id && (
                <div className="dots-menu">
                  <button onClick={() => handleEdit(product)}>Edit</button>
                  <button onClick={() => handleDelete(product)}>Delete</button>
                  <button onClick={() => handleShare(product)}>Share</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
