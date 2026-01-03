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
        <h1>Legal Notice</h1>
        <section className="legal-section">
          <h2>The Neonflick-bps Operator</h2>
          <p>
            <strong>Name:</strong> Maksym Chornobab
            <br />
            <strong>Legal Form:</strong> Individual
            <br />
            <strong>Address:</strong> Leinfelderstraße 7, 84034 Landshut, Germany
          </p>
        </section>

        <section className="legal-section">
          <h2>Contact Information</h2>
          <p>
            <strong>Email:</strong> <a href="mailto:neonflickplatform@gmail.com">neonflickplatform@gmail.com</a>
            <br />
            <strong>Website:</strong> <a href="https://yourplatform.com">https://yourplatform.com</a>
          </p>
        </section>

        <section className="legal-section">
          <h2>Jurisdiction</h2>
          <p>
            This platform operates under the laws of Germany. All disputes arising
            from the use of this website are subject to German jurisdiction.
          </p>
        </section>
      </main>

      <Footer />
    </>
  );
}
