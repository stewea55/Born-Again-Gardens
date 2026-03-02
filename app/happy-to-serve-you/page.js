import VolunteerForm from "../../components/VolunteerForm";
import HeroSection from "../../components/HeroSection";

export default function HappyToServeYouPage() {
  return (
    <>
      <HeroSection
        page="happy-to-serve-you"
        title="We are so glad you were able to take what you need."
      />

      <section className="section card">
        <p className="paragraph">
          If your financial situation changes and you&apos;re able to pay for your harvest in the
          future, <em>even if it&apos;s not the full amount,</em> we urge you to do so. Remember: our
          garden operates on <strong>trust, love, and honor.</strong>
          <br />
          <br />
          Until then, consider volunteering your time! Enter your email to get notified for
          volunteer opportunities.
        </p>
        <VolunteerForm label="Your email" buttonLabel="Get notified" />
      </section>
    </>
  );
}
