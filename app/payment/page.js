import HeroSection from "../../components/HeroSection";
import PaymentClient from "../../components/PaymentClient";

export default function PaymentPage() {
  return (
    <>
      <HeroSection page="donate" title="Payment" />
      <PaymentClient />
    </>
  );
}
