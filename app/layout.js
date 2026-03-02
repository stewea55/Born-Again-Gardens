import "./globals.css";
import { Libre_Baskerville, Poppins, Cormorant_Garamond } from "next/font/google";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getResourceImageUrl } from "../lib/resources";

const libre = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-title"
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-body"
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["italic"],
  variable: "--font-subtitle"
});

export const metadata = {
  title: "Born Again Gardens",
  description: "Born Again Gardens web experience"
};

export default async function RootLayout({ children }) {
  const logoUrl = await getResourceImageUrl("bag_logo");

  return (
    <html lang="en">
      <body className={`${libre.variable} ${poppins.variable} ${cormorant.variable}`}>
        <div className="page">
          <Header logoUrl={logoUrl} />
          <main className="main">
            <div className="container">{children}</div>
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
