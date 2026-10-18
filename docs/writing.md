# Writing

The editor stores Markdown as plain text. Use headings from `##` through `####`; the article title supplies the page's `h1`.

GFM supports lists, task lists, tables, strikethrough and footnotes. Use fenced code blocks with a language name for syntax highlighting. Raw HTML is disabled and unsafe link protocols are stripped.

```markdown
## A small observation

A paragraph with **emphasis**, a [link](https://example.com), and a note.[^1]

> A thought worth keeping.

![Meaningful description](https://example.com/image.jpg "An optional image caption")

[^1]: A little more context.
```

Image upload inserts this syntax at the editor cursor. HTTPS and local image paths are supported. Keep image alt text descriptive; a caption does not replace it. Compress large photographs before upload.

For an explicitly approved YouTube embed, use a fenced block with language `youtube` and only the 11-character video ID as its body. The renderer builds a privacy-enhanced `youtube-nocookie.com` iframe. Arbitrary iframe HTML and other embed hosts are not supported.

Dates are entered in the editor's local timezone and stored as UTC. Public dates display in UTC for consistency. Future published dates schedule visibility. Save draft explicitly unpublishes an already-published article; the button says so before you act. The preview is local and does not save changes.

Slugs must be unique lowercase words separated by hyphens. Changing a published slug changes its URL; the old URL becomes a 404. Prefer keeping published slugs stable.
