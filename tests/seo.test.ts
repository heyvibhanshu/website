import { afterEach, describe, expect, it, vi } from "vitest";
import { seo } from "../content/seo";
import { canonicalUrl, pageMetadata, articleMetadata } from "../lib/seo/metadata";
import { articleGraph, pageGraph } from "../lib/seo/structured-data";
import { sitemapEntries, sitemapXml, sitemapIndexXml, SITEMAP_PAGE_SIZE } from "../lib/seo/sitemap";
import { eligiblePath, retryAt } from "../lib/indexnow/config";
import { GET as keyFile } from "../app/indexnow-key.txt/route";
import { safeJson } from "../lib/utils";
import type { Post } from "../lib/types";
const post: Post = { id: "test", slug: "sample", title: "Source title.", description: null, content: "Reviewed body", status: "published", published_at: "2026-01-01T12:00:00Z", updated_at: "2026-01-03T12:00:00Z", created_at: "2026-01-01T12:00:00Z", cover_image: null, seo_title: null, seo_description: null };
afterEach(() => vi.unstubAllEnvs());
describe("central SEO foundation", () => {
 it("gives each public page matching canonical and social identity without overwriting preview artwork", () => {
  for (const page of Object.values(seo.pages)) {
   const m = pageMetadata(page);
   expect(m.alternates?.canonical).toBe(canonicalUrl(page.path));
   expect(m.openGraph).toMatchObject({ url: canonicalUrl(page.path), locale: "en_IN", siteName: seo.name, description: page.description, images: [{ url: "/opengraph-image", width: 1200, height: 630, type: "image/png", alt: seo.preview.alt }] });
   expect(m.twitter).toMatchObject({ card: "summary_large_image", site: "@heyvibhanshu", description: page.description });
  }
 });
 it("rejects external, encoded, query-string and path-traversal canonicals", () => {
  for (const path of ["https://evil.example", "//evil.example", "/about?x=y", "/writing/../about", "/writing/%2e%2e", "/about#x", "/foo\\bar"]) expect(() => canonicalUrl(path)).toThrow();
 });
 it("uses reviewed editorial overrides, retains source titles, and supplies a deterministic non-AI description", () => {
  const m = articleMetadata(post);
  expect(m.title).toBe("Source Title");
  expect(m.description).toBe("Source title. — writing by Vibhanshu Rathod.");
  expect(articleMetadata({ ...post, seo_description: "Reviewed override" }).description).toBe("Reviewed override");
  expect(post.title).toBe("Source title.");
 });
 it("builds one connected graph with real dates and a Person publisher, without fake product or organization claims", () => {
  const graph = articleGraph(post)["@graph"];
  const article = graph.find(n => n["@type"] === "BlogPosting")!;
  expect(article).toMatchObject({ headline: post.title, datePublished: post.published_at, dateModified: post.updated_at, author: { "@id": `${seo.origin}/#person` }, publisher: { "@id": `${seo.origin}/#person` } });
  const ids = graph.map(n => n["@id"]);
  expect(new Set(ids).size).toBe(ids.length);
  expect(graph.some(n => n["@type"] === "Product" || n["@type"] === "SoftwareApplication")).toBe(false);
  expect(safeJson(articleGraph({ ...post, title: '</script><img src=x onerror=alert(1)>' }))).not.toContain('</script>');
  expect(pageGraph({ ...seo.pages.about, type: "ProfilePage" })["@graph"].find(n=>n["@type"] === "ProfilePage")).toMatchObject({ mainEntity: { "@id": `${seo.origin}/#person` } });
 });
 it("uses real article lastmod dates, omits invented static dates, and partitions large sitemaps", () => {
  const entries = sitemapEntries([post]);
  expect(entries.filter(e => e.modified)).toEqual([{ url: `${seo.origin}/writing/sample`, modified: post.updated_at }]);
  expect(sitemapXml(entries)).not.toContain("<lastmod>undefined");
  expect(sitemapIndexXml(SITEMAP_PAGE_SIZE + 1)).toContain("/sitemaps/1.xml");
 });
 it("protects preview indexing and validates optional ownership keys", async () => {
  vi.stubEnv("INDEXNOW_KEY", "a".repeat(64));
  expect(await keyFile().text()).toBe("a".repeat(64));
  vi.stubEnv("VERCEL_ENV", "preview");
  expect(pageMetadata(seo.pages.home).robots).toMatchObject({ index: false, follow: false });
  expect(keyFile().status).toBe(404);
 });
 it("keeps private/utility/noncanonical paths out of IndexNow and honors Retry-After", () => {
  for (const path of ["/api/indexnow", "/test-desk", "/writing/a/preview", "/writing/a?x=1", "//external.test", "/writing/Draft"]) expect(eligiblePath(path)).toBe(false);
  expect(eligiblePath("/writing/public-post")).toBe(true);
  const now = Date.parse("2026-01-01T00:00:00Z");
  expect(Date.parse(retryAt("3600", 1, now))).toBe(now + 3600000);
  expect(Date.parse(retryAt("Thu, 01 Jan 2026 02:00:00 GMT", 1, now))).toBe(now + 7200000);
 });
});
