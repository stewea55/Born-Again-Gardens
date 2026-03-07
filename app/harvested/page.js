import HeroSection from "../../components/HeroSection";
import Link from "next/link";

export default function HarvestedPage() {
  return (
    <>
      <HeroSection page="harvested" title="Thank you for visiting" />

      <section className="section card">
        <p className="paragraph">
          Thanks for visiting our beautiful garden! Consider{" "}
          <Link className="link" href="/volunteer">
            volunteer opportunities
          </Link>
          .
        </p>
        <p className="paragraph" style={{ marginTop: "1rem" }}>
          <Link className="link" href="/harvest">
            Back to harvest
          </Link>
          {" · "}
          <Link className="link" href="/">
            Home
          </Link>
        </p>
      </section>
    </>
  );
}
