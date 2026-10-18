import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Markdown } from "../components/writing/markdown";
describe("untrusted Markdown", () => {
  it("discards raw HTML and javascript links", () => {
    const html = renderToStaticMarkup(
      <Markdown
        content={
          '<script>alert(1)</script>\n\n<iframe src="https://evil.test"></iframe>\n\n[click](javascript:alert%281%29)'
        }
      />,
    );
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<iframe");
    expect(html).not.toContain('href="javascript:');
  });
  it("blocks data and protocol-relative images", () => {
    const html = renderToStaticMarkup(
      <Markdown
        content={
          "![image](data:image/svg+xml,bad)\n\n![image](//evil.test/pixel.png)"
        }
      />,
    );
    expect(html).not.toContain("<img");
  });
  it("renders tables, captions, highlighted code and footnotes", () => {
    const html = renderToStaticMarkup(
      <Markdown
        content={
          '| A | B |\n| - | - |\n| 1 | 2 |\n\n![A garden](https://example.com/photo.jpg "A quiet morning")\n\n```js\nconst answer = 42;\n```\n\nA note[^1].\n\n[^1]: The footnote.'
        }
      />,
    );
    expect(html).toContain("<table>");
    expect(html).toContain("image-caption");
    expect(html).toContain("hljs-keyword");
    expect(html).toContain("data-footnotes");
  });
  it("adds safe external link attributes", () =>
    expect(
      renderToStaticMarkup(
        <Markdown content={"[External](https://example.com)"} />,
      ),
    ).toContain('rel="noopener noreferrer"'));
});
