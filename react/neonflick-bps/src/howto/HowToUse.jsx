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
        <h1>How to Use</h1>
        <section className="legal-section">
          <h2>Wallet preparation</h2>
          <p>
            1. Connect your available SOL wallet.
          </p>
          <p>
            2. Make sure that you have at least 0.001 SOL in your wallet. Otherwise, the 
            transaction will be unsuccessful, because the Solana blockchain requires a 
            minimum balance in the wallet.
          </p>
          <p>
            If you need to change your wallet, click on your connected wallet and click "Change wallet". Choose another
            yu want and connect it.
          </p>
          <p>
            To disconnect yout wallet, click on your connected wallet and click "Disconnect". Your wallet will be disconnected.
          </p>
        </section>

        <section className="legal-section">
          <h2>Create a product</h2>
          <p>
            Go to the Create page by clicking "Create" button. Fill the form with all 
            required info about your product. Choose a product duration and write a price in $SOL.
            Click "Create Product" button and your product has published.
          </p>
        </section>

        <section className="legal-section">
          <h2>View your products</h2>
          <p>
            On the Products page you will find all your products that you have created. By clicking the "View"
            button you will see how does the product's payment page look like.
          </p>

          <p>
            By clicking on the "Additional Information" you fill see the next info about the product: 
            Status (new - if your product hasn't received any payments yet, used - if your product 
            has already received at least one payment), Commission, Final Reward (amount that 
            you will receive after the commission), Completed Transactions (number of the payments that you have received)
            and Transaction hashes (the unique transacion's address that shows and proves that the transaction has 
            successfully completed.)
          </p>
          <p>
            To check the transaction's information, your can go to the <a href="https://solscan.io/">"Solscan"</a> webpage 
            and check it on the blockchain.
          </p>
        </section>

        <section className="legal-section">
            <h2>Share your product</h2>
            <p>
                To share your product, click on the "&#8942;" button right from the "View" button and click "Share".
            </p>
        </section>

        <section className="legal-section">
            <h2>Edit your product</h2>
            <p>
                If you need to edit your product, click on the "&#8942;" button right from the "View" button 
                and click "Edit". Change the info you need and click "Save changes"
            </p>
        </section>

        <section className="legal-section">
            <h2>Delete your product</h2>
            <p>
            To delete your product, click on the "&#8942;" button right from the "View" button 
            and click "Delete". Confirm, that you want to remove your product. Your product will be deleted.
          </p>
        </section>
        <section className="legal-section">
            <p>
                If you have a question, you can always reach us:
                <ul>
                    <li>by E-mail: <a href="mailto:neonflickplatform@gmail.com">neonflickplatform@gmail.com</a></li>
                    <li>ask in the "<a href="https://t.me/neonflick_community">Neonflick Community</a>" in Telegram:</li>
                </ul>
            </p>
        </section>
      </main>

      <Footer />
    </>
  );
}
