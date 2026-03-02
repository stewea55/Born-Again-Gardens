import Link from "next/link";
import ImagePlaceholder from "../../components/ImagePlaceholder";
import HeroSection from "../../components/HeroSection";
import { getResourceImageUrl } from "../../lib/resources";

export default async function AboutUsPage() {
  const [lydiaImageUrl, sterlingImageUrl, caitieImageUrl, kimImageUrl, christiImageUrl] =
    await Promise.all([
      getResourceImageUrl("lydia_image"),
      getResourceImageUrl("sterling_image"),
      getResourceImageUrl("caitie_image"),
      getResourceImageUrl("kim_image"),
      getResourceImageUrl("christi_image")
    ]);

  return (
    <>
      <HeroSection page="about-us" title="Cultivating Gardens of New Life" />

      <section className="section card">
        <p className="paragraph">
          Born Again Gardens is a vibrant new nonprofit cultivating abundance and provision by
          bringing new life to unused church land. Beginning in Hamilton County, IN, we create
          beautiful gardens where people can harvest affordable produce.
          <br />
          <br />
          We believe gardens should be places of beauty, healing, and provision. They invite awe,
          restore wellness, and reconnect us—to the land, to one another, and to our Creator.
          <br />
          <br />
          We are just beginning, and you&apos;re invited to help{" "}
          <Link className="link" href="/donate">
            <em>
              <strong>Sow the First Seeds</strong>
            </em>
          </Link>
          .
        </p>
      </section>

      <section className="section card">
        <h1 className="title">What we&apos;re building</h1>
        <p className="paragraph">
          These gardens are thoughtfully designed and carefully tended to be abundant, beautiful,
          spacious, and educational.
        </p>
        <p className="subtitle">(Think: farm / park / art installation / home ec class)</p>
        <p className="paragraph">
          They are places for neighbors to
          <br />
          gather, harvest, play, learn, &amp; rejuvenate.
          <br />
          <br />
          <strong>The ways gardens were always meant to be.</strong>
        </p>
      </section>

      <section className="section card">
        <h1 className="title">Why It Matters</h1>
        <ul className="bullet-list">
          <li className="paragraph">
            <strong>
              <em>Church land is often underutilized.</em>
            </strong>{" "}
            Much of it remains lawn—requiring time and money to maintain—while holding the potential
            to be stewarded as a source of nourishment, beauty, and blessing.
          </li>
          <li className="paragraph">
            <strong>
              <em>Truly fresh produce is becoming rare.</em>
            </strong>{" "}
            Store-bought food is often far removed from harvest and grown with heavy chemical
            inputs, reducing its nutritional value.
          </li>
          <li className="paragraph">
            <strong>
              <em>We’re missing nature’s medicine.</em>
            </strong>{" "}
            Regular time in gardens and green spaces is proven to lower stress hormones and blood
            pressure while improving mental health and immune function.
          </li>
          <li className="paragraph">
            <strong>
              <em>Foundational wisdom is being lost.</em>
            </strong>{" "}
            Most of this generation was never taught the skills that were once passed down—how to
            grow food, steward land, and nourish our body.
          </li>
        </ul>
      </section>

      <section className="section">
        <h2 className="subheading">Meet our team</h2>
        <div className="section card">
          <div className="two-column">
            <div>
              {lydiaImageUrl ? (
                <div className="image-placeholder">
                  <img src={lydiaImageUrl} alt="Lydia Weatherford" />
                </div>
              ) : (
                <ImagePlaceholder label="lydia_image" />
              )}
              <p className="paragraph">
                <strong>Lydia Weatherford</strong>
                <br />
                Founder
                <br />
                Executive Director
              </p>
            </div>
            <div>
              {sterlingImageUrl ? (
                <div className="image-placeholder">
                  <img src={sterlingImageUrl} alt="Sterling Weatherford" />
                </div>
              ) : (
                <ImagePlaceholder label="sterling_image" />
              )}
              <p className="paragraph">
                <strong>Sterling Weatherford</strong>
                <br />
                Founder
                <br />
                Board President
              </p>
            </div>
          </div>
          <p className="paragraph">
            Lydia (a Marketing &amp; Writing professional) and Sterling (an Engineer and former NFL
            Player) are a married pair of Cicero natives, who have grown in their love of the Lord,
            their passion for wellness, and their excitement for gardening over the course of their
            relationship, and they are thrilled to be bringing that love to their cherished
            community.
          </p>
        </div>

        <div className="section card">
          <div className="team-card">
            <div>
              {caitieImageUrl ? (
                <div className="image-placeholder">
                  <img src={caitieImageUrl} alt="Caitie Gehlhausen-Walsh" />
                </div>
              ) : (
                <ImagePlaceholder label="caitie_image" />
              )}
              <p className="paragraph">
                <strong>Caitie Gehlhausen-Walsh</strong>
                <br />
                Board Member
                <br />
                While playing golf at High Point University, Caitie invented her first product,
                Lock-It, which is currently sold in Walmart, Meijer, and online. Her second
                business, a product line of stadium purses called “Caitie G Bags”, is seeing great
                success as well. Caitie volunteers at her church, and now lends her entrepreneurial
                mentorship to our mission.
              </p>
            </div>
            <div>
              {kimImageUrl ? (
                <div className="image-placeholder">
                  <img src={kimImageUrl} alt="Kim Standeford" />
                </div>
              ) : (
                <ImagePlaceholder label="kim_image" />
              )}
              <p className="paragraph">
                <strong>Kim Standeford</strong>
                <br />
                Board Member
                <br />
                Kim is a CPA, who switched from public to private accounting in 2026. Her hobbies
                include riding her horses and tending her huge garden that feeds her family.
                <br />
                Fun fact: This photo was taken on a trip to Kenya, after traveling to Egypt for a
                family wedding.
              </p>
            </div>
            <div>
              {christiImageUrl ? (
                <div className="image-placeholder">
                  <img src={christiImageUrl} alt="Christi Vitales" />
                </div>
              ) : (
                <ImagePlaceholder label="christi_image" />
              )}
              <p className="paragraph">
                <strong>Christi Vitales</strong>
                <br />
                Board Member
                <br />
                Christi has a business degree and over 20 years of professional experience managing
                corporate accounts, processes, people, &amp; business operations, but her favorite
                role is Mom. Since retiring she has become an avid volunteer serving a wide variety
                of opportunities in her local church, school, community non-profit organizations, and
                abroad. In recent years, nutrition education as a foundation of healthcare has
                become a growing interest.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
