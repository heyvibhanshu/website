import type { Metadata } from "next";
import Link from "next/link";
import { IntentLink } from "@/components/intent-link";
import { notFound } from "next/navigation";
import { getPublishedPost, getPublishedPosts } from "@/lib/posts";
import { formatDate, headingTitle, readingTime } from "@/lib/utils";
import { Markdown } from "@/components/writing/markdown";
import { articleMetadata } from "@/lib/seo/metadata";
import { articleGraph } from "@/lib/seo/structured-data";
import { SeoJsonLd } from "@/components/seo-json-ld";
export const revalidate = 60;
export async function generateStaticParams() {
  return (await getPublishedPosts()).map(({ slug }) => ({ slug }));
}
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return { title: "Article Not Found", robots: { index: false, follow: false }, alternates: { canonical: null }, openGraph: null, twitter: null };
  return articleMetadata(post);
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
        <h1>{headingTitle(post.title)}</h1>
        {post.description && <p className="subtitle">{post.description}</p>}
        <p className="reading-time">{readingTime(post.content)} min read</p>
      </header>
      <Markdown content={post.content} />
      <nav className="article-pagination" aria-label="Adjacent articles">
        <div>
          {older && (
            <IntentLink href={`/writing/${older.slug}`}>
              <span>← previous</span>
              {older.title}
            </IntentLink>
          )}
        </div>
        <div>
          {newer && (
            <IntentLink href={`/writing/${newer.slug}`}>
              <span>next →</span>
              {newer.title}
            </IntentLink>
          )}
        </div>
      </nav>
      <Link className="text-link" href="/writing">
        ← back to all writing
      </Link>
      <SeoJsonLd data={articleGraph(post)} />
    </article>
  );
}
