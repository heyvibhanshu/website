import { notFound } from "next/navigation";
import { z } from "zod";
import { requireOwner } from "@/lib/auth";
import { Editor } from "@/components/admin/editor";
import type { Post } from "@/lib/types";
import { requireAdminRoute } from "@/lib/admin-route";
import { adminMetadata } from "@/lib/admin-metadata";
export function generateMetadata({ params }: { params: Promise<{ desk: string }> }) {
  return adminMetadata(params, "Edit Article");
}
export default async function EditPost({
  params,
}: {
  params: Promise<{ desk: string; id: string }>;
}) {
  await requireAdminRoute(params);
  const { client } = await requireOwner();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { data, error } = await client
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Couldn’t load the article.");
  if (!data) notFound();
  return <Editor post={data as Post} />;
}
