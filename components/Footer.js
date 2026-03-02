import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div>
            <p className="subtitle">
              “I am the true grapevine, and my Father is the gardener. [...] Those who remain
              in me, and I in them, will produce much fruit. For apart from me you can do
              nothing.” John 15:1-5
            </p>
          </div>
          <div>
            <div className="paragraph">
              <Link href="/about-us">About Us</Link>
              <br />
              <Link href="/harvest">Harvest Now</Link>
              <br />
              <a
                href="https://www.instagram.com/bornagain_gardens/"
                target="_blank"
                rel="noreferrer"
              >
                Instagram
              </a>
              <br />
              <a
                href="https://www.facebook.com/profile.php?id=61585100865527"
                target="_blank"
                rel="noreferrer"
              >
                Facebook
              </a>
              <br />
              info@bornagaingardens.org
            </div>
          </div>
        </div>
        <div className="footer-note">
          <p className="paragraph">
            Born Again Gardens is an independent 501(c)(3) nonprofit organization. While we
            partner with local churches, we are not owned by or formally affiliated with any
            single church.
          </p>
          <p className="paragraph">
            © 2026 Born Again Gardens, Inc. All Rights Reserved. Design &amp; Development by Sterling Levi LLC
          </p>
        </div>
      </div>
    </footer>
  );
}
