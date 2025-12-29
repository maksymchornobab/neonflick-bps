import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";

export default function LegalNotice() {
  const navigate = useNavigate();

  const handleSectionChange = (section) => {
    navigate("/"); // переход на дашборд
    localStorage.setItem("initialSection", section); // можна зберегти, щоб дашборд відкрив потрібну секцію
  };

  return (
    <>
      <Header
        activeSection="products" // передамо будь-яку секцію як дефолт
        setActiveSection={handleSectionChange} // кнопки тепер працюють
      />

      <main className="legal-page">
        <h1>Crypto Risk Disclosure</h1>
        <section className="legal-section">
          <h2>Crypto Risk Disclosure</h2>
          <p>
            The Neonflick-bps involves the use of cryptocurrency and blockchain technology, 
            which carry inherent risks.
          </p>

          <p className="p-risks">
            By using the Neonflick-bps, you acknowledge, understand, and accept the following risks:
          </p>
        </section>

        <section className="legal-section">
          <h2>Market & Value Risks</h2>
          <ul>
            <li>Cryptocurrencies are highly volatile.</li>
            <li>The value of digital assets may fluctuate 
                significantly and unpredictably.
            </li>
            <li>Users may experience partial or total loss of funds.</li>
          </ul>
          <p></p>
          <p>
            The Neonflick-bps does not guarantee any value, stability, or 
            performance of cryptocurrencies.
          </p>
        </section>

        <section className="legal-section">
          <h2>Irreversibility of Transactions</h2>
          <ul>
            <li>All cryptocurrency transactions are final and irreversible.</li>
            <li>Once a transaction is submitted to the blockchain, it cannot 
                be reversed, canceled, or refunded.
            </li>
            <li>Incorrect wallet addresses or transaction errors may result 
                in permanent loss of assets.
            </li>
          </ul>
        </section>

        <section className="legal-section">
            <h2>Technical & Network Risks</h2>
            <p>
                Use of blockchain technology may involve risks including, 
                but not limited to:
            </p>
            <ul>
                <li>network congestion or failures,</li>
                <li>protocol upgrades, forks, or attacks,</li>
                <li>smart contract bugs or vulnerabilities,</li>
                <li>unexpected transaction delays or failures.</li>
            </ul>
            <p></p>
            <p>
                The Neonflick-bps has no control over the Solana blockchain or its operation.
            </p>
        </section>

        <section className="legal-section">
            <h2>Third-Party Wallets & Infrastructure</h2>
            <ul>
                <li>The Neonflick-bps does not provide or control cryptocurrency wallets.</li>
                <li>Users rely on third-party wallet providers and infrastructure 
                    at their own risk.
                </li>
                <li>Wallet malfunctions, hacks, or loss of access are not the 
                    responsibility of the Neonflick-bps.
                </li>
            </ul>
        </section>

        <section className="legal-section">
            <h2>Regulatory & Legal Risks</h2>
            <ul>
                <li>Cryptocurrency regulations vary by jurisdiction and may change 
                    at any time.
                </li>
                <li>Certain features of the Neonflick-bps may be restricted or 
                    prohibited in some countries.
                </li>
                <li>Users are solely responsible for ensuring that their use of 
                    the Neonflick-bps complies with applicable laws.
                </li>
            </ul>
        </section>

        <section className="legal-section">
            <h2>No Financial Advice</h2>
            <p>
                The Neonflick-bps does not provide financial, investment, tax, or legal advice.
            </p>
            <p>
                Nothing on the Neonflick-bps constitutes a recommendation, endorsement, or 
                solicitation to engage in cryptocurrency transactions.
            </p>
            <p>
                Users should assess their financial situation and risk tolerance before 
                engaging in cryptocurrency transactions.
            </p>
        </section>
      </main>

      <Footer />
    </>
  );
}
