import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

export default function SuccessModal({ txHash, product, buyerWallet }) {
  const solscanUrl = `https://solscan.io/tx/${txHash}?cluster=mainnet`;
  const { publicKey } = useWallet();

  const [confirmClose, setConfirmClose] = useState(false);
  const [receiptSaved, setReceiptSaved] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const BACKEND = process.env.REACT_APP_BACKEND;

  // нове: блокування кнопок на 15 секунд
  const [actionDisabled, setActionDisabled] = useState(false);

  const handleClose = () => {
    if (!confirmClose) {
      setConfirmClose(true);
      return;
    }
    window.history.back();
  };

  useEffect(() => {
    if (!confirmClose) return;

    const timer = setTimeout(() => {
      setConfirmClose(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [confirmClose]);

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isPhantomMobile = window.solana?.isPhantom && isMobile;

  const receiptData = product
    ? {
        product_id: product.id,
        title: product.title,
        price: product.price,
        currency: product.currency,
        commission: product.commission || 0,
        description: product.description,
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

  const handleDownloadPDF = async () => {
    if (actionDisabled) return;
    disableActions();

    try {
      if (!receiptData) throw new Error("Product data not available");

      const res = await fetch(
        `${BACKEND}/api/generate-receipt`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(receiptData),
        }
      );

      if (!res.ok) throw new Error("Failed to generate PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "e-receipt.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setReceiptSaved(true);
    } catch (err) {
      console.error(err);
      alert("Could not download e-receipt: " + err.message);
    }
  };

  const handleSendEmail = async () => {
    if (actionDisabled) return;
    disableActions();

    try {
      if (!receiptData) throw new Error("Product data not available");

      const email = prompt("Enter your email to receive the e-receipt:");
      if (!email) return;

      const res = await fetch(
        `${BACKEND}/api/send-receipt`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...receiptData, email }),
        }
      );

      if (!res.ok) throw new Error("Failed to send e-receipt");

      setEmailSent(true);
      alert("E-receipt sent to your email!");
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

        {!receiptSaved && !emailSent ? (
          <div className="receipt-warning">
            <span className="warning-icon">⚠️</span>
            <div>
              <strong>Important:</strong>
              <p>
                Please save your <b>e-receipt</b>. This document is your official proof of payment.
              </p>
            </div>
          </div>
        ) : (
          <div className="receipt-success">
            <span className="success-icon-small">✓</span>
            <p>
              {emailSent
                ? "E-receipt successfully sent to email"
                : "E-receipt successfully saved"}
            </p>
          </div>
        )}

        <div className="success-actions">
          {isPhantomMobile ? (
            <button
              className="btn-send"
              onClick={handleSendEmail}
              disabled={actionDisabled}
            >
              Send the e-receipt to E-mail
            </button>
          ) : (
            <>
              <button
                className="btn-secondary"
                onClick={handleDownloadPDF}
                disabled={actionDisabled}
              >
                Save e-receipt
              </button>
              <button
                className="btn-send"
                onClick={handleSendEmail}
                disabled={actionDisabled}
              >
                Send the e-receipt to E-mail
              </button>
            </>
          )}

          <button
            className={`btn-primary ${
              confirmClose ? "danger" : !receiptSaved && !emailSent ? "warning" : ""
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
