import Link from "next/link";
import { site } from "@/content/site";
import { getPublishedPosts } from "@/lib/posts";
import { EmptyWriting, PostList } from "@/components/writing/post-list";
export const dynamic = "force-dynamic";
export const metadata = { alternates: { canonical: "/" } };
export default async function Home() {
  const posts = await getPublishedPosts(5);
  return (
    <>
      <section className="introduction">
        <h1>{site.home.greeting}</h1>
        <div className="intro-copy">
          {site.home.introduction.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </section>
      <section className="recent-writing" aria-labelledby="recent-heading">
        <div className="section-heading">
          <h2 id="recent-heading">recent writing</h2>
          <Link href="/writing">
            all writing <span aria-hidden="true">→</span>
          </Link>
        </div>
        {posts.length ? <PostList posts={posts} /> : <EmptyWriting />}
      </section>
    </>
  );
}
