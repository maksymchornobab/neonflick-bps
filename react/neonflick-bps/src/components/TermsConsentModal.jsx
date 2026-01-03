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
    const res = await fetch("https://neonflick-bps-production.up.railway.app/auth/consent", {
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
      await saveConsent("terms");
      await saveConsent("crypto_risk_disclosure");
      onAgree();
    } catch (err) {
      console.error("Consent error:", err);
      alert("Failed to save consents. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = () => {
    if (loading) return;
    onReject();
  };

  return createPortal(
    <div className="terms-overlay">
      <div className="terms-modal">
        <h2 className="terms-title">User Agreement Required</h2>

        <p className="terms-text">
          To continue using the platform, you must carefully review and accept
          the Terms & Conditions and acknowledge the risks associated with
          cryptocurrency usage.
        </p>

        <ConsentRow
          checked={terms}
          onChange={setTerms}
          disabled={loading}
          label={
            <>
              I agree to the{" "}
              <a
                href="/legal/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="terms-link"
              >
                Terms & Conditions
              </a>
            </>
          }
        />

        <ConsentRow
          checked={risk}
          onChange={setRisk}
          disabled={loading}
          label={
            <>
              I understand and accept the{" "}
              <a
                href="/legal/crypto-risks"
                target="_blank"
                rel="noopener noreferrer"
                className="terms-link"
              >
                Crypto Risk Disclosure
              </a>
            </>
          }
        />

        <button
          onClick={handleAgree}
          disabled={!canSubmit}
          className={`terms-primary-btn ${
            canSubmit ? "active" : "disabled"
          }`}
        >
          {loading ? "Saving..." : "Agree & Continue"}
        </button>

        <button
          onClick={handleReject}
          disabled={loading}
          className="terms-reject-btn"
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
    <div className="denied-container">
      <h2 className="denied-title">Access Restricted</h2>
      <p className="denied-text">
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
    <div className="consent-row">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <label className="consent-label">{label}</label>
    </div>
  );
}
