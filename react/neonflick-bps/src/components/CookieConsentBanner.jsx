import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function CookieConsentModal() {
  const [showModal, setShowModal] = useState(false);
  const [declined, setDeclined] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) setShowModal(true);
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookieConsent", "true");
    setShowModal(false);
  };

  const declineCookies = () => {
    setDeclined(true);
  };

  if (!showModal && !declined) return null;

  if (declined) {
    return (
      <div className="cookie-decline-overlay">
        <h1>We're Sorry</h1>
        <p>
          Due to legal requirements, we cannot provide access to our platform without your consent for localStorage usage.
        </p>
      </div>
    );
  }

  return (
    <div className="cookie-modal-backdrop">
      <div className="cookie-modal">
        <h2 className="cookie-h2">Consent Required</h2>
        <p>
          We use localStorage to manage sessions and improve your experience. 
          Please review our{" "}
          <Link to="/legal/privacy" className="cookie-link">Privacy Policy</Link>.
        </p>
        <div className="cookie-buttons">
          <button className="cookie-accept" onClick={acceptCookies}>Accept</button>
          <button className="cookie-decline" onClick={declineCookies}>Decline</button>
        </div>
      </div>
    </div>
  );
}
