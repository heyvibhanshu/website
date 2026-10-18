import { requireOwner } from "@/lib/auth";
import { Editor } from "@/components/admin/editor";
export default async function NewPost() {
  await requireOwner();
  return <Editor />;
}
