import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { supabaseConfig } from "@/lib/supabase/config";
import type { Post, PostSummary } from "@/lib/types";
import {
  PUBLISHED_WRITING_TAG,
  PUBLIC_REVALIDATE_SECONDS,
} from "@/lib/cache-policy";
// Always anonymous: public rendering never inherits the owner's session or draft access.
function publicClient() {
  const config = supabaseConfig();
  return config
    ? createClient(config.url, config.key, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
          fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
        },
      })
    : null;
}
const readPublishedPosts = unstable_cache(
  async (limit?: number): Promise<PostSummary[]> => {
    const client = publicClient();
    if (!client) return [];
    const posts: PostSummary[] = [];
    const pageSize = Math.min(limit ?? 500, 500);
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await client
        .from("posts")
        .select("id,slug,title,description,published_at,updated_at")
        .eq("status", "published")
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false })
        .order("id", { ascending: false })
        .range(offset, offset + pageSize - 1);
      if (error)
        throw new Error(
          "Writing is temporarily unavailable. Please try again shortly.",
        );
      posts.push(...(data as PostSummary[]));
      if (data.length < pageSize || (limit && posts.length >= limit)) break;
    }
    return posts;
  },
  ["published-posts", supabaseConfig()?.url ?? "unconfigured"],
  { tags: [PUBLISHED_WRITING_TAG], revalidate: PUBLIC_REVALIDATE_SECONDS },
);
export const getPublishedPosts = cache(readPublishedPosts);
const readPublishedPost = unstable_cache(
  async (slug: string): Promise<Post | null> => {
    const client = publicClient();
    if (!client) return null;
    const { data, error } = await client
      .from("posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .lte("published_at", new Date().toISOString())
      .maybeSingle();
    if (error) throw new Error("This article is temporarily unavailable.");
    return data as Post | null;
  },
  ["published-post", supabaseConfig()?.url ?? "unconfigured"],
  { tags: [PUBLISHED_WRITING_TAG], revalidate: PUBLIC_REVALIDATE_SECONDS },
);
export const getPublishedPost = cache(readPublishedPost);
