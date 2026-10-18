import { site } from "@/content/site";
import { getPublishedPosts } from "@/lib/posts";
import { escapeXml as x } from "@/lib/utils";
export const dynamic = "force-dynamic";
export async function GET() {
  const posts = await getPublishedPosts();
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${x(site.name)}</title><link>${site.domain}</link><description>${x(site.description)}</description><language>en</language><atom:link href="${site.domain}/rss.xml" rel="self" type="application/rss+xml"/>${posts.map((p) => `<item><title>${x(p.title)}</title><link>${site.domain}/writing/${x(p.slug)}</link><guid isPermaLink="true">${site.domain}/writing/${x(p.slug)}</guid><pubDate>${new Date(p.published_at!).toUTCString()}</pubDate><description>${x(p.description || "")}</description></item>`).join("")}</channel></rss>`;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
