import VolunteerForm from "../../components/VolunteerForm";
import UpcomingEvents from "../../components/UpcomingEvents";
import HeroSection from "../../components/HeroSection";
import { getUpcomingEvents } from "../../lib/upcoming-events";

export default async function VolunteerPage() {
  const events = await getUpcomingEvents();

  return (
    <>
      <HeroSection page="volunteer" title="Dig In" />

      <section className="section card">
        <p className="paragraph">
          Many hands make work light. Are you ready to get yours dirty?
          <br />
          Submit your email below to get notified of volunteer opportunities.
        </p>
        <VolunteerForm label="Email" buttonLabel="Get notified" />
      </section>

      <UpcomingEvents events={events} />
    </>
  );
}
