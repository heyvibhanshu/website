import { getPublishedPosts } from "@/lib/posts";
import { sitemapEntries, sitemapXml, sitemapIndexXml, SITEMAP_PAGE_SIZE, xmlHeaders } from "@/lib/seo/sitemap";
import { isPreviewDeployment } from "@/lib/seo/metadata";
export const revalidate = 60;
export async function GET() {
  if (isPreviewDeployment()) return new Response("Not found", { status: 404, headers: xmlHeaders });
  const entries = sitemapEntries(await getPublishedPosts());
  return new Response(entries.length > SITEMAP_PAGE_SIZE ? sitemapIndexXml(entries.length) : sitemapXml(entries), { headers: xmlHeaders });
}
