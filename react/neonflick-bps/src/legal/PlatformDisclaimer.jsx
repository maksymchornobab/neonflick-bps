import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";

export default function LegalNotice() {
  const navigate = useNavigate();

  const handleSectionChange = (section) => {
    navigate("/");
    localStorage.setItem("initialSection", section);
  };

  return (
    <>
      <Header
        activeSection="products"
        setActiveSection={handleSectionChange}
      />

      <main className="legal-page">
        <h1>The Neonflick-bps Disclaimer</h1>
        <section className="legal-section">
          <h2>The Neonflick-bps Disclaimer</h2>
          <p>
            The Neonflick-bps is provided on an “as is” and “as available” basis.
          </p>
        </section>

        <section className="legal-section">
          <h2>No Guarantees</h2>
          <p>
            The Neonflick-bps makes no representations or warranties, express or 
            implied, including but not limited to:
            </p>
            <ul>
                <li>availability, uptime, or uninterrupted operation,</li>
                <li>accuracy, completeness, or reliability of content,</li>
                <li>suitability of the Neonflick-bps for any particular purpose,</li>
                <li>success, profitability, or legality of any product or transaction.</li>
            </ul>
            <p></p>
            <p>
                Use of the Neonflick-bps is at the user’s own risk.
            </p>

        </section>

        <section className="legal-section">
          <h2>No Liability for User Actions</h2>
          <p>
            The Neonflick-bps is not responsible for:
          </p>
          <ul>
            <li>actions or omissions of users or Creators,</li>
            <li>misuse of the Neonflick-bps,</li>
            <li>
                unlawful, misleading, or defective content 
                published by Creators,
                </li>
            <li>
                violations of applicable laws by users, including consumer, 
                tax, or intellectual property laws.
            </li>
          </ul>
          <p></p>
          <p>
            Creators are solely responsible for compliance with all 
            applicable laws and regulations.
          </p>
        </section>

        <section className="legal-section">
            <h2>Technical & Blockchain Risks</h2>
            <p>
                The Neonflick-bps does not guarantee and is not liable for:
            </p>
            <ul>
                <li>blockchain network congestion, failures, forks, or outages,</li>
                <li>smart contract vulnerabilities or unexpected behavior,</li>
                <li>failed, delayed, or incorrectly executed transactions,</li>
                <li>loss of funds due to incorrect wallet addresses or user error,</li>
                <li>third-party wallet or infrastructure failures.</li>
            </ul>
            <p></p>
            <p>
                Blockchain transactions occur outside the Neonflick-bps’s control and are irreversible.
            </p>

        </section>

        <section className="legal-section">
            <h2>Limitation of Liability</h2>
            <p>
                To the maximum extent permitted by applicable law, the Neonflick-bps shall not be liable for any:
            </p>
            <ul>
                <li>indirect, incidental, consequential, or special damages,</li>
                <li>loss of profits, data, reputation, or business opportunities.</li>
            </ul>
            <p></p>
            <p>
                Liability is limited to cases of intent and gross negligence.
            </p>
            <p>
                Mandatory statutory liability, including liability for personal injury, remains unaffected.
            </p>
            </section>

            <section className="legal-section">
            <h2>No Fiduciary or Advisory Role</h2>
            <p>
                The Neonflick-bps does not provide legal, financial, tax, or investment advice.
                Nothing on the Neonflick-bps constitutes professional advice or a recommendation.
            </p>
            </section>
      </main>

      <Footer />
    </>
  );
}
