import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="legal-footer">
      <div className="legal-footer__inner">
        <div className="legal-footer__brand">
          <span className="logo-glow">Neonflick-bps</span>
          <span className="legal-footer__copyright">
            © {new Date().getFullYear()} All rights reserved
          </span>
        </div>

        <nav className="legal-footer__links">
          <Link to="/legal/legal_notice">Legal Notice</Link>
          <Link to="/legal/terms">Terms & Conditions</Link>
          <Link to="/legal/privacy">Privacy Policy</Link>
          <Link to="/legal/withdrawal">Withdrawal Information</Link>
          <Link to="/legal/disclaimer">Platform Disclaimer</Link>
          <Link to="/legal/crypto-risks">Crypto Risk Disclosure</Link>
          <Link to="/legal/aml">AML & Abuse Policy</Link>
          <Link to="/howto/payment-instruction">Payment Instruction</Link>
        </nav>
      </div>
    </footer>
  );
}
