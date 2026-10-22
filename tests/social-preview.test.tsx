import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import type { Post } from "../lib/types";

vi.mock("next/og", () => ({ ImageResponse: class extends Response {
  constructor(element: ReactNode) { super(renderToStaticMarkup(element)); }
} }));
vi.mock("@/lib/posts", () => ({ getPublishedPost: vi.fn(), getPublishedPosts: vi.fn() }));
// next/font is compiled by Next.js; metadata unit tests do not run that compiler.
vi.mock("@/lib/reading-fonts", () => ({ readingFontClassName: "" }));
import { getPublishedPost } from "../lib/posts";
import HomeImage from "../app/opengraph-image";
import { GET } from "../app/writing/[slug]/preview/route";
import { generateMetadata } from "../app/writing/[slug]/page";

const post: Post = {
  id: "sample", slug: "a-thought", title: "A thought worth sharing", description: "A description specific to this article.",
  content: "Some text", status: "published", published_at: "2026-01-01T00:00:00Z", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-02-01T00:00:00Z",
  cover_image: null, seo_title: null, seo_description: null,
};
describe("social link previews", () => {
  it("uses the requested homepage caption", async () => {
    const image = await HomeImage().text();
    expect(image).toContain("this is my little corner of the internet.");
    expect(image).not.toContain("vibhanshurathod.com");
    expect(image).not.toContain("personal notebook");
  });
  it("renders article-specific title and description and links both card types to it", async () => {
    vi.mocked(getPublishedPost).mockResolvedValue(post);
    const image = await GET(new Request("https://example.com/writing/a-thought/preview"), { params: Promise.resolve({ slug: post.slug }) });
    const markup = await image.text();
    expect(markup).toContain(post.title);
    expect(markup).toContain(post.description!);
    expect(markup).not.toContain("hey, i");
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: post.slug }) });
    expect(JSON.stringify(metadata.openGraph)).toContain("/writing/a-thought/preview?v=");
    expect(JSON.stringify(metadata.twitter)).toContain("/writing/a-thought/preview?v=");
  });
  it("does not generate images for missing, draft, or future articles", async () => {
    vi.mocked(getPublishedPost).mockResolvedValue(null);
    const response = await GET(new Request("https://example.com/writing/private/preview"), { params: Promise.resolve({ slug: "private" }) });
    expect(response.status).toBe(404);
    expect(await response.text()).toBe("Not found");
  });
  it("removes trailing full stops only from the browser title", async () => {
    vi.mocked(getPublishedPost).mockResolvedValue({ ...post, title: "a thought.", seo_title: null });
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: post.slug }) });
    expect(metadata.title).toBe("A Thought");
    expect(metadata.openGraph?.title).toBe("a thought.");
  });
});
