// TermsConsentModal.jsx
import { useState } from "react";
import { createPortal } from "react-dom";

export default function TermsConsentModal({
  wallet,
  token,
  onAgree,
  onReject,
}) {
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAgree = async () => {
    if (!agree || loading) return;

    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/auth/consent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          wallet,
          consent: "terms",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save Terms consent");
      }

      await res.json();

      // ✅ IMPORTANT:
      // тут НІЯКОЇ навігації або логіну
      // тільки сигнал батьківському компоненту
      onAgree();
    } catch (err) {
      console.error("Terms consent error:", err);
      alert("Failed to save Terms consent. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = () => {
    if (loading) return;
    onReject(); // ❌ повний блок доступу
  };

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "#111",
          border: "2px solid #00ffff",
          borderRadius: "16px",
          padding: "30px",
          width: "500px",
          maxWidth: "90%",
          color: "#fff",
          fontFamily: "'Orbitron', sans-serif",
          boxShadow: "0 0 20px #00ffff",
        }}
      >
        <h2 style={{ color: "#00ffff", textAlign: "center" }}>
          Terms & Conditions
        </h2>

        <p style={{ marginTop: "20px", lineHeight: 1.6 }}>
          To continue using the platform, you must carefully review and accept
          our Terms & Conditions. Without acceptance, access to the platform
          is not permitted.
        </p>

        <div
          style={{
            marginTop: "20px",
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
          }}
        >
          <input
            type="checkbox"
            id="termsConsent"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            disabled={loading}
            style={{ marginTop: "4px" }}
          />
          <label htmlFor="termsConsent" style={{ lineHeight: 1.4 }}>
            I agree to the{" "}
            <a
              href="/legal/terms"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#00ffff",
                textDecoration: "underline",
              }}
            >
              Terms & Conditions
            </a>
          </label>
        </div>

        <button
          onClick={handleAgree}
          disabled={!agree || loading}
          style={{
            marginTop: "30px",
            width: "100%",
            padding: "12px",
            background: agree && !loading ? "#00ffff" : "#003333",
            color: "#111",
            fontWeight: "bold",
            fontFamily: "'Orbitron', sans-serif",
            border: "none",
            borderRadius: "8px",
            cursor: agree && !loading ? "pointer" : "not-allowed",
            transition: "0.3s",
          }}
        >
          {loading ? "Saving..." : "Agree & Continue"}
        </button>

        <button
          onClick={handleReject}
          disabled={loading}
          style={{
            marginTop: "10px",
            width: "100%",
            padding: "12px",
            background: "transparent",
            color: "#ff0044",
            border: "2px solid #ff0044",
            borderRadius: "8px",
            fontFamily: "'Orbitron', sans-serif",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "0.3s",
          }}
        >
          I Do Not Agree
        </button>
      </div>
    </div>,
    document.body
  );
}
