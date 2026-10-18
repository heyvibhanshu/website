import { requireOwner } from "@/lib/auth";
import { Editor } from "@/components/admin/editor";
import { requireAdminRoute } from "@/lib/admin-route";
export default async function NewPost({ params }: { params: Promise<{ desk: string }> }) {
  await requireAdminRoute(params);
  await requireOwner();
  return <Editor />;
}
