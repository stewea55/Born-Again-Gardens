import HeroSection from "../../components/HeroSection";
import CartClient from "../../components/CartClient";

export default function CartPage() {
  return (
    <>
      <HeroSection page="shop" title="Cart" />
      <CartClient />
    </>
  );
}
