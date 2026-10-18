import { requireOwner } from "@/lib/auth";
import { Editor } from "@/components/admin/editor";
import { requireAdminRoute } from "@/lib/admin-route";
import { adminMetadata } from "@/lib/admin-metadata";
export function generateMetadata({ params }: { params: Promise<{ desk: string }> }) {
  return adminMetadata(params, "New Article");
}
export default async function NewPost({ params }: { params: Promise<{ desk: string }> }) {
  await requireAdminRoute(params);
  await requireOwner();
  return <Editor />;
}
