import type { Format } from "@/lib/markdown-editor";

export function ToolbarIcon({ kind }: { kind: Format | "image" }) {
  const letters = {
    bold: <strong>B</strong>,
    italic: <em>I</em>,
    underline: <u>U</u>,
    strike: <s>S</s>,
    heading: <>H₂</>,
    subheading: <>H₃</>,
    quote: <>❞</>,
    code: <>&lt;&gt;</>,
    codeblock: <>{"{ }"}</>,
  };
  if (kind in letters)
    return <span className="toolbar-letter" aria-hidden="true">{letters[kind as keyof typeof letters]}</span>;
  const paths = {
    link: <><path d="m10 13 4-4M8 15l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0M13 5l1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0" /></>,
    bullet: <><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" /><path d="M9 6h11M9 12h11M9 18h11" /></>,
    number: <><path d="M3 4h1v5M3 9h3M3 14c0-2 3-2 3 0 0 1-3 3-3 4h3M10 6h10M10 12h10M10 18h10" /></>,
    source: <><path d="M4 3h10l5 5v5M14 3v5h5M4 3v18h7M8 8h3M8 12h5M8 16h2M15 17l2-2a2 2 0 0 1 3 3l-2 2M17 18l-2 2a2 2 0 0 1-3-3l2-2" /></>,
    rule: <path d="M3 12h18" />,
    table: <><rect x="3" y="4" width="18" height="16" rx="1" /><path d="M3 9h18M3 14h18M9 4v16M15 4v16" /></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="1" /><circle cx="8" cy="8" r="2" /><path d="m3 18 6-6 4 4 3-3 5 5" /></>,
  };
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[kind as keyof typeof paths]}</svg>;
}
