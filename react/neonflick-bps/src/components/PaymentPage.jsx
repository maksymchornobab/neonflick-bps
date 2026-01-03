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
import Footer from "../components/Footer";
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

  // 🔹 Consent checkbox state
  const [consentChecked, setConsentChecked] = useState(false);

  const RPC_URL = process.env.REACT_APP_SOLANA_RPC;
  
  const connection = useMemo(
    () => new Connection(RPC_URL, "confirmed"),
    []
  );

  // 🔹 Fetch product
  useEffect(() => {
    const fetchPaymentData = async () => {
  try {
    const res = await fetch(`https://neonflick-bps-production.up.railway.app/api/pay/${productId}`);

    if (!res.ok) {
      setError("Product is unavailable or expired");
      return;
    }

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
  // ---------- PRE-CHECKS ----------
  if (!product?._id) {
    setNotification("Product data not loaded. Please refresh the page.");
    return;
  }

  if (!publicKey || !signTransaction) {
    setNotification("Please connect your wallet to continue.");
    return;
  }

  if (!consentChecked) {
    setNotification("You must accept the Terms and required consents to proceed.");
    return;
  }

  try {
    setPaying(true);
    setTxHash("");
    setNotification("Preparing transaction. Please wait…");

    // ---------- PREPARE TRANSACTION (BACKEND) ----------
    const res = await fetch("https://neonflick-bps-production.up.railway.app/api/pay/prepare/sol", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: product._id,
        buyer_wallet: publicKey.toString(),
      }),
    });

    if (!res.ok) {
      let msg = "Unable to prepare the transaction. Please try again later.";
      const contentType = res.headers.get("Content-Type");
      if (contentType?.includes("application/json")) {
        const data = await res.json().catch(() => null);
        if (data?.message) msg = data.message;
      } else {
        const text = await res.text().catch(() => "");
        if (text) {
          msg = text.replace(/<\/?[^>]+(>|$)/g, "").trim();
        }
      }
      throw new Error(msg);
    }

    const { blockhash, transfers } = await res.json();

    if (!transfers || transfers.length === 0) {
      throw new Error("Payment configuration error. Please contact support.");
    }

    // ---------- BUILD TRANSACTION ----------
    const tx = new Transaction({
      recentBlockhash: blockhash,
      feePayer: publicKey,
    });

    let totalLamports = 0;

    transfers.forEach((t) => {
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

    if (totalLamports <= 0) {
      throw new Error("Invalid payment amount. Please refresh the page and try again.");
    }

    // ---------- WALLET SIGN ----------
    setNotification("Transaction prepared. Please confirm it in your wallet…");

    let signedTx;
    try {
      signedTx = await signTransaction(tx);
    } catch (e) {
      throw new Error("Transaction was rejected in your wallet.");
    }

    // ---------- SEND TO BLOCKCHAIN ----------
    let signature;
    try {
      signature = await connection.sendRawTransaction(signedTx.serialize());
    } catch (e) {
      throw new Error("Failed to send transaction to the network. Please try again.");
    }

    try {
      await connection.confirmTransaction(signature, "confirmed");
    } catch (e) {
      throw new Error("Transaction was sent, but confirmation failed. Please check your wallet.");
    }

    // ---------- SEND TX + CONSENTS TO BACKEND ----------
    setNotification("Finalizing payment…");

    const consentNames = [
      "terms",
      "privacy",
      "withdrawal",
      "platform_disclaimer",
      "aml",
      "crypto_risk_disclosure",
    ];

    const now = new Date().toISOString();
    const timestamps = consentNames.map(() => now);

    const backendRes = await fetch(
      `https://neonflick-bps-production.up.railway.app/api/products/${product._id}/transaction`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tx_hash: signature,
          consents: consentNames,
          timestamps,
        }),
      }
    );

    if (!backendRes.ok) {
      setNotification(
        "Payment completed on the blockchain, but platform confirmation failed. Please contact support with your transaction hash."
      );
    } else {
      setNotification("");
    }

    // ---------- SUCCESS ----------
    setTxHash(signature);
    setShowSuccess(true);

  } catch (err) {
    console.error(err);
    let cleanMsg = (err.message || "").replace(/<\/?[^>]+(>|$)/g, "").trim();
    if (!cleanMsg) cleanMsg = "Payment failed due to an unexpected error. Please try again.";
    setNotification(cleanMsg);
  } finally {
    setPaying(false);
  }
};



  if (loading) return <div className="payment-page__loading">Loading…</div>;
  if (error) return <div className="payment-page__error">{error}</div>;

  return (
   <>
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

        {descriptionOpen && (
        <div className="payment-card payment-card--description payment-card--active">
          <h2>Full Description</h2>
          <div className="payment-card__full-description">
            {product.description}
          </div>
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

        {/* 🔹 Consent checkbox */}
        <label className="consent-label">
  <input
    type="checkbox"
    className="consent-checkbox"
    checked={consentChecked}
    onChange={(e) => setConsentChecked(e.target.checked)}
  />

  <span className="consent-text">
    I accept{" "}
    <a href="/legal/terms" target="_blank" rel="noopener noreferrer">
      Terms & Conditions
    </a>,{" "}
    <a href="/legal/privacy" target="_blank" rel="noopener noreferrer">
      Privacy Policy
    </a>,{" "}
    <a href="/legal/withdrawal" target="_blank" rel="noopener noreferrer">
      Withdrawal Information
    </a>,{" "}
    <a href="/legal/disclaimer" target="_blank" rel="noopener noreferrer">
      Platform Disclaimer
    </a>,{" "}
    <a href="/legal/aml" target="_blank" rel="noopener noreferrer">
      AML / Abuse Prevention
    </a>, and{" "}
    <a href="/legal/crypto-risks" target="_blank" rel="noopener noreferrer">
      Crypto Risk Disclosure
    </a>
  </span>
</label>


        <button
          className="payment-card__pay-btn"
          disabled={!publicKey || paying || timer <= 0 || !consentChecked}
          onClick={handlePay}
        >
          {timer <= 0 ? "Expired" : paying ? "Processing…" : "Pay now"}
        </button>

        <a href="/howto/payment-instruction" target="_blank" rel="noopener noreferrer" className="pay-instr">Payment Instruction</a>
      </div>

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
    <Footer />
    </>
  );
}
