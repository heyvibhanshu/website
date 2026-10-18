import { getPublishedPosts } from "@/lib/posts";
import { EmptyWriting, PostList } from "@/components/writing/post-list";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Writing",
  description:
    "Thoughts, ideas, experiments, and things I've learned along the way.",
  alternates: { canonical: "/writing" },
};
export default async function Writing() {
  const posts = await getPublishedPosts();
  const years = Map.groupBy(posts, (post) =>
    new Date(post.published_at!).getUTCFullYear(),
  );
  return (
    <>
      <div className="page-heading">
        <h1>writing.</h1>
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
