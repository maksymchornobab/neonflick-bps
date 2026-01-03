import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

export default function SuccessModal({ txHash, product, buyerWallet }) {
  const solscanUrl = `https://solscan.io/tx/${txHash}?cluster=mainnet`;
  const { publicKey } = useWallet();
  const BACKEND = process.env.REACT_APP_BACKEND;

  const [confirmClose, setConfirmClose] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [actionDisabled, setActionDisabled] = useState(false);

  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState("");

  const handleClose = () => {
    if (!confirmClose) {
      setConfirmClose(true);
      return;
    }
    window.history.back();
  };

  useEffect(() => {
    if (!confirmClose) return;
    const timer = setTimeout(() => setConfirmClose(false), 3000);
    return () => clearTimeout(timer);
  }, [confirmClose]);

  const receiptData = product
    ? {
        product_id: product.id,
        title: product.title,
        price: product.price,
        currency: product.currency,
        commission: product.commission || 0,
        sellerWallet: product.wallet,
        buyer_wallet: buyerWallet || publicKey?.toString(),
        tx_hash: txHash,
        image: product.image,
      }
    : null;

  const disableActions = () => {
    setActionDisabled(true);
    setTimeout(() => setActionDisabled(false), 15000);
  };

  const handleSendEmail = async () => {
    if (actionDisabled) return;

    if (!showEmailInput) {
      setShowEmailInput(true);
      return;
    }

    if (!email || !email.includes("@")) {
      alert("Please enter a valid email");
      return;
    }

    disableActions();

    try {
      if (!receiptData) throw new Error("Product data not available");

      const res = await fetch(`${BACKEND}/api/send-receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...receiptData, email }),
      });

      if (!res.ok) throw new Error("Failed to send e-receipt");

      setEmailSent(true);
      setShowEmailInput(false);
    } catch (err) {
      console.error(err);
      alert("Could not send e-receipt: " + err.message);
    }
  };

  return (
    <div className="success-overlay">
      <div className="success-modal">
        <div className="success-icon">✓</div>
        <h2>Transaction Successful</h2>

        <a
          href={solscanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="success-link"
        >
          Check the transaction
        </a>

        {!emailSent ? (
          <div className="receipt-warning">
            <span className="warning-icon">⚠️</span>
            <p>
              Please send your <b>e-receipt</b> to email.  
              This document is your official proof of payment.
            </p>
          </div>
        ) : (
          <div className="receipt-success">
            <span className="success-icon-small">✓</span>
            <p>E-receipt successfully sent to email</p>
          </div>
        )}

        <div className="success-actions">
          <button
            className="btn-send"
            onClick={handleSendEmail}
            disabled={actionDisabled}
          >
            {showEmailInput ? "Confirm & Send" : "Send the e-receipt to E-mail"}
          </button>

          {showEmailInput && (
            <input
              type="email"
              className="email-input"
              placeholder="your@email.com"
              maxLength={100}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}

          <button
            className={`btn-primary ${
              confirmClose ? "danger" : !emailSent ? "warning" : ""
            }`}
            onClick={handleClose}
          >
            {confirmClose ? "Click again to close" : "Close page"}
          </button>
        </div>
      </div>
    </div>
  );
}
