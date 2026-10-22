import type { MetadataRoute } from "next";
import { seo } from "@/content/seo";
export default function manifest(): MetadataRoute.Manifest {
  return { id: "/", name: seo.name, short_name: seo.name, description: seo.description, lang: seo.language, start_url: "/", scope: "/", display: "browser", theme_color: seo.themeColor, background_color: seo.themeColor, icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }, { src: "/apple-icon", sizes: "180x180", type: "image/png" }] };
}
