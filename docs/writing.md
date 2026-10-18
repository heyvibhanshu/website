# Writing

The editor stores Markdown as plain text. Use headings from `##` through `####`; the article title supplies the page's `h1`.

Use the shared icon toolbar for bold, italic, underline, headings, links, quotes, lists, code, dividers and tables. The input and preview have equal fixed heights and scroll independently. Bare `<u>text</u>` pairs support underline; other raw HTML is disabled and unsafe link protocols are stripped.

```markdown
## A small observation

A paragraph with **bold**, *italic*, <u>underline</u>, ~~strikethrough~~, and a [link](https://example.com).

> A thought worth keeping.

![Meaningful description](https://example.com/image.jpg "An optional image caption")

## Sources

- [An optional reference](https://example.com)
```

The Sources toolbar button adds an optional linked reference section at the end; subsequent clicks add another entry to the existing section. Replace the sample labels and URLs with real references. Article titles retain the casing you enter; sentence case with proper nouns capitalized is recommended.

The image toolbar button opens a dialog for a file, meaningful alt text, and an optional caption. Upload inserts the Markdown at the saved editor selection. HTTPS and local image paths are supported. A caption does not replace alt text. Compress large photographs before upload.

Use the copy icon in the toolbar to copy the formatting prompt for an LLM. The expandable guide contains the same rules and examples. New articles start with sample Markdown to replace before publishing.

For an explicitly approved YouTube embed, use a fenced block with language `youtube` and only the 11-character video ID as its body. The renderer builds a privacy-enhanced `youtube-nocookie.com` iframe. Arbitrary iframe HTML and other embed hosts are not supported.

Dates are entered in the editor's local timezone and stored as UTC. Public dates display in UTC for consistency. Future published dates schedule visibility. Save draft explicitly unpublishes an already-published article; the button says so before you act. The preview is local and does not save changes.

Slugs must be unique lowercase words separated by hyphens. Changing a published slug changes its URL; the old URL becomes a 404. Prefer keeping published slugs stable.
