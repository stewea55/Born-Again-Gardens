import { readFileSync } from "fs";
import { join } from "path";
import LegalContent from "../../components/LegalContent";

export const metadata = {
  title: "Privacy Policy | Born Again Gardens",
  description: "Privacy policy for Born Again Gardens website."
};

export default function PrivacyPage() {
  const path = join(process.cwd(), "app", "privacy", "content.md");
  let content = "";
  try {
    content = readFileSync(path, "utf-8");
  } catch {
    content = "Privacy policy content is not available.";
  }
  return <LegalContent content={content} />;
}
