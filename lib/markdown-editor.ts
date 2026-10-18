export const formattingTools = [
  ["bold", "Bold"],
  ["italic", "Italic"],
  ["underline", "Underline"],
  ["strike", "Strikethrough"],
  ["heading", "Heading"],
  ["subheading", "Subheading"],
  ["link", "Link"],
  ["quote", "Quote"],
  ["bullet", "Bullet list"],
  ["number", "Numbered list"],
  ["task", "Checklist"],
  ["code", "Inline code"],
  ["codeblock", "Code block"],
  ["rule", "Divider"],
  ["table", "Table"],
] as const;
export type Format = (typeof formattingTools)[number][0];

export function formatMarkdown(
  value: string,
  start: number,
  end: number,
  format: Format,
) {
  const selected = value.slice(start, end);
  let text = selected || "text";
  let before = "";
  let after = "";
  const wrappers: Partial<Record<Format, [string, string]>> = {
    bold: ["**", "**"],
    italic: ["*", "*"],
    underline: ["<u>", "</u>"],
    strike: ["~~", "~~"],
    code: ["`", "`"],
    link: ["[", "](https://example.com)"],
  };
  if (wrappers[format]) {
    [before, after] = wrappers[format];
  } else if (["heading", "subheading", "quote", "bullet", "number", "task"].includes(format)) {
    start = start === 0 ? 0 : value.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = value.indexOf("\n", end);
    end = lineEnd === -1 ? value.length : lineEnd;
    const lines = (value.slice(start, end) || "text").split("\n");
    const prefixes: Record<string, string> = {
      heading: "## ", subheading: "### ", quote: "> ", bullet: "- ", task: "- [ ] ",
    };
    text = lines.map((line, i) => `${format === "number" ? `${i + 1}. ` : prefixes[format]}${line}`).join("\n");
  } else {
    before = start > 0 ? "\n\n" : "";
    after = "\n\n";
    if (format === "codeblock") {
      before += "```text\n";
      after = "\n```" + after;
      text = selected || "Your code here";
    } else if (format === "rule") text = "---";
    else text = "| Column | Column |\n| --- | --- |\n| Value | Value |";
  }
  return {
    value: value.slice(0, start) + before + text + after + value.slice(end),
    start: start + before.length,
    end: start + before.length + text.length,
  };
}
