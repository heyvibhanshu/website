vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("@/lib/indexnow/worker", () => ({ runIndexNowSafely: vi.fn() }));
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Post } from "../lib/types";
const state = vi.hoisted(() => ({
  rows: [] as Post[],
  reads: 0,
  ownerAllowed: true,
  entries: new Map<string, { value: Promise<unknown>; tags: string[] }>(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/config", () => ({
  supabaseConfig: () => ({
    url: "https://test.supabase.co",
    key: "public-test-key",
  }),
}));
vi.mock("next/cache", () => ({
  unstable_cache:
    (
      fn: (...args: unknown[]) => Promise<unknown>,
      keys: string[],
      options: { tags: string[] },
    ) =>
    (...args: unknown[]) => {
      const key = JSON.stringify([keys, args]);
      if (!state.entries.has(key))
        state.entries.set(key, { value: fn(...args), tags: options.tags });
      return state.entries.get(key)!.value;
    },
  updateTag: (tag: string) => {
    for (const [key, entry] of state.entries)
      if (entry.tags.includes(tag)) state.entries.delete(key);
  },
  revalidatePath: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: (
    _url: string,
    key: string,
    options: { auth: { persistSession: boolean } },
  ) => {
    if (key !== "public-test-key" || options.auth.persistSession)
      throw Error("Public content must use an anonymous client.");
    return {
      from: () => {
        const filters = new Map<string, unknown>();
        let cutoff = "";
        const read = () => {
          state.reads++;
          if (filters.get("status") !== "published" || !cutoff)
            throw Error("Public read is missing publication filters.");
          return state.rows.filter(
            (row) =>
              [...filters].every(
                ([key, value]) => row[key as keyof Post] === value,
              ) &&
              row.published_at &&
              row.published_at <= cutoff,
          );
        };
        const query = {
          select: () => query,
          eq: (key: string, value: unknown) => {
            filters.set(key, value);
            return query;
          },
          lte: (_key: string, value: string) => {
            cutoff = value;
            return query;
          },
          order: () => query,
          range: async (start: number, end: number) => ({
            data: read().slice(start, end + 1),
            error: null,
          }),
          maybeSingle: async () => ({ data: read()[0] || null, error: null }),
        };
        return query;
      },
    };
  },
}));
vi.mock("@/lib/auth", () => ({
  requireOwner: async () => {
    if (!state.ownerAllowed) throw Error("Unauthorized");
    return {
      user: { id: "owner" },
      client: {
        from: () => {
          let id = "";
          let changes: Partial<Post> | undefined;
          let remove = false;
          const query = {
            select: () => query,
            eq: (_key: string, value: string) => {
              id = value;
              return query;
            },
            update: (values: Partial<Post>) => {
              changes = values;
              return query;
            },
            delete: () => {
              remove = true;
              return query;
            },
            single: async () => {
              const row = state.rows.find((post) => post.id === id)!;
              if (changes) Object.assign(row, changes);
              if (remove)
                state.rows = state.rows.filter((post) => post.id !== id);
              return { data: { ...row }, error: null };
            },
          };
          return query;
        },
      },
    };
  },
}));
import { getPublishedPost, getPublishedPosts } from "../lib/posts";
import { deletePost, savePost } from "../app/[desk]/actions";
const id = "11111111-1111-4111-8111-111111111111";
function form(status: "draft" | "published", slug = "a-thought") {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    id,
    title: "A thought",
    slug,
    content: "Some writing.",
    status,
    description: "",
    published_at: "2026-01-01T00:00:00Z",
    cover_image: "",
    seo_title: "",
    seo_description: "",
  }))
    data.set(key, value);
  return data;
}
beforeEach(() => {
  state.rows = [
    {
      id,
      title: "A thought",
      slug: "a-thought",
      content: "Private draft",
      status: "draft",
      published_at: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      description: null,
      cover_image: null,
      seo_title: null,
      seo_description: null,
    },
  ];
  state.entries.clear();
  state.reads = 0;
  state.ownerAllowed = true;
});
describe("public cache and CMS mutations", () => {
  it("reuses anonymous reads without exposing drafts or scheduled writing", async () => {
    state.rows.push({
      ...state.rows[0],
      id: "future",
      slug: "future",
      status: "published",
      published_at: "2999-01-01T00:00:00Z",
    });
    expect(await getPublishedPosts()).toEqual([]);
    expect(await getPublishedPosts()).toEqual([]);
    expect(state.reads).toBe(1);
    expect(await getPublishedPost("a-thought")).toBeNull();
  });
  it("expires cached empty lists and draft 404s immediately on publish, then hides unpublished content", async () => {
    await getPublishedPosts();
    await getPublishedPost("a-thought");
    expect((await savePost(form("published"))).publishedPath).toBe("/writing/a-thought");
    expect(await getPublishedPosts()).toHaveLength(1);
    expect((await getPublishedPost("a-thought"))?.content).toBe(
      "Some writing.",
    );
    expect((await savePost(form("draft"))).publishedPath).toBeUndefined();
    expect(await getPublishedPosts()).toEqual([]);
    expect(await getPublishedPost("a-thought")).toBeNull();
  });
  it("does not offer a public article link before its scheduled publication", async () => {
    const scheduled = form("published");
    scheduled.set("published_at", "2999-01-01T00:00:00Z");
    const result = await savePost(scheduled);
    expect(result.success).toBe("Publication scheduled.");
    expect(result.publishedPath).toBeUndefined();
  });
  it("removes cached articles after a rename and deletion", async () => {
    await savePost(form("published"));
    await getPublishedPost("a-thought");
    await savePost(form("published", "new-slug"));
    expect(await getPublishedPost("a-thought")).toBeNull();
    expect(await getPublishedPost("new-slug")).not.toBeNull();
    expect((await deletePost(id)).error).toBeUndefined();
    expect(await getPublishedPost("new-slug")).toBeNull();
    expect(await getPublishedPosts()).toEqual([]);
  });
  it("does not let an unauthorized mutation publish or invalidate content", async () => {
    await getPublishedPosts();
    state.ownerAllowed = false;
    await expect(savePost(form("published"))).rejects.toThrow("Unauthorized");
    expect(await getPublishedPosts()).toEqual([]);
    expect(state.reads).toBe(1);
  });
});
