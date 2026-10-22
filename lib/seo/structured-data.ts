import { seo } from "@/content/seo";
import { canonicalUrl, articlePath, articleDescription, articlePreview } from "./metadata";
import type { Post } from "@/lib/types";
type Node = Record<string, unknown>;
const websiteId = `${seo.origin}/#website`;
const personId = `${seo.origin}/#person`;
const organizationId = `${seo.organization.url}#organization`;
const ref = (id: string) => ({ "@id": id });
export function pageGraph({ path, title, description, type = "WebPage", breadcrumbs = [], mainEntity, extra = [] }: { path: string; title: string; description: string; type?: string; breadcrumbs?: { name: string; path: string }[]; mainEntity?: Node; extra?: Node[] }) {
  const url = canonicalUrl(path);
  const breadcrumbId = `${url}#breadcrumb`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", "@id": websiteId, name: seo.name, alternateName: seo.alternateNames, url: canonicalUrl("/"), inLanguage: seo.language, publisher: ref(personId) },
      { "@type": "Person", "@id": personId, name: seo.name, alternateName: seo.alternateNames, url: canonicalUrl("/about"), image: canonicalUrl("/me.webp"), email: seo.email, sameAs: Object.values(seo.socials), worksFor: ref(organizationId) },
      { "@type": "Organization", "@id": organizationId, name: seo.organization.name, url: seo.organization.url },
      { "@type": type, "@id": `${url}#webpage`, url, name: title, description, inLanguage: seo.language, isPartOf: ref(websiteId), publisher: ref(personId), ...(breadcrumbs.length ? { breadcrumb: ref(breadcrumbId) } : {}), ...(type === "ProfilePage" ? { mainEntity: ref(personId) } : mainEntity ? { mainEntity } : {}) },
      ...(breadcrumbs.length ? [{ "@type": "BreadcrumbList", "@id": breadcrumbId, itemListElement: breadcrumbs.map((b, index) => ({ "@type": "ListItem", position: index + 1, name: b.name, item: canonicalUrl(b.path) })) }] : []),
      ...extra,
    ],
  };
}
export function articleGraph(post: Post) {
  const path = articlePath(post.slug);
  const url = canonicalUrl(path);
  const id = `${url}#article`;
  return pageGraph({ path, title: post.title, description: articleDescription(post), breadcrumbs: [{ name: "Home", path: "/" }, { name: seo.pages.writing.title, path: "/writing" }, { name: post.title, path }], mainEntity: ref(id), extra: [{ "@type": "BlogPosting", "@id": id, url, headline: post.title, description: articleDescription(post), datePublished: post.published_at, dateModified: post.updated_at, inLanguage: seo.language, author: ref(personId), publisher: ref(personId), mainEntityOfPage: ref(`${url}#webpage`), image: post.cover_image || new URL(articlePreview(post), seo.origin).href }] });
}
