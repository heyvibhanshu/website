import { describe, it, expect } from "vitest";
import { postSchema, imageExtension } from "../lib/validation";
import { slugify, safeJson, escapeXml, formatDate } from "../lib/utils";
const draft = {
  id: "",
  title: "A thought",
  slug: "a-thought",
  content: "",
  status: "draft",
  description: "",
  published_at: "",
  cover_image: "",
  seo_title: "",
  seo_description: "",
};
describe("publishing validation", () => {
  it("allows an empty draft, but requires writing to publish", () => {
    expect(postSchema.safeParse(draft).success).toBe(true);
    expect(
      postSchema.safeParse({ ...draft, status: "published" }).success,
    ).toBe(false);
    expect(
      postSchema.safeParse({ ...draft, status: "published", content: "Hello." })
        .success,
    ).toBe(true);
  });
  it.each([
    "../private",
    "UPPER",
    "has space",
    "double--hyphen",
    "trailing-",
    "a/b",
  ])("rejects unsafe slug %s", (slug) =>
    expect(postSchema.safeParse({ ...draft, slug }).success).toBe(false),
  );
  it("rejects malformed identifiers, dates, and unsafe cover URLs", () => {
    for (const change of [
      { id: "some-id" },
      { published_at: "yesterday" },
      { cover_image: "javascript:alert(1)" },
      { title: " " },
    ])
      expect(postSchema.safeParse({ ...draft, ...change }).success).toBe(false);
  });
  it("normalizes empty optional fields to null", () =>
    expect(postSchema.parse(draft).description).toBeNull());
});
describe("upload validation", () => {
  it("requires matching image signatures and MIME types", () => {
    const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(imageExtension(png, "image/png")).toBe("png");
    expect(imageExtension(png, "image/jpeg")).toBeNull();
    expect(
      imageExtension(
        new TextEncoder().encode('<svg onload="alert(1)">'),
        "image/png",
      ),
    ).toBeNull();
    expect(
      imageExtension(new Uint8Array([255, 216, 255, 224]), "image/jpeg"),
    ).toBe("jpg");
    expect(
      imageExtension(new TextEncoder().encode("RIFFxxxxWEBP"), "image/webp"),
    ).toBe("webp");
  });
});
describe("safe output and chronology", () => {
  it("escapes script endings in structured data", () =>
    expect(
      safeJson({ title: "</script><script>alert(1)</script>" }),
    ).not.toContain("<"));
  it("escapes XML for RSS", () =>
    expect(escapeXml('<a & "b">')).toBe("&lt;a &amp; &quot;b&quot;&gt;"));
  it("uses UTC publication dates", () =>
    expect(formatDate("2026-10-18T00:00:00Z")).toBe("Oct 18, 2026"));
  it("proposes readable normalized slugs", () =>
    expect(slugify(" Café: building things! ")).toBe("cafe-building-things"));
});
