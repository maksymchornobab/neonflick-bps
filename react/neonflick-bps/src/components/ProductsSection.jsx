import { useEffect, useState } from "react";
import Notification from "./Notification";
import { useNavigate } from "react-router-dom";
import { useWalletAuth } from "./WalletAuthContext";

export default function ProductsSection({ onEdit }) {
  const navigate = useNavigate();
  const { user, connectedWallet } = useWalletAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [notification, setNotification] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [chooseMode, setChooseMode] = useState(false);

  const [timers, setTimers] = useState({});
  const [openInfoId, setOpenInfoId] = useState(null);
  const [txOverlayId, setTxOverlayId] = useState(null);

  const [deleteOverlayIds, setDeleteOverlayIds] = useState([]);

  /* ================= FETCH ================= */
  useEffect(() => {
    if (!connectedWallet) {
      setProducts([]);
      return;
    }
    fetchProducts();
  }, [connectedWallet]);

  const fetchProducts = async () => {
  setLoading(true);
  try {
    const token = localStorage.getItem("jwt_token");
    const res = await fetch("http://127.0.0.1:5000/products", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.ok) {
      throw new Error("Failed to fetch products");
    }

    const data = await res.json();
    setProducts(data.products || []);
  } catch (err) {
    console.error(err);
    setNotification(err.message || "Failed to fetch products");
  } finally {
    setLoading(false);
  }
};

/* ================= TIMERS ================= */
useEffect(() => {
  const interval = setInterval(() => {
    const now = Date.now();
    const updated = {};
    products.forEach((p) => {
      if (p.expires_at) {
        const remaining = new Date(p.expires_at).getTime() - now;
        updated[p.id] = remaining > 0 ? remaining : 0;
      }
    });
    setTimers(updated);
  }, 1000);
  return () => clearInterval(interval);
}, [products]);

/* ================= HELPERS ================= */
const toggleMenu = (id) => setOpenMenuId(openMenuId === id ? null : id);
const toggleInfo = (id) => setOpenInfoId(openInfoId === id ? null : id);

const toggleProductSelection = (id) => {
  setSelectedProducts((prev) =>
    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
  );
};

const toggleSelectAll = () => {
  if (selectedProducts.length === products.length) {
    setSelectedProducts([]);
  } else {
    setSelectedProducts(products.map((p) => p.id));
  }
};

const formatTime = (ms) => {
  if (ms <= 0) return "Expired";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}h ${m}m ${s}s`;
};

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).catch((err) => {
    console.error("Failed to copy:", err);
    setNotification("Failed to copy text");
  });
};

/* ================= ACTIONS ================= */
const handleEdit = (product) => onEdit(product);

const handleShare = (product) => {
  const url = `http://localhost:3000/pay/${product.id}`;
  navigator.clipboard.writeText(url).catch((err) => {
    console.error("Failed to copy link:", err);
    setNotification("Failed to copy link");
  });
};

const handleDelete = async (ids) => {
  const productIds = Array.isArray(ids) ? ids : [ids];
  try {
    const res = await fetch("http://127.0.0.1:5000/delete-products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: productIds }),
    });

    const data = await res.json();

    if (data.errors?.length) {
      setNotification("Some products could not be deleted");
    }

    if (data.deleted?.length) {
      setProducts((prev) => prev.filter((p) => !data.deleted.includes(p.id)));
      setSelectedProducts((prev) =>
        prev.filter((id) => !data.deleted.includes(id))
      );
    }
  } catch (err) {
    console.error(err);
    setNotification("Delete failed: " + (err.message || ""));
  }
};

const showDeleteOverlay = (id) => {
  setDeleteOverlayIds((prev) => [...prev, id]);
};

const hideDeleteOverlay = (id) => {
  setDeleteOverlayIds((prev) => prev.filter((x) => x !== id));
};

const confirmDelete = (id) => {
  handleDelete(id);
  hideDeleteOverlay(id);
};

/* ================= FILTER + SORT ================= */
const displayedProducts = [...products]
  .filter((p) =>
    p.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
  )
  .sort((a, b) => {
    if (sortBy === "price") {
      return sortOrder === "asc" ? a.price - b.price : b.price - a.price;
    }
    const da = new Date(a.created_at);
    const db = new Date(b.created_at);
    return sortOrder === "asc" ? da - db : db - da;
  });

/* ================= RENDER ================= */
if (loading) return <p className="products-loading">Loading products...</p>;
if (!products.length) return <p className="products-empty">No products yet</p>;


  return (
  <section id="products" className="section">
    {notification && (
      <Notification
        message={notification}
        onClose={() => setNotification("")}
      />
    )}

    <h2 className="products-title">PRODUCTS ({products.length}/10)</h2>

    <div className="products-panel">

      <div className="sort-section">
        <label>
          Sort by:
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="date">Date</option>
            <option value="price">Price</option>
          </select>
        </label>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
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
      
      <div className="choose-section">
        <button onClick={() => setChooseMode(!chooseMode)}>
          {chooseMode ? "Cancel Choose" : "Choose"}
        </button>
        {chooseMode && (
          <>
            <button onClick={toggleSelectAll}>
              {selectedProducts.length === products.length
                ? "Unselect All"
                : "Choose All"}
            </button>
            <button
              disabled={!selectedProducts.length}
              onClick={() =>
                selectedProducts.forEach((id) => showDeleteOverlay(id))
              }
            >
              Delete
            </button>
          </>
        )}
      </div>

      <div className="search-section">
        <input
          placeholder="Search by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
    </div>

    <div className="products-grid">
      {displayedProducts.map((product) => (
        <div
          key={product.id}
          className={`product-card ${
            chooseMode && selectedProducts.includes(product.id)
              ? "selected"
              : ""
          }`}
        >
          {chooseMode && (
            <input
              type="checkbox"
              className="choose-checkbox"
              checked={selectedProducts.includes(product.id)}
              onChange={() => toggleProductSelection(product.id)}
            />
          )}

          <div className="product-image-wrapper">
            <img
              src={product.image}
              alt={product.title}
              className="product-image"
            />
          </div>

          <div className="product-content">
            <h3 className="product-name">{product.title}</h3>
            <p className="product-description">{product.description}</p>

            <div className="product-footer">
              <span className="product-price">
                {product.price} {product.currency}
              </span>
              <span className="product-date">{product.created_at}</span>
            </div>

            <div
              className="additional-info-toggle"
              onClick={() => toggleInfo(product.id)}
            >
              Additional Information
              <span
                className={`info-arrow ${
                  openInfoId === product.id ? "open" : ""
                }`}
              >
                ▾
              </span>
            </div>

            {openInfoId === product.id && (
              <div className="additional-info-box">
                <div>
                  <span>Status</span>
                  <strong>{product.stats?.status || "—"}</strong>
                </div>

                <div>
                  <span>Commission</span>
                  <strong className="commission-color">
                    {product.commission ?? "—"} {product.currency}
                  </strong>
                </div>

                <div>
                  <span>Final Reward</span>
                  <strong className="final-reward-color">
                    {product.final_price ?? "—"} {product.currency}
                  </strong>
                </div>

                <div>
                  <span>Completed Transactions</span>
                  <strong>{product.stats?.count ?? 0}</strong>
                </div>

                {!!product.stats?.transactions?.length && (
                  <>
                    <div
                      className="transactions-toggle"
                      onClick={() =>
                        setTxOverlayId(
                          txOverlayId === product.id ? null : product.id
                        )
                      }
                    >
                      Transaction hashes:
                    </div>

                    {txOverlayId === product.id && (
                      <div className="tx-overlay">
                        <div className="tx-overlay-header">
                          <h2 className="tx-h2">Tx-hashes</h2>
                          <button
                            className="tx-overlay-close"
                            onClick={() => setTxOverlayId(null)}
                          >
                            ✕
                          </button>
                        </div>

                        <ul className="tx-overlay-content">
                          {product.stats.transactions.map((tx, i) => (
                            <li
                              key={i}
                              className="tx-hash"
                              onClick={() => copyToClipboard(tx.hash)}
                            >
                              {tx.hash.slice(0, 20)}...
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="product-timer">
              {timers[product.id] !== undefined &&
                formatTime(timers[product.id])}
            </div>

            <button
              className="product-button"
              onClick={() => navigate(`/pay/${product.id}`)}
            >
              View
            </button>
          </div>

          <div className="three-dots-container">
            <button
              className={`three-dots ${
                deleteOverlayIds.includes(product.id)
                  ? "three-dots-hidden"
                  : ""
              }`}
              onClick={() => toggleMenu(product.id)}
            >
              &#8942;
            </button>

            {openMenuId === product.id &&
              !deleteOverlayIds.includes(product.id) && (
                <div className="dots-menu">
                  <button onClick={() => handleEdit(product)}>Edit</button>
                  <button onClick={() => showDeleteOverlay(product.id)}>
                    Delete
                  </button>
                  <button onClick={() => handleShare(product)}>Share</button>
                </div>
              )}

            {deleteOverlayIds.includes(product.id) && (
              <div className="delete-overlay">
                <div className="delete-modal">
                  <h3 className="delete-title">Confirm Delete</h3>

                  <p>
                    Are you sure you want to delete this product? This action
                    cannot be undone.
                  </p>

                  <div className="delete-actions">
                    <button
                      className="delete-cancel-btn"
                      onClick={() => hideDeleteOverlay(product.id)}
                    >
                      Cancel
                    </button>
                    <button
                      className="delete-confirm-btn"
                      onClick={() => confirmDelete(product.id)}
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </section>
);
}

