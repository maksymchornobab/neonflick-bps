import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";

export default function PaymentInstruction() {
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
        <h1>Payment Instructions</h1>
        <section className="legal-section">
          <h2>1. Wallet preparation</h2>
          <p>
            1. Connect your available SOL wallet.
          </p>
          <p>
            2. Make sure that you have at least 0.001 SOL in your wallet. Otherwise, the 
            transaction will be unsuccessful, because the Solana blockchain requires a 
            minimum balance in the wallet.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Review important documents</h2>
          <p>
            Make sure you have read all important documents related to the payment.
            Before you accept all documents related to the payment regulations, please read 
            all information carefully.
          </p>
        </section>

        <section className="legal-section">
          <h2>3. Submit the payment</h2>
          <p>
            Click the "Pay Now" button and sign the transaction in your wallet.
          </p>
        </section>

        <section className="legal-section">
            <h2>4. Important! Verify the transaction</h2>
            <p>
                After the successful transaction, verify it by clicking "Check the transaction".
                To make sure that your transaction was successful, you will see all details related 
                to your payment by clicking the "Check the transaction" button. This is the most
                important proof that you have sent the money to the seller for the product you intended to buy.
            </p>
            
            <p>
                You can also check the transaction directly in your wallet and use the provided option to 
                view it on a blockchain scanner website.
            </p>
        </section>

        <section className="legal-section">
            <h2>5. Important! Download the e-receipt</h2>
            <p>
                After the successful transaction, you will see the "Save e-receipt" button. This is 
                another important way to store all information related to the product and the transaction.
            </p>

            <p>
                After the successful transaction, you will see the "Save e-receipt" button. This is 
                another important way to store all information related to the product and the transaction.
            </p>

            <h2 style={{fontWeight: "bold"}}>Attention!</h2>

            <p>
                Once you close the window containing the "Check the transaction" and "Save e-receipt" 
                buttons, you will no longer be able to download the e-receipt.
            </p>
        </section>

        <section className="legal-section">
            <h2>You can always reach us for help by sending us a message!</h2>
            <p>
            <strong>Email:</strong> <a href="mailto:neonflickplatform@gmail.com">neonflickplatform@gmail.com</a>
          </p>
        </section>
      </main>

      <Footer />
    </>
  );
}
