import { seo } from "@/content/seo";
import { pageMetadata } from "@/lib/seo/metadata";
import { pageGraph } from "@/lib/seo/structured-data";
import { SeoJsonLd } from "@/components/seo-json-ld";
import { getPublishedPosts } from "@/lib/posts";
import { EmptyWriting, PostList } from "@/components/writing/post-list";
export const revalidate = 60;
export const metadata = pageMetadata({ ...seo.pages.writing });
export default async function Writing() {
  const posts = await getPublishedPosts();
  const years = Map.groupBy(posts, (post) =>
    new Date(post.published_at!).getUTCFullYear(),
  );
  return (
    <>
      <SeoJsonLd data={pageGraph({ ...seo.pages.writing, type: "CollectionPage", breadcrumbs: [{ name: "Home", path: "/" }, { name: seo.pages.writing.title, path: "/writing" }] })} />
      <div className="page-heading">
        <h1>Writing.</h1>
        <p>
          Thoughts, ideas, experiments, and things I&apos;ve learned along the
          way.
        </p>
      </div>
      {posts.length ? (
        <div className="archive">
          {[...years].map(([year, entries]) => (
            <section key={year} aria-labelledby={`year-${year}`}>
              <h2 className="archive-year" id={`year-${year}`}>
                {year}
              </h2>
              <PostList posts={entries} archive />
            </section>
          ))}
        </div>
      ) : (
        <div className="archive-empty">
          <EmptyWriting />
          <a className="text-link" href="/rss.xml">
            Follow along via RSS <span aria-hidden="true">↗</span>
          </a>
        </div>
      )}
    </>
  );
}
