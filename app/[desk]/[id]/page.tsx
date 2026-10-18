import { notFound } from "next/navigation";
import { z } from "zod";
import { requireOwner } from "@/lib/auth";
import { Editor } from "@/components/admin/editor";
import type { Post } from "@/lib/types";
import { requireAdminRoute } from "@/lib/admin-route";
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
