import { Suspense } from "react";
import HeroSection from "../../../components/HeroSection";
import PaymentReturnClient from "../../../components/PaymentReturnClient";

export default function PaymentReturnPage() {
  return (
    <>
      <HeroSection page="donate" title="Payment" />
      <Suspense fallback={<section className="section card"><p className="paragraph">Loading…</p></section>}>
        <PaymentReturnClient />
      </Suspense>
    </>
  );
}
