import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Connection, Transaction } from "@solana/web3.js";
import {
  WalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import Notification from "../components/Notification";
import "@solana/wallet-adapter-react-ui/styles.css";

export default function PaymentPageWrapper() {
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
    ],
    []
  );

  return (
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <PaymentPage />
      </WalletModalProvider>
    </WalletProvider>
  );
}

function PaymentPage() {
  const { productId } = useParams();
  const { publicKey, signTransaction } = useWallet();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");
  const [timer, setTimer] = useState(0);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [paying, setPaying] = useState(false);

  const connection = useMemo(
    () => new Connection("https://api.devnet.solana.com"),
    []
  );

  // 🔹 Fetch product data
  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:5000/api/pay/${productId}`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setProduct(data);
        const expires = new Date(data.expires_at).getTime();
        setTimer(Math.max(expires - Date.now(), 0));
      } catch (err) {
        console.error(err);
        setError("Product is unavailable or expired");
      } finally {
        setLoading(false);
      }
    };
    fetchPaymentData();
  }, [productId]);

  // 🔹 Timer
  useEffect(() => {
    if (!timer) return;
    const interval = setInterval(() => {
      setTimer(prev => Math.max(prev - 1000, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // 🔹 Форматування часу
  const formatTime = (ms) => {
    if (ms <= 0) return "Expired";
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ${s % 60}s`;
  };

  // 💳 PAY LOGIC
  const handlePay = async () => {
    if (!publicKey || !signTransaction) {
      setNotification("Please connect your wallet first");
      return;
    }

    try {
      setPaying(true);
      setNotification("Preparing transaction…");

      const res = await fetch("http://127.0.0.1:5000/api/pay/prepare/sol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product._id,
          buyer_wallet: publicKey.toString(),
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const { unsigned_transaction } = await res.json();

      const txBuffer = Buffer.from(unsigned_transaction, "hex");
      const transaction = Transaction.from(txBuffer);

      setNotification("Waiting for wallet confirmation…");

      const signedTx = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature);

      setNotification(`Payment sent ✔️ ${signature}`);
    } catch (err) {
      console.error(err);
      setNotification(err.message || "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div className="payment-page__loading">Loading…</div>;
  if (error) return <div className="payment-page__error">{error}</div>;

  return (
    <div className="payment-page payment-page--double">
      <div className="payment-card">
        <img src={product.image} alt={product.title} className="payment-card__image" />
        <h1 className="payment-card__title">{product.title}</h1>

        {product.description && (
          <div
            className="payment-card__description-toggle"
            onClick={() => setDescriptionOpen(p => !p)}
          >
            Full description – {descriptionOpen ? "close" : "open"}
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

        <div className="payment-card__timer">
          Time left: {formatTime(timer)}
        </div>

        <div className="payment-card__wallet">
          <WalletMultiButton />
        </div>

        <button
          className="payment-card__pay-btn"
          disabled={timer <= 0 || !publicKey || paying}
          onClick={handlePay}
        >
          {timer <= 0 ? "Expired" : paying ? "Processing…" : "Pay now"}
        </button>
      </div>

      {descriptionOpen && (
        <div className="payment-card payment-card--description payment-card--active">
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
