import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Connection, Transaction, SystemProgram, PublicKey } from "@solana/web3.js";
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
} from "@solana/wallet-adapter-wallets";
import Notification from "../components/Notification";
import SuccessModal from "../components/SuccessModal";
import "@solana/wallet-adapter-react-ui/styles.css";

// 🔹 Wallet formatter
const formatWallet = (wallet) => {
  if (!wallet || wallet.length < 8) return wallet || "";
  return `${wallet.slice(0, 4)}****${wallet.slice(-4)}`;
};

// 🔹 Wrapper
export default function PaymentPageWrapper() {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <WalletProvider wallets={wallets} autoConnect={false}>
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
  const [additionalOpen, setAdditionalOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const RPC_URL = process.env.REACT_APP_SOLANA_RPC;
  
  const connection = useMemo(
  () => new Connection(RPC_URL, "confirmed"),
  []
);

  // 🔹 Fetch product
  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:5000/api/pay/${productId}`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setProduct({ ...data, _id: data.product_id });

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

  const formatTime = (ms) => {
    if (ms <= 0) return "Expired";
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ${s % 60}s`;
  };

  // 🔹 PAY
  const handlePay = async () => {
    if (!product?._id) return setNotification("Product not loaded");
    if (!publicKey || !signTransaction) return setNotification("Connect wallet first");

    try {
      setPaying(true);
      setNotification("Preparing transaction…");
      setTxHash("");

      const res = await fetch("http://127.0.0.1:5000/api/pay/prepare/sol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product._id,
          buyer_wallet: publicKey.toString(),
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const { blockhash, transfers } = await res.json();
      // 🔹 Створюємо транзакцію
const tx = new Transaction({ recentBlockhash: blockhash, feePayer: publicKey });

// 🔹 Сумуємо всі lamports для логування
let totalLamports = 0;

transfers.forEach(t => {
  if (t.to && t.lamports > 0) {
    totalLamports += t.lamports;
    tx.add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey(t.to),
        lamports: t.lamports,
      })
    );
  }
});

// 🔹 Лог балансу гаманця
const walletBalance = await connection.getBalance(publicKey);

// 🔹 Очікуємо підтвердження від користувача
setNotification("Waiting for wallet confirmation…");

const signedTx = await signTransaction(tx);
const signature = await connection.sendRawTransaction(signedTx.serialize());
await connection.confirmTransaction(signature);


      // ✅ Update product on backend
      await fetch(`http://127.0.0.1:5000/api/products/${product._id}/transaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tx_hash: signature }),
      });

      setTxHash(signature);
      setShowSuccess(true);
      setNotification("");
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

        <div
          className="payment-card__additional-toggle"
          onClick={() => setAdditionalOpen(o => !o)}
        >
          Additional Info
          <span className={`arrow ${additionalOpen ? "open" : ""}`}>▾</span>
        </div>

        {additionalOpen && (
          <div className="payment-card__additional-box">
            <div>
              <span>Seller wallet</span>
              <strong>{formatWallet(product.sellerWallet)}</strong>
            </div>
            <div>
              <span>Commission paid by seller</span>
              <strong>{product.commission} {product.currency}</strong>
            </div>
          </div>
        )}

        <div className="payment-card__timer">
          Time left: {formatTime(timer)}
        </div>

        <div className="payment-card__wallet">
          <WalletMultiButton />
        </div>

        <button
          className="payment-card__pay-btn"
          disabled={!publicKey || paying || timer <= 0}
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

      {showSuccess && (
        <SuccessModal
          txHash={txHash}
          product={{
            id: product._id,
            title: product.title,
            price: product.price,
            currency: product.currency,
            commission: product.commission,
            description: product.description,
            wallet: product.sellerWallet,
            image: product.image,
            expires_at: product.expires_at
          }}
          buyerWallet={publicKey.toString()}
        />
      )}
    </div>
  );
}
