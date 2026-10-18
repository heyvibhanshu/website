import { describe, expect, it } from "vitest";
import { formatMarkdown, formattingTools } from "../lib/markdown-editor";

describe("Markdown editor formatting", () => {
  it("wraps the selection, preserves surrounding text, and selects the formatted words", () => {
    for (const [kind, expected] of [
      ["bold", "**words**"], ["italic", "*words*"],
      ["underline", "<u>words</u>"], ["strike", "~~words~~"],
      ["code", "`words`"], ["link", "[words](https://example.com)"],
    ] as const) {
      const result = formatMarkdown("some words here", 5, 10, kind);
      expect(result.value).toBe(`some ${expected} here`);
      expect(result.value.slice(result.start, result.end)).toBe("words");
    }
  });
  it("formats whole lines for lists and headings without losing adjacent paragraphs", () => {
    expect(formatMarkdown("before\nfirst\nsecond\nafter", 9, 18, "number").value)
      .toBe("before\n1. first\n2. second\nafter");
    expect(formatMarkdown("a heading\nbody", 2, 5, "heading").value)
      .toBe("## a heading\nbody");
    expect(formatMarkdown("\nbody", 0, 0, "heading").value).toBe("## text\nbody");
  });
  it("inserts usable placeholders at an empty cursor for every tool", () => {
    for (const [kind] of formattingTools) {
      const result = formatMarkdown("", 0, 0, kind);
      expect(result.value.trim().length).toBeGreaterThan(0);
      expect(result.end).toBeGreaterThan(result.start);
    }
  });
  it("separates block insertions from existing paragraphs", () => {
    expect(formatMarkdown("beforeafter", 6, 6, "rule").value).toBe("before\n\n---\n\nafter");
    expect(formatMarkdown("code", 0, 4, "codeblock").value).toBe("```text\ncode\n```\n\n");
  });
});
