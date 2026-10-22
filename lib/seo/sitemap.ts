import { seo } from "@/content/seo";
import { canonicalUrl, articlePath } from "./metadata";
import { escapeXml } from "@/lib/utils";
import type { PostSummary } from "@/lib/types";
export const SITEMAP_PAGE_SIZE = 45000;
export function sitemapEntries(posts: PostSummary[]) {
  return [...Object.values(seo.pages).map(({ path }) => ({ url: canonicalUrl(path), modified: undefined as string | undefined })), ...posts.map(p => ({ url: canonicalUrl(articlePath(p.slug)), modified: p.updated_at }))];
}
export function sitemapXml(entries: ReturnType<typeof sitemapEntries>) {
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.map(e => `<url><loc>${escapeXml(e.url)}</loc>${e.modified ? `<lastmod>${escapeXml(e.modified)}</lastmod>` : ""}</url>`).join("")}</urlset>`;
}
export function sitemapIndexXml(count: number) {
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Array.from({ length: Math.ceil(count / SITEMAP_PAGE_SIZE) }, (_, i) => `<sitemap><loc>${canonicalUrl(`/sitemaps/${i}.xml`)}</loc></sitemap>`).join("")}</sitemapindex>`;
}
export const xmlHeaders = { "Content-Type": "application/xml; charset=utf-8", "X-Robots-Tag": "noindex" };
