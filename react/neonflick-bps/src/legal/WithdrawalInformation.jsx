import Header from "../components/Header";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";

export default function TermsAndConditions() {
    const navigate = useNavigate();

  const handleSectionChange = (section) => {
    navigate("/"); // переход на дашборд
    localStorage.setItem("initialSection", section); // можна зберегти, щоб дашборд відкрив потрібну секцію
  };

  return (
    <>
      {/* Header використовується як shared layout */}
      <Header
              activeSection="products" // передамо будь-яку секцію як дефолт
              setActiveSection={handleSectionChange} // кнопки тепер працюють
            />

      <main className="legal-page">
        <p className="h2-withdrawal">Withdrawal Information</p>
        <h1> (EU Consumers)</h1>

        <section className="legal-section">
          <h2>Withdrawal Information (EU Consumers)</h2>
          <p>
            (Applies only to consumers within the European Union)
          </p>
          <p>
            If you are a consumer residing in the European Union, 
            you generally have a statutory right of withdrawal in 
            accordance with Directive 2011/83/EU and the 
            German Civil Code (BGB).
          </p>
        </section>

        <section className="legal-section">
          <h2>Right of Withdrawal</h2>
          <p>
            You have the right to withdraw from a contract within 
            fourteen (14) days without giving any reason.
          </p>
          <p>
            The withdrawal period expires fourteen (14) days from 
            the day of the conclusion of the contract.
          </p>
          <p>
            To exercise your right of withdrawal, you must inform the 
            respective Creator — not the Platform — of your decision to 
            withdraw from the contract by an unequivocal 
            statement.
          </p>
        </section>

        <section className="legal-section">
          <h2>Exclusion of the Right of Withdrawal for Digital Content</h2>
          <p>
            The right of withdrawal does not apply to contracts for 
            the supply of digital content which is not supplied 
            on a tangible medium if:
          </p>
          <ul>
            <li>
                the execution of the contract has begun, and
            </li>
            <li>
                the consumer has expressly consented to the 
                beginning of the execution before the end 
                of the withdrawal period, and
            </li>
            <li>
                the consumer has acknowledged that they thereby 
                lose their right of withdrawal.
            </li>
          </ul>
          <p></p>
          <p>
            By initiating a blockchain transaction and accessing 
            digital content via the Platform, the consumer expressly:
          </p>
          <ul>
            <li>
                consents to the immediate execution of the contract, and
            </li>
            <li>
                acknowledges the loss of the right of withdrawal.
            </li>
          </ul>
          <p></p>
        </section>

        <section className="legal-section">
          <h2>Platform Disclaimer</h2>
          <p>
            The Platform itself is not a contracting party to any purchase 
            agreement and does not grant withdrawals or refunds.
          </p>
          <p>
            All contractual relationships exist exclusively between 
            buyers and Creators.
          </p>
        </section>
      </main>

      <Footer />
    </>
  );
}
