import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ConnectWallet from "../components/ConnectWallet";
import Notification from "../components/Notification";

export default function PaymentPage() {
  const { productId } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");
  const [timer, setTimer] = useState(0);
  const [walletAddress, setWalletAddress] = useState(""); 
  const [descriptionOpen, setDescriptionOpen] = useState(false); // 🔹 стан description

  // 🔹 Fetch product payment data
  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:5000/api/pay/${productId}`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text);
        }

        const data = await res.json();
        setProduct(data);

        const expires = new Date(data.expires_at).getTime();
        const now = Date.now();
        setTimer(Math.max(expires - now, 0));
      } catch (err) {
        console.error(err);
        setError("Product is unavailable or expired");
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentData();
  }, [productId]);

  // 🔹 Таймер відліку
  useEffect(() => {
    if (!timer) return;
    const interval = setInterval(() => {
      setTimer(prev => Math.max(prev - 1000, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const formatTime = (ms) => {
    if (ms <= 0) return "Expired";
    const totalSec = Math.floor(ms / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  if (loading) return <div className="payment-page__loading">Loading...</div>;
  if (error) return <div className="payment-page__error">{error}</div>;

  return (
    <div className="payment-page payment-page--double">
      {/* 💳 Оплата */}
      <div className="payment-card">
        <img
          src={product.image}
          alt={product.title}
          className="payment-card__image"
        />

        <h1 className="payment-card__title">{product.title}</h1>

        {/* 🔹 Description toggle */}
        {product.description && (
          <div 
            className="payment-card__description-toggle"
            onClick={() => setDescriptionOpen(prev => !prev)}
          >
            Full description - {descriptionOpen ? "close" : "open"}
          </div>
        )}

        <div className="payment-card__details">
          <div>
            <span>Price:</span>
            <strong>{product.price} {product.currency}</strong>
          </div>

          <div>
            <span>Total to pay:</span>
            <strong>{product.price} {product.currency}</strong>
          </div>
        </div>

        {/* 🔹 Таймер */}
        <div className="payment-card__timer">
          Time left: {formatTime(timer)}
        </div>

        {/* 🔌 Wallet connection */}
        <div className="payment-card__wallet">
          {!walletAddress ? (
            <ConnectWallet onConnect={(address) => setWalletAddress(address)} />
          ) : (
            <div className="connected-wallet">
              Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </div>
          )}
        </div>

        <button
          className="payment-card__pay-btn"
          disabled={timer <= 0 || !walletAddress}
          onClick={() => setNotification(`Wallet ${walletAddress} ready to pay ${product.price} ${product.currency}`)}
        >
          {timer <= 0 ? "Expired" : "Pay now"}
        </button>
      </div>

      {/* 🔹 Повний опис */}
      {descriptionOpen && (
  <div className={`payment-card payment-card--description ${descriptionOpen ? "payment-card--active" : ""}`}>
  <h2>Full Description</h2>
  <div className="payment-card__full-description">
    {product.description}
  </div>
</div>

)}


      {notification && (
        <Notification message={notification} onClose={() => setNotification("")} />
      )}
    </div>
  );
}
