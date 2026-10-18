import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { logout } from "./actions";
import { formatDate } from "@/lib/utils";
import type { Post } from "@/lib/types";
import { requireAdminRoute } from "@/lib/admin-route";
export default async function Dashboard({ params }: { params: Promise<{ desk: string }> }) {
  const path = await requireAdminRoute(params);
  const { client } = await requireOwner();
  const { data, error } = await client
    .from("posts")
    .select("id,title,status,published_at,updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw new Error("Couldn’t load the writing desk.");
  const posts = data as Pick<
    Post,
    "id" | "title" | "status" | "published_at" | "updated_at"
  >[];
  return (
    <>
      <div className="admin-top">
        <div>
          <h1>the writing desk.</h1>
        </div>
        <form action={logout}>
          <button className="text-button">Sign out</button>
        </form>
      </div>
      <div className="admin-toolbar">
        <p>
          {posts.length} {posts.length === 1 ? "article" : "articles"}
        </p>
        <Link className="button primary" href={`${path}/new`}>
          New article
        </Link>
      </div>
      {posts.length ? (
        <ul className="admin-posts">
          {posts.map((post) => (
            <li key={post.id}>
              <Link href={`${path}/${post.id}`}>
                <span>{post.title}</span>
                <span className="post-detail">
                  <span className="status">
                    {post.status === "published" &&
                    post.published_at &&
                    new Date(post.published_at) > new Date()
                      ? "scheduled"
                      : post.status}
                  </span>
                  <span>updated {formatDate(post.updated_at)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-writing">
          <p>Your next thought starts here.</p>
          <p>
            Create an article, save it as a draft, and publish whenever you’re
            ready.
          </p>
        </div>
      )}
    </>
  );
}
