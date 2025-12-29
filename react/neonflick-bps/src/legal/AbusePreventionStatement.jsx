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
        <h1>AML / Abuse Prevention Statement</h1>
        <section className="legal-section">
          <h2>Anti-Money Laundering (AML) & Abuse Prevention Statement</h2>
          <p>
            The Neonflick-bps is committed to preventing money laundering, terrorist 
            financing, fraud, abuse, and other illegal activities.
          </p>
          <p className="p-risks">By using the Neonflick-bps, users agree to comply with this AML & Abuse Prevention Statement.</p>
        </section>

        <section className="legal-section">
          <h2>Monitoring & Detection</h2>
          <p>
            The Neonflick-bps reserves the right to:
          </p>
          <ul>
            <li>monitor platform activity for suspicious or abusive behavior,</li>
            <li>analyze transactions, wallet interactions, and usage patterns,</li>
            <li>apply automated or manual checks where legally permitted.</li>
          </ul>
          <p></p>
          <p>
            The Neonflick-bps does not guarantee continuous monitoring and does not act 
            as a regulated financial institution.
          </p>
        </section>

        <section className="legal-section">
          <h2>Prohibited Activities</h2>
          <p>
            The following activities are strictly prohibited:
          </p>
          <ul>
            <li>money laundering or terrorist financing,</li>
            <li>use of the Neonflick-bps for illegal goods or services,</li>
            <li>fraud, scams, or deceptive practices,</li>
            <li>circumvention of platform fees or technical safeguards,</li>
            <li>use of stolen, compromised, or sanctioned wallets,</li>
            <li>abuse of blockchain or smart contract mechanisms.</li>
          </ul>
        </section>
        
        <section className="legal-section">
            <h2>Enforcement Measures</h2>
            <p>In case of suspected violation, the Neonflick-bps reserves the right to:</p>
            <ul>
                <li>suspend or permanently block user access,</li>
                <li>remove or disable products or content,</li>
                <li>reject or invalidate transactions where technically possible,</li>
                <li>restrict access without prior notice,</li>
                <li>terminate user relationships immediately.</li>
            </ul>
            <p></p>
            <p>No compensation is owed for enforcement actions.</p>
        </section>
        
        <section className="legal-section">
            <h2>Cooperation with Authorities</h2>
            <p>Where required by applicable law, the Neonflick-bps may:</p>
            <ul>
                <li>cooperate with law enforcement, regulatory, or judicial authorities,</li>
                <li>disclose relevant user or transaction data,</li>
                <li>comply with lawful requests, subpoenas, or court orders.</li>
                <p></p>
                <p>Such cooperation may occur without prior user notification, 
                    where legally permitted.
                </p>
            </ul>
        </section>
        
        <section className="legal-section">
            <h2>Non-Custodial Limitation</h2>
            <p>
                The Neonflick-bps operates as a non-custodial technical service provider 
                and does not control user funds.
            </p>
            <p>As a result:</p>
            <ul>
                <li>The Neonflick-bps cannot freeze blockchain assets,</li>
                <li>enforcement actions are limited to platform-level access and visibility.</li>
            </ul>
        </section>
        
        <section className="legal-section">
            <h2>User Responsibility</h2>
            <p>
                Users are solely responsible for:
            </p>
            <ul>
                <li>ensuring lawful use of the Neonflick-bps,</li>
                <li>complying with local AML, tax, and financial regulations,</li>
                <li>verifying the legality of their products, transactions, and activities.</li>
            </ul>
            </section>
      </main>

      <Footer />
    </>
  );
}
