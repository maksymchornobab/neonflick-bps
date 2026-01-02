import { useState } from "react";
import { createPortal } from "react-dom";

export default function TermsConsentModal({
  wallet,
  token,
  onAgree,
  onReject,
}) {
  const [terms, setTerms] = useState(false);
  const [risk, setRisk] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSubmit = terms && risk && !loading;

  const saveConsent = async (consent) => {
    const res = await fetch("http://127.0.0.1:5000/auth/consent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ wallet, consent }),
    });

    if (!res.ok) {
      throw new Error(`Failed to save consent: ${consent}`);
    }
  };

  const handleAgree = async () => {
    if (!canSubmit) return;

    setLoading(true);
    try {
      // ✅ зберігаємо ОБИДВІ згоди
      await saveConsent("terms");
      await saveConsent("crypto_risk_disclosure");

      onAgree(); // 🔔 сигнал контексту/App
    } catch (err) {
      console.error("Consent error:", err);
      alert("Failed to save consents. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = () => {
    if (loading) return;
    onReject(); // 🔔 повідомляємо App, що користувач відмовився
  };

  return createPortal(
    <div style={overlay}>
      <div style={modal}>
        <h2 style={title}>User Agreement Required</h2>

        <p style={text}>
          To continue using the platform, you must carefully review and accept
          the Terms & Conditions and acknowledge the risks associated with
          cryptocurrency usage.
        </p>

        {/* TERMS */}
        <ConsentRow
          checked={terms}
          onChange={setTerms}
          label={
            <>
              I agree to the{" "}
              <a
                href="/legal/terms"
                target="_blank"
                rel="noopener noreferrer"
                style={link}
              >
                Terms & Conditions
              </a>
            </>
          }
          disabled={loading}
        />

        {/* CRYPTO RISK */}
        <ConsentRow
          checked={risk}
          onChange={setRisk}
          label={
            <>
              I understand and accept the{" "}
              <a
                href="/legal/crypto-risks"
                target="_blank"
                rel="noopener noreferrer"
                style={link}
              >
                Crypto Risk Disclosure
              </a>
            </>
          }
          disabled={loading}
        />

        <button
          onClick={handleAgree}
          disabled={!canSubmit}
          style={{
            ...primaryBtn,
            background: canSubmit ? "#00ffff" : "#003333",
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
        >
          {loading ? "Saving..." : "Agree & Continue"}
        </button>

        <button
          onClick={handleReject}
          disabled={loading}
          style={rejectBtn}
        >
          I Do Not Agree
        </button>
      </div>
    </div>,
    document.body
  );
}

/* ---------------- DENIED SCREEN ---------------- */
export function DeniedScreen() {
  return createPortal(
    <div style={deniedContainer}>
      <h2 style={{ color: "#ff0044", marginBottom: 20 }}>
        Access Restricted
      </h2>
      <p style={deniedText}>
        We’re sorry, but without accepting the Terms & Conditions and the
        Crypto Risk Disclosure, we are unable to provide access to this
        platform.
      </p>
    </div>,
    document.body
  );
}

/* ---------------- HELPERS ---------------- */

function ConsentRow({ checked, onChange, label, disabled }) {
  return (
    <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <label style={{ lineHeight: 1.5 }}>{label}</label>
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.95)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
};

const modal = {
  background: "#111",
  border: "2px solid #00ffff",
  borderRadius: 16,
  padding: 30,
  width: 520,
  maxWidth: "90%",
  color: "#fff",
  boxShadow: "0 0 20px #00ffff",
};

const title = { color: "#00ffff", textAlign: "center" };
const text = { marginTop: 20, lineHeight: 1.6 };

const link = {
  color: "#00ffff",
  fontWeight: "bold",
  textDecoration: "underline",
};

const primaryBtn = {
  marginTop: 30,
  width: "100%",
  padding: 12,
  color: "#111",
  fontWeight: "bold",
  border: "none",
  borderRadius: 8,
};

const rejectBtn = {
  marginTop: 10,
  width: "100%",
  padding: 12,
  background: "transparent",
  color: "#ff0044",
  border: "2px solid #ff0044",
  borderRadius: 8,
};

const deniedContainer = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.95)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  color: "#fff",
  zIndex: 9999,
  padding: 40,
  textAlign: "center",
};

const deniedText = {
  lineHeight: 1.7,
  opacity: 0.9,
};
