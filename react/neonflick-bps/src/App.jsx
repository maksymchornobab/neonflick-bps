import Header from "./components/Header";
import CreateSection from "./components/CreateSection";
import ProductsSection from "./components/ProductsSection";
import "./index.css";

export default function App() {
  return (
    <>
      <Header />
      <main>
        <CreateSection />
        <ProductsSection />
      </main>
    </>
  );
}
