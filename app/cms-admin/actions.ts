"use server";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/auth";
import {
  postSchema,
  loginSchema,
  MAX_IMAGE_BYTES,
  imageExtension,
} from "@/lib/validation";
import type { ActionResult } from "@/lib/types";
import { PUBLISHED_WRITING_TAG } from "@/lib/cache-policy";
export async function login(
  _previous: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Enter your email and password." };
  const client = await createClient();
  const { error } = await client.auth.signInWithPassword(parsed.data);
  if (error)
    return { error: "Couldn’t sign in. Check your details and try again." };
  const { data: owner, error: ownerError } = await client.rpc("is_site_owner");
  if (ownerError || owner !== true) {
    await client.auth.signOut();
    return { error: "This account is not authorized to manage the site." };
  }
  redirect("/cms-admin");
}
export async function logout() {
  const client = await createClient();
  await client.auth.signOut();
  redirect("/cms-admin/login");
}
function refreshWriting(slug?: string, oldSlug?: string) {
  // Expire immediately: unpublishing must not serve a stale public article.
  updateTag(PUBLISHED_WRITING_TAG);
  revalidatePath("/writing", "layout");
  ["/", "/writing", "/sitemap.xml", "/rss.xml", "/cms-admin"].forEach((p) =>
    revalidatePath(p),
  );
  if (slug) revalidatePath(`/writing/${slug}`);
  if (oldSlug && oldSlug !== slug) revalidatePath(`/writing/${oldSlug}`);
}
export async function savePost(form: FormData): Promise<ActionResult> {
  const { client } = await requireOwner();
  const parsed = postSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      error: parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join(" "),
    };
  const { id, ...input } = parsed.data;
  let oldSlug: string | undefined;
  if (id) {
    const { data, error } = await client
      .from("posts")
      .select("slug")
      .eq("id", id)
      .single();
    if (error || !data)
      return {
        error: "This article no longer exists. Return to the dashboard.",
      };
    oldSlug = data.slug;
  }
  const values = {
    ...input,
    published_at: input.published_at
      ? new Date(input.published_at).toISOString()
      : input.status === "published"
        ? new Date().toISOString()
        : null,
  };
  const query = id
    ? client.from("posts").update(values).eq("id", id)
    : client.from("posts").insert(values);
  const { data, error } = await query.select("id").single();
  if (error)
    return {
      error:
        error.code === "23505"
          ? "That slug is already used. Choose another."
          : "Couldn’t save this article. Please try again.",
    };
  refreshWriting(input.slug, oldSlug);
  return {
    id: data.id,
    success:
      input.status === "published"
        ? values.published_at && new Date(values.published_at) > new Date()
          ? "Publication scheduled."
          : "Article published."
        : "Draft saved.",
  };
}
export async function deletePost(id: string): Promise<ActionResult> {
  const { client } = await requireOwner();
  if (!z.uuid().safeParse(id).success) return { error: "Invalid article." };
  const { data, error } = await client
    .from("posts")
    .delete()
    .eq("id", id)
    .select("slug")
    .single();
  if (error || !data)
    return {
      error: "Couldn’t delete the article. It may have already been removed.",
    };
  refreshWriting(data.slug);
  return { success: "Article deleted." };
}
export async function uploadImage(form: FormData): Promise<ActionResult> {
  const { client, user } = await requireOwner();
  const file = form.get("image");
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_IMAGE_BYTES)
    return { error: "Choose a PNG, JPEG, or WebP image up to 5 MB." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const extension = imageExtension(bytes, file.type);
  if (!extension)
    return { error: "The file must be a valid PNG, JPEG, or WebP image." };
  const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
  const { error } = await client.storage
    .from("article-images")
    .upload(path, bytes, {
      contentType: file.type,
      upsert: false,
      cacheControl: "31536000",
    });
  if (error)
    return {
      error:
        "The image couldn’t be uploaded. Check the storage setup and try again.",
    };
  return {
    url: client.storage.from("article-images").getPublicUrl(path).data
      .publicUrl,
  };
}
