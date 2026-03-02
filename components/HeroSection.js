import { getHeroImageForPage } from "../lib/hero-images";

export default async function HeroSection({ page, title, subtitle, children, imageUrl: imageUrlProp }) {
  const fromPage = await getHeroImageForPage(page);
  const imageUrl = imageUrlProp ?? fromPage.imageUrl;
  const { color } = fromPage;
  const hasBackground = Boolean(imageUrl || color);
  const style = {};

  if (imageUrl) {
    style.backgroundImage = `url(${imageUrl})`;
  } else if (color) {
    style.backgroundColor = color;
  }

  const isVolunteer = page === "volunteer";
  const content = (
    <div className="hero-content">
      <h1 className="title">{title}</h1>
      {subtitle && <p className="subtitle">{subtitle}</p>}
      {children}
    </div>
  );

  return (
    <section className={`section hero ${hasBackground ? "hero-background" : ""}`} style={style}>
      <div className="hero-overlay">
        {isVolunteer ? (
          <div className="hero-contrast">{content}</div>
        ) : (
          content
        )}
      </div>
    </section>
  );
}
