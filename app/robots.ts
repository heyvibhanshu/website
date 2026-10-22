import type { MetadataRoute } from "next";
import { seo } from "@/content/seo";
import { isPreviewDeployment } from "@/lib/seo/metadata";
export default function robots(): MetadataRoute.Robots {
  return isPreviewDeployment() ? { rules: { userAgent: "*", disallow: "/" } } : { rules: { userAgent: "*", allow: "/", disallow: ["/api/"] }, sitemap: `${seo.origin}/sitemap.xml` };
}
