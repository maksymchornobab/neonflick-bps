import { useEffect, useState } from "react";
import Notification from "./Notification";

export default function ProductsSection({ onEdit }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [notification, setNotification] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [chooseMode, setChooseMode] = useState(false);

  // 🔹 Таймери стану
  const [timers, setTimers] = useState({});

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const newTimers = {};
      products.forEach((p) => {
        if (p.expires_at) {
          const remaining = new Date(p.expires_at).getTime() - now;
          newTimers[p.id] = remaining > 0 ? remaining : 0;
        }
      });
      setTimers(newTimers);
    }, 1000);

    return () => clearInterval(interval);
  }, [products]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/products");
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error(err);
      setNotification("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const toggleMenu = (id) => setOpenMenuId(openMenuId === id ? null : id);

  const handleEdit = (product) => onEdit(product);

  const handleDelete = async (productIds) => {
    if (!Array.isArray(productIds)) productIds = [productIds];

    try {
      const res = await fetch("http://127.0.0.1:5000/delete-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: productIds }),
      });

      const data = await res.json();
      if (data.deleted?.length > 0) {
        setProducts(products.filter((p) => !data.deleted.includes(p.id)));
        setSelectedProducts([]);
        setNotification(`${data.deleted.length} product(s) deleted successfully`);
      }
      if (data.errors?.length > 0) {
        setNotification("Some products could not be deleted");
      }
    } catch (err) {
      console.error(err);
      setNotification("Failed to delete products: " + err.message);
    }
  };

  const handleShare = (product) => setNotification(`Share ${product.title}`);

  const displayedProducts = [...products]
    .filter((p) =>
      p.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "price") {
        return sortOrder === "asc" ? a.price - b.price : b.price - a.price;
      } else {
        const dateA = new Date(a.created_at),
          dateB = new Date(b.created_at);
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      }
    });

  const toggleProductSelection = (id) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) setSelectedProducts([]);
    else setSelectedProducts(products.map((p) => p.id));
  };

  const formatTime = (ms) => {
    if (ms <= 0) return "Expired";
    const totalSec = Math.floor(ms / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  if (loading) return <p className="products-loading">Loading products...</p>;
  if (products.length === 0) return <p className="products-empty">No products yet</p>;

  return (
    <section id="products" className="section">
      {notification && (
        <Notification message={notification} onClose={() => setNotification("")} />
      )}

      <h2 className="products-title">PRODUCTS ({products.length}/10)</h2>

      {/* Панель управління */}
      <div className="products-panel">
        <div className="choose-section">
          <button onClick={() => setChooseMode(!chooseMode)}>
            {chooseMode ? "Cancel Choose" : "Choose"}
          </button>
          {chooseMode && (
            <>
              <button onClick={toggleSelectAll}>
                {selectedProducts.length === products.length ? "Unselect All" : "Choose All"}
              </button>
              <button
                onClick={() => handleDelete(selectedProducts)}
                disabled={!selectedProducts.length}
              >
                Delete
              </button>
            </>
          )}
        </div>

        <div className="sort-section">
          <label>
            Sort by:
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="date">Date</option>
              <option value="price">Price</option>
            </select>
          </label>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            {sortBy === "date" ? (
              <>
                <option value="asc">Oldest → Newest</option>
                <option value="desc">Newest → Oldest</option>
              </>
            ) : (
              <>
                <option value="asc">Lowest → Highest</option>
                <option value="desc">Highest → Lowest</option>
              </>
            )}
          </select>
        </div>

        <div className="search-section">
          <input
            type="text"
            placeholder="Search by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Продукти */}
      <div className="products-grid">
        {displayedProducts.map((product) => (
          <div
            className={`product-card ${chooseMode && selectedProducts.includes(product.id) ? "selected" : ""}`}
            key={product.id}
          >
            {chooseMode && (
              <input
                type="checkbox"
                checked={selectedProducts.includes(product.id)}
                onChange={() => toggleProductSelection(product.id)}
                className="choose-checkbox"
              />
            )}

            <div className="product-image-wrapper">
              <img src={product.image} alt={product.title} className="product-image" />
            </div>

            <div className="product-content">
              <h3 className="product-name">{product.title}</h3>
              <p className="product-description">{product.description}</p>

              <div className="product-footer">
                <span className="product-price">{product.price} {product.currency}</span>
                <span className="product-date">{product.created_at}</span>
              </div>

              {/* 🔹 Таймер відліку */}
              <div className="product-timer">
                {timers[product.id] !== undefined ? formatTime(timers[product.id]) : ""}
              </div>

              <button className="product-button">View</button>
            </div>

            <div className="three-dots-container">
              <button className="three-dots" onClick={() => toggleMenu(product.id)}>
                &#8942;
              </button>

              {openMenuId === product.id && (
                <div className="dots-menu">
                  <button onClick={() => handleEdit(product)}>Edit</button>
                  <button onClick={() => handleDelete([product.id])}>Delete</button>
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
