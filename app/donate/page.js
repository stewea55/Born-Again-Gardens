import Link from "next/link";
import HeroSection from "../../components/HeroSection";
import DonateOptions from "../../components/DonateOptions";

export default function DonatePage() {
  return (
    <>
      <HeroSection
        page="donate"
        title="Support Our Mission"
        subtitle="From the Ground Up Founders Club"
      >
        <div className="button-row">
          <Link className="button" href="#donation-options">
            Give Now
          </Link>
        </div>
      </HeroSection>

      <section className="section card">
        <p className="paragraph">
          The nourishment of a fresh harvest. The healing power of nature. The connection of a
          shared gathering place. …the beauty of a garden.
          <br />
          Do you share this vision?
          <br />
          <br />
          You&apos;re invited to become one of the <strong>first stewards</strong> of it—stepping out
          in faith with us and helping this dream take root <em>from the ground up.</em>
          <br />
          <br />
          The growing season officially begins when the last frost passes.{" "}
          <em>(In Indiana, our average last frost date is May 1.)</em> Until then, any donation made
          to Born Again Gardens secures you a <strong>lifelong place in our From the Ground Up
          Founders Club.</strong>
        </p>

        <h2 className="subheading">What does that mean?</h2>
        <ul className="bullet-list">
          <li className="paragraph">Early, behind-the-scenes updates as the garden takes shape</li>
          <li className="paragraph">
            An invitation to <em>break bread together in the garden</em> —sharing the harvest of
            seeds you helped sow
          </li>
          <li className="paragraph">
            <em>As a thank-you:</em> founders will be entered to win one of two $50 Lululemon gift
            cards <em>(brand chosen with sustainability in mind)</em>
          </li>
          <li className="paragraph">Additional Founders-only events and swag as the garden grows</li>
        </ul>

        <h2 className="subheading">How to join</h2>
        <p className="paragraph">
          Simply contribute a <strong>personally meaningful gift</strong>, and you’re in.
          <br />
          Together, we’ll plant something meant to last.
        </p>

        <p className="paragraph notice">
          <strong>Notice</strong>
          <br />
          Born Again Gardens is 501(c)(3) approved!.
          <br />
          <strong>
            Thank you for standing with us at the very beginning—your early support helps make this
            work possible.
          </strong>
        </p>
      </section>

      <DonateOptions />
    </>
  );
}
