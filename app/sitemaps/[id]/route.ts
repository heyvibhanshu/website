import { getPublishedPosts } from "@/lib/posts";
import { sitemapEntries, sitemapXml, SITEMAP_PAGE_SIZE, xmlHeaders } from "@/lib/seo/sitemap";
import { isPreviewDeployment } from "@/lib/seo/metadata";
export const revalidate = 60;
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (isPreviewDeployment() || !/^(0|[1-9][0-9]*)\.xml$/.test(id)) return new Response("Not found", { status: 404, headers: xmlHeaders });
  const entries = sitemapEntries(await getPublishedPosts());
  const index = Number(id.slice(0, -4));
  const page = entries.slice(index * SITEMAP_PAGE_SIZE, (index + 1) * SITEMAP_PAGE_SIZE);
  if (entries.length <= SITEMAP_PAGE_SIZE || !page.length) return new Response("Not found", { status: 404, headers: xmlHeaders });
  return new Response(sitemapXml(page), { headers: xmlHeaders });
}
