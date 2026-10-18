export const MARKDOWN_EXAMPLE = `> Formatting playground: replace this sample before publishing. The article title is entered separately; start sections at heading level 2.

## A section heading

Write a paragraph with **bold**, *italic*, <u>underlined</u>, ~~struck-through~~, or **bold and *italic*** text.

### A smaller heading

[A hyperlink](https://example.com) opens in a new tab. Use a blank line between paragraphs.

> A blockquote for a thought worth highlighting.

- A bullet point
- Another point
  - A nested point

1. First step
2. Second step

Use \`inline code\` for short snippets.

\`\`\`javascript
const greeting = "hello, world";
console.log(greeting);
\`\`\`

---

| Feature | Syntax |
| --- | --- |
| Bold | **example** |
| Italic | *example* |

![A sample portrait](/me.webp "An optional image caption — replace this image with your own upload.")

#### An optional fourth-level heading

For a YouTube embed, put the 11-character video ID in a fenced code block with the language youtube:

\`\`\`youtube
dQw4w9WgXcQ
\`\`\`

## Sources

- [An optional source title](https://example.com)
`;

export const MARKDOWN_GUIDE = `Format my text as Markdown for vibhanshurathod.com. Preserve its meaning and voice. Return only the article body, without enclosing the whole response in a code fence.

Rules:
- The CMS has separate title and description fields. Do not repeat the title as an H1. Use ##, ###, and #### for sections.
- Supported inline formatting: **bold**, *italic*, <u>underline</u>, ~~strikethrough~~, and backticks for inline code. Bare <u> and </u> are the only supported HTML tags; no attributes or other raw HTML.
- Use [label](https://example.com) for links. External web links open in new tabs automatically.
- Separate paragraphs and block elements with blank lines. Two trailing spaces or a backslash before a newline creates a hard line break.
- Support blockquotes (>), unordered (-) and numbered (1.) lists, and nested lists (indent two spaces).
- Use fenced code blocks with a language identifier for syntax highlighting. Use --- on its own line as a divider.
- Use GitHub-style tables with a header and separator row. Escape literal pipes with a backslash.
- Images: ![meaningful alt text](https://.../image.webp "Optional caption"). Same-site paths beginning with / also work. HTTPS images only; no data URLs or protocol-relative URLs. Use real supplied image URLs, never invent them. Images fit the text column and preserve their aspect ratio. Upload PNG, JPEG, or WebP files up to 5 MB with the CMS image tool.
- If sources are provided, add an optional ## Sources section at the end with a bullet list of [source title](https://supplied-url) links. Do not invent sources or use footnotes or task lists.
- YouTube: a fenced code block with language youtube containing only the 11-character video ID. No arbitrary iframe or video HTML.
- Escape Markdown punctuation with a backslash when it should be literal. Do not add CSS, JavaScript, HTML layouts, or unsupported embeds.
- Do not invent facts, citations, or URLs. Do not include these instructions in the finished article.

Syntax examples (replace sample text, links, image, and video with the supplied content):

${MARKDOWN_EXAMPLE}`;
