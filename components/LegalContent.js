/**
 * Renders legal document content (plain text with simple structure).
 * - Lines like "1. Section title" become section headings.
 * - Other blocks become paragraphs. URLs in text become clickable links.
 */
function linkify(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) =>
    part.match(urlRegex) ? (
      <a key={i} href={part} target="_blank" rel="noreferrer">
        {part}
      </a>
    ) : (
      part
    )
  );
}

export default function LegalContent({ content }) {
  if (!content || typeof content !== "string") return null;

  const blocks = content.split(/\n\n+/).filter((b) => b.trim());
  const elements = [];

  blocks.forEach((block, i) => {
    const trimmed = block.trim();
    const singleLine = trimmed.includes("\n") === false;
    const headingMatch = singleLine && trimmed.match(/^(\d+)\.\s+(.+)$/);

    if (headingMatch) {
      elements.push(
        <h2 key={i} className="legal-title">
          {trimmed}
        </h2>
      );
    } else {
      const paragraphs = trimmed.split("\n").filter((p) => p.trim());
      paragraphs.forEach((p, j) => {
        elements.push(
          <p key={`${i}-${j}`}>{linkify(p.trim())}</p>
        );
      });
    }
  });

  return <div className="legal-page">{elements}</div>;
}
