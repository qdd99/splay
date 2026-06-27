// Renders text with fuzzy-matched character indices wrapped in <mark>. The
// highlight color comes from the inherited --accent custom property (see app.css).
export function HighlightedText({
  text,
  indices,
}: {
  text: string;
  indices: number[] | null;
}) {
  if (!indices || indices.length === 0) {
    return <span className="hl-text">{text}</span>;
  }

  const set = new Set(indices);
  const parts: { text: string; hl: boolean }[] = [];
  let run = '';
  let inHL = false;

  for (let i = 0; i < text.length; i++) {
    const isHL = set.has(i);
    if (isHL !== inHL && run) {
      parts.push({ text: run, hl: inHL });
      run = '';
    }
    run += text[i];
    inHL = isHL;
  }
  if (run) parts.push({ text: run, hl: inHL });

  return (
    <span className="hl-text">
      {parts.map((p, i) =>
        p.hl ? <mark key={i}>{p.text}</mark> : <span key={i}>{p.text}</span>,
      )}
    </span>
  );
}
