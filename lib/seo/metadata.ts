import type { Metadata } from "next";
import { seo } from "@/content/seo";
import type { Post } from "@/lib/types";
import { browserTitle } from "@/lib/utils";

export const isPreviewDeployment = () => process.env.VERCEL_ENV === "preview";
export function canonicalUrl(path: string) {
  if (!path.startsWith("/") || path.startsWith("//") || /[?#\\]/u.test(path))
    throw new Error("Canonical paths must be local paths without query strings or fragments.");
  const url = new URL(path, seo.origin);
  if (url.origin !== seo.origin || url.pathname !== path || /%2f|%5c|%2e/i.test(path))
    throw new Error("Noncanonical path.");
  return url.href;
}
export function articlePath(slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120)
    throw new Error("Invalid article slug.");
  return `/writing/${slug}`;
}
export function articleDescription(post: Post) {
  // Only owner-supplied, saved text; never generate unreviewed prose from the body.
  return post.seo_description || post.description || `${post.title} — writing by ${seo.name}.`;
}
export function articlePreview(post: Post) {
  return `${articlePath(post.slug)}/preview?v=${encodeURIComponent(post.updated_at)}`;
}
type PageSeo = { path: string; title: string; description: string; type?: "website" | "article" | "profile"; image?: string; imageAlt?: string; socialTitle?: string; publishedAt?: string; modifiedAt?: string };
export function pageMetadata(input: PageSeo): Metadata {
  const title = browserTitle(input.title);
  const fullTitle = input.path === "/" ? title : `${title} | ${seo.name}`;
  const image = { url: input.image || seo.preview.path, width: seo.preview.width, height: seo.preview.height, type: seo.preview.type, alt: input.imageAlt || seo.preview.alt };
  return {
    title: input.path === "/" ? { absolute: title } : title,
    description: input.description,
    alternates: { canonical: canonicalUrl(input.path), types: { "application/rss+xml": "/rss.xml" } },
    robots: isPreviewDeployment() ? { index: false, follow: false } : { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
    openGraph: { type: input.type || "website", title: input.socialTitle || fullTitle, description: input.description, url: canonicalUrl(input.path), siteName: seo.name, locale: seo.locale, images: [image], ...(input.type === "article" ? { publishedTime: input.publishedAt, modifiedTime: input.modifiedAt, authors: [canonicalUrl("/about")] } : {}) },
    twitter: { card: "summary_large_image", site: seo.xSite, title: input.socialTitle || fullTitle, description: input.description, images: [image] },
  };
}
export function articleMetadata(post: Post): Metadata {
  return pageMetadata({ path: articlePath(post.slug), title: post.seo_title || post.title, socialTitle: post.seo_title || post.title, description: articleDescription(post), type: "article", image: articlePreview(post), imageAlt: post.title, publishedAt: post.published_at!, modifiedAt: post.updated_at });
}
export function rootMetadata(): Metadata {
  return {
    ...pageMetadata(seo.pages.home), metadataBase: new URL(seo.origin),
    title: { default: seo.title, template: `%s | ${seo.name}` },
    applicationName: seo.name, category: "blog", creator: seo.name, publisher: seo.name,
    authors: [{ name: seo.name, url: canonicalUrl("/about") }],
    icons: { icon: "/icon.svg", apple: "/apple-icon" }, manifest: "/manifest.webmanifest",
    verification: { google: process.env.GOOGLE_SITE_VERIFICATION || undefined, other: process.env.BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION } : undefined },
  };
}
