import { readFileSync } from "fs";
import { join } from "path";
import LegalContent from "../../components/LegalContent";

export const metadata = {
  title: "Cookie Policy | Born Again Gardens",
  description: "Cookie policy for Born Again Gardens website."
};

export default function CookiesPage() {
  const path = join(process.cwd(), "app", "cookies", "content.md");
  let content = "";
  try {
    content = readFileSync(path, "utf-8");
  } catch {
    content = "Cookie policy content is not available.";
  }
  return <LegalContent content={content} />;
}
