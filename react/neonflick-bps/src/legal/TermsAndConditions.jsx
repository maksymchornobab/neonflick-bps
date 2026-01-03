import Header from "../components/Header";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";

export default function TermsAndConditions() {
  const navigate = useNavigate();

  const handleSectionChange = (section) => {
    navigate("/");
    localStorage.setItem("initialSection", section);
  };

  return (
    <>
      {/* Header використовується як shared layout */}
      <Header
              activeSection="products"
              setActiveSection={handleSectionChange}
            />

      <main className="legal-page">
        <h1>Terms & Conditions</h1>
        <p className="legal-updated">Last updated: 3 January 2026</p>

        <section className="legal-section">
          <h2>1. Scope of Application</h2>
          <p>
            These Terms & Conditions ("Terms") govern the use of the
            Neonflick-bps ("Platform", "we", "us", "our") operated by
            <strong> Maksym Chornobab</strong>, acting as an individual.
          </p>
          <p>
            By accessing or using the Neonflick-bps, you agree to be bound by these
            Terms.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. The Neonflick-bps Role & Disclaimer</h2>
          <p>
            The Neonflick-bps acts exclusively as a <strong>technical service
            provider</strong>.
          </p>
          <p>The Neonflick-bps is NOT:</p>
          <ul>
            <li>the seller of digital products,</li>
            <li>a contracting party between users,</li>
            <li>a payment service provider,</li>
            <li>a custodian of funds,</li>
            <li>a financial intermediary.</li>
          </ul>
          <p>
            All products are created, published, and sold directly by
            independent users ("Creators"). The Neonflick-bps only provides technical
            infrastructure and blockchain-based transaction facilitation.
          </p>
        </section>

        <section className="legal-section">
          <h2>3. Users & Accounts</h2>
          <p>
            Users may browse the Neonflick-bps without registration or connect a
            compatible cryptocurrency wallet to interact with the Neonflick-bps.
          </p>
          <p>
            The Neonflick-bps does not store private keys, seed phrases, or wallet
            credentials.
          </p>
          <p>
            Users are solely responsible for wallet security and all
            transactions executed from their wallet.
          </p>
        </section>

        <section className="legal-section">
          <h2>4. Products & Content</h2>
          <p>
            Creators are fully responsible for the legality, accuracy, and
            compliance of their products and content.
          </p>
          <p>
            The Neonflick-bps does not guarantee the legality or quality of products
            offered by Creators and does not perform prior moderation unless
            required by law.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Payments & Cryptocurrency Transactions</h2>
          <p>
            All payments are executed exclusively in cryptocurrency (SOL) via
            the Solana blockchain.
          </p>
          <ul>
            <li>Cryptocurrency transactions are irreversible.</li>
            <li>The Neonflick-bps cannot reverse or refund transactions.</li>
            <li>Blockchain execution occurs outside the Neonflick-bps’s control.</li>
          </ul>
          <p>
            Any disputes regarding payments must be resolved directly between
            buyers and Creators.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Fees</h2>
          <p>
            The Neonflick-bps charges a service fee solely for providing technical 
            infrastructure and marketplace functionality.
          </p>
          <p>
            Neonflick-bps does not provide payment services, does not act as a 
            financial intermediary, and does not take custody of user funds.
          </p>
          <p>
            All payments are executed directly on the Solana blockchain between 
            users via decentralized smart contracts.
          </p>
          <p>
            Applicable fees are clearly disclosed prior to product creation and 
            prior to transaction execution.
          </p>
          <p>
            Neonflick-bps is not responsible for blockchain network performance, 
            transaction finality, or transaction fees imposed by the Solana network.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Refunds & Right of Withdrawal</h2>
          <p>
            Due to the nature of digital content and irreversible blockchain
            transactions, refunds are generally excluded.
          </p>
          <p>The Neonflick-bps itself does not grant refunds.</p>
        </section>

        <section className="legal-section">
            <h2>8. Consumer Notice (EU Law)</h2>
            <p>
             The Neonflick-bps operates exclusively as a technical intermediary 
             and marketplace infrastructure.
            </p>

            <p>
             Any contract for the purchase of digital products is concluded 
             directly between the buyer and the respective Creator.
             The Neonflick-bps is not a contracting party to any agreement between 
             users and does not act as a seller, reseller, agent, or 
             representative of Creators.
             </p>
            <p>
             Accordingly, any rights, claims, or disputes arising from the 
             purchase of a product — including but not limited to defects, 
             non-performance, misleading information, or legal compliance — 
             must be asserted directly against the Creator.
            </p>
        </section>

        <section className="legal-section">
            <h2>9. No Right of Withdrawal (Digital Content – §356 BGB)</h2>
            <p>
             In accordance with §356 (5) of the German Civil Code (BGB), 
             the right of withdrawal does not apply to digital content 
             that is not supplied on a physical medium once the execution 
             of the contract has begun.
            </p>
            <p>
             By initiating a blockchain-based transaction and receiving 
             access to digital content, the user expressly agrees that:
            </p>
            <ul>
                <li>the execution of the contract begins immediately, and</li>
                <li>the right of withdrawal is thereby forfeited.</li>
            </ul>
            <p></p>
            <p>
                Due to the irreversible nature of blockchain transactions, 
                withdrawals, cancellations, or refunds are technically and 
                legally excluded once the transaction has been executed.
            </p>

        </section>

        <section className="legal-section">
          <h2>10. Liability Limitation</h2>
          <p>
            To the maximum extent permitted by German law, the Neonflick-bps is not
            liable for:
          </p>
          <ul>
            <li>loss of funds due to user error,</li>
            <li>smart contract vulnerabilities,</li>
            <li>blockchain network failures,</li>
            <li>third-party wallet malfunctions,</li>
            <li>illegal or defective products by Creators.</li>
          </ul>
          <p></p>
          <p>
            Liability is limited to intent and gross negligence.
          </p>
        </section>

        <section className="legal-section">
          <h2>11. Availability & Changes</h2>
          <p>
            The Neonflick-bps is provided "as is" and "as available". We reserve the
            right to modify, suspend, or discontinue parts of the Neonflick-bps and
            update these Terms at any time.
          </p>
        </section>

        <section className="legal-section">
          <h2>12. Governing Law & Jurisdiction</h2>
          <p>
            These Terms are governed by the laws of the Federal Republic of
            Germany. Jurisdiction, where legally permissible, is Germany.
          </p>
        </section>

        <section className="legal-section">
          <h2>13. Contact</h2>
          <p>
            Email:{" "}
            <a href="mailto:neonflickplatform@gmail.com">
              neonflickplatform@gmail.com
            </a>
          </p>
        </section>
      </main>

      <Footer />
    </>
  );
}
