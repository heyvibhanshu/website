import Link from "next/link";
import type { PostSummary } from "@/lib/types";
import { formatDate } from "@/lib/utils";
export function PostList({
  posts,
  archive = false,
}: {
  posts: PostSummary[];
  archive?: boolean;
}) {
  return (
    <ul className="post-list">
      {posts.map((post) => (
        <li key={post.id}>
          <Link href={`/writing/${post.slug}`}>{post.title}</Link>
          <time dateTime={post.published_at!}>
            {formatDate(post.published_at!, archive ? "archive" : "short")}
          </time>
        </li>
      ))}
    </ul>
  );
}
export function EmptyWriting() {
  return (
    <div className="empty-writing">
      <p>A quiet page, for now.</p>
      <p>Thoughts are taking shape. I’ll share them here when they’re ready.</p>
    </div>
  );
}
