import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { getPublishedPosts } from "@/lib/posts";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedPosts();
  return [
    { url: site.domain },
    { url: `${site.domain}/writing` },
    { url: `${site.domain}/about` },
    ...posts.map((p) => ({
      url: `${site.domain}/writing/${p.slug}`,
      lastModified: p.updated_at,
    })),
  ];
}
