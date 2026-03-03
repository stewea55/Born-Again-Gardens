import { readFileSync } from "fs";
import { join } from "path";
import LegalContent from "../../components/LegalContent";

export const metadata = {
  title: "Terms and Conditions | Born Again Gardens",
  description: "Terms and conditions for use of the Born Again Gardens website."
};

export default function TermsPage() {
  const path = join(process.cwd(), "app", "terms", "content.md");
  let content = "";
  try {
    content = readFileSync(path, "utf-8");
  } catch {
    content = "Terms and conditions content is not available.";
  }
  return <LegalContent content={content} />;
}
