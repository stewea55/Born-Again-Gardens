import Link from "next/link";
import HeroSection from "../components/HeroSection";
import HomeReadyToVisitCard from "../components/HomeReadyToVisitCard";
import { getPublicSponsorSectionLayout } from "../lib/sponsors";
import DedicateTreePopup from "../components/DedicateTreePopup";
import { getCurrentTreeCampaign } from "../lib/dedicate/campaign";
import { getResourceImageUrl } from "../lib/resources";

export default async function HomePage() {
  const [sponsorSection, campaign, dedicateImage] = await Promise.all([
    getPublicSponsorSectionLayout(),
    getCurrentTreeCampaign(),
    getResourceImageUrl("dedicate_tree")
  ]);
  const sponsors = sponsorSection.sponsors || [];
  const canvas = sponsorSection.canvas || { width: 1000, height: 500 };
  const quantityRemaining = Number(campaign?.quantity_remaining || 0);
  const campaignIsActive = Boolean(campaign?.active) && quantityRemaining > 0;
  const campaignImageUrl = campaign?.image_url || dedicateImage || null;

  return (
    <>
      {campaignIsActive ? (
        <DedicateTreePopup quantityRemaining={quantityRemaining} imageUrl={campaignImageUrl} />
      ) : null}
      <HeroSection
        page="home"
        title="Something is Blooming in our Community"
        subtitle="Take what you need. Pay what you can."
      >
        <p className="paragraph">
          Born Again Gardens stewards land to grow nourishing food, natural beauty, and closer
          community.
        </p>
        <div className="button-row">
          <Link className="button" href="/harvest">
            Harvest
          </Link>
          <Link className="button secondary" href="/donate">
            Donate
          </Link>
        </div>
      </HeroSection>

      <section className="section card">
        <h2 className="subheading">How it Works</h2>
        <p className="paragraph">
          Born Again Gardens operates on a U-Pick honor system. When you visit the garden,
          you&apos;ll use this website to log your{" "}
          <Link className="link" href="/harvest">
            harvest
          </Link>
          .
          <br />
          <br />
          A suggested payment is calculated, but you can enter any payment amount to check out.
          <br />
          <br />
          Paying for what you harvest sustains the garden and our continued mission, but taking
          what you need to feed your family, regardless of payment, is honorable too.
          <br />
          <br />
          <Link className="link" href="/about-us">
            Learn more about what we&apos;re building.
          </Link>
        </p>
      </section>

      <section className="section card">
        <p className="paragraph">
          We are just beginning, and we&apos;re relying on the early support of generous neighbors
          and businesses to make this vision a reality. Learn more about how you can help sow the
          first seeds.
        </p>
        <div className="button-row">
          <Link className="button" href="/donate">
            <em>Support as a generous</em> <strong>neighbor</strong>
          </Link>
          <Link className="button secondary" href="/sponsorships">
            <em>Support as a generous</em> <strong>company</strong>
          </Link>
        </div>
      </section>

      <section className="section card">
        <p className="paragraph">
          Eager to support in a tangible way? checkout our{" "}
          <Link
            className="link"
            href="https://www.myregistry.com/organization/born-again-gardens-cicero-in/5342709"
            target="_blank"
            rel="noreferrer"
          >
            wishlist
          </Link>
        </p>
      </section>

      <section className="section card">
        <p className="paragraph">
          Eager to get your hands dirty?
          <br />
          Sign up to get information on{" "}
          <Link className="link" href="/volunteer">
            volunteer opportunities.
          </Link>
        </p>
      </section>

      <section className="section">
        <h2 className="subheading">Our Generous Sponsors</h2>
        {sponsors.length === 0 ? (
          <p className="paragraph">Sponsors coming soon.</p>
        ) : (
          <div className="sponsor-canvas" style={{ aspectRatio: `${canvas.width} / ${canvas.height}` }}>
            {sponsors.flatMap((sponsor) => {
              const objects = [];
              if (sponsor.layout?.logo) {
                objects.push(
                  <article
                    key={`${sponsor.id}-logo`}
                    className="sponsor-canvas-object sponsor-canvas-logo-object"
                    style={{
                      left: `${(sponsor.layout.logo.centerX / canvas.width) * 100}%`,
                      top: `${(sponsor.layout.logo.centerY / canvas.height) * 100}%`,
                      width: `${(sponsor.layout.logo.width / canvas.width) * 100}%`,
                      height: `${(sponsor.layout.logo.height / canvas.height) * 100}%`
                    }}
                  >
                    {sponsor.logo ? (
                      <img
                        src={sponsor.logo}
                        alt={sponsor.company_name || "Sponsor logo"}
                        className="sponsor-canvas-logo"
                      />
                    ) : (
                      <div className="image-placeholder">No logo yet</div>
                    )}
                  </article>
                );
              }

              if (sponsor.layout?.name) {
                objects.push(
                  <article
                    key={`${sponsor.id}-name`}
                    className="sponsor-canvas-object sponsor-canvas-name-object"
                    style={{
                      left: `${(sponsor.layout.name.centerX / canvas.width) * 100}%`,
                      top: `${(sponsor.layout.name.centerY / canvas.height) * 100}%`,
                      width: `${(sponsor.layout.name.width / canvas.width) * 100}%`,
                      height: `${(sponsor.layout.name.height / canvas.height) * 100}%`
                    }}
                  >
                    <h3 className="subtitle" style={{ fontSize: `${sponsor.layout.name.fontSize}px` }}>
                      {sponsor.company_name || "Sponsor"}
                    </h3>
                  </article>
                );
              }

              return objects;
            })}
          </div>
        )}
      </section>

      <HomeReadyToVisitCard />
    </>
  );
}
