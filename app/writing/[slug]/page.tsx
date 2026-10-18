import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedPost, getPublishedPosts } from "@/lib/posts";
import { formatDate, readingTime, safeJson } from "@/lib/utils";
import { Markdown } from "@/components/writing/markdown";
import { site } from "@/content/site";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return { title: "Article not found", robots: { index: false } };
  const title = post.seo_title || post.title;
  const description = post.seo_description || post.description || undefined;
  return {
    title,
    description,
    alternates: { canonical: `/writing/${post.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/writing/${post.slug}`,
      publishedTime: post.published_at!,
      modifiedTime: post.updated_at,
      authors: [site.name],
      images: post.cover_image
        ? [{ url: post.cover_image }]
        : [{ url: "/opengraph-image" }],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}
export default async function Article({ params }: Props) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) notFound();
  const posts = await getPublishedPosts();
  const index = posts.findIndex((p) => p.id === post.id);
  const older = posts[index + 1];
  const newer = posts[index - 1];
  return (
    <article className="article">
      <div className="article-meta">
        <Link href="/writing">← all writing</Link>
        <time dateTime={post.published_at!}>
          {formatDate(post.published_at!, "full")}
        </time>
      </div>
      <header className="article-heading">
        <h1>{post.title}</h1>
        {post.description && <p className="subtitle">{post.description}</p>}
        <p className="reading-time">{readingTime(post.content)} min read</p>
      </header>
      <Markdown content={post.content} />
      <nav className="article-pagination" aria-label="Adjacent articles">
        <div>
          {older && (
            <Link href={`/writing/${older.slug}`}>
              <span>← previous</span>
              {older.title}
            </Link>
          )}
        </div>
        <div>
          {newer && (
            <Link href={`/writing/${newer.slug}`}>
              <span>next →</span>
              {newer.title}
            </Link>
          )}
        </div>
      </nav>
      <Link className="text-link" href="/writing">
        ← back to all writing
      </Link>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJson({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.description ?? undefined,
            datePublished: post.published_at,
            dateModified: post.updated_at,
            author: {
              "@type": "Person",
              name: site.name,
              url: `${site.domain}/about`,
            },
            mainEntityOfPage: `${site.domain}/writing/${post.slug}`,
            image: post.cover_image || `${site.domain}/opengraph-image`,
          }),
        }}
      />
    </article>
  );
}
