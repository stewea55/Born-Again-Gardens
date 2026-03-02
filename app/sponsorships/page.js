import Link from "next/link";
import ImagePlaceholder from "../../components/ImagePlaceholder";
import HeroSection from "../../components/HeroSection";
import { getResourceImageUrl } from "../../lib/resources";

export default async function SponsorshipsPage() {
  const sponsorTiersImageUrl = await getResourceImageUrl("sponsor_tiers");

  return (
    <>
      <HeroSection page="sponsorships" title="Become a Garden Sponsor" />

      <section className="section card">
        <p className="paragraph">
          By becoming a garden sponsor, you help make fresh produce, hands-on education, and
          welcoming green space possible for everyone.
          <br />
          Recognition and involvement opportunities increase with each level of partnership.
        </p>
        <h1 className="title">Limited Time – Become a <strong>Founder</strong></h1>
        <p className="paragraph">
          Organizations who commit to a sponsorship before May 1st will be recognized as Founders
          and invited into the{" "}
          <Link className="link" href="/donate">
            From the Ground Up Founders Club.
          </Link>
        </p>
        {sponsorTiersImageUrl ? (
          <div className="image-placeholder image-placeholder--natural">
            <img src={sponsorTiersImageUrl} alt="Sponsorship tiers" />
          </div>
        ) : (
          <ImagePlaceholder label="sponsor_tiers" />
        )}
      </section>

      <section className="section card">
        <h2 className="subheading">Contact us</h2>
        <p className="paragraph">
          For corporate sponsorship and partnership inquiries, reach out to us.
        </p>
        <p className="paragraph">
          Email:{" "}
          <a className="link" href="mailto:info@bornagaingardens.org">
            info@bornagaingardens.org
          </a>
          <br />
          Phone: <a className="link" href="tel:317-385-4165">317-385-4165</a>
        </p>
      </section>

      <section className="section card">
        <p className="paragraph notice">
          <strong>Notice</strong>
          <br />
          As of 2.14.2026 Born Again Gardens is officially 501(c)(3) certified! Any donations made{" "}
          <strong>will be</strong> tax-deductible. Thank you for standing with us at the very
          beginning—your early support helps make this work possible, and that&apos;s what makes you a
          Founder.
          <br />
          Email info@bornagaingardens.org for more information.
        </p>
      </section>
    </>
  );
}
