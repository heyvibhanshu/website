import type { Metadata } from "next";
import { requireAdminRoute } from "@/lib/admin-route";
import { AdminPathProvider } from "@/components/admin/admin-path";
import { site } from "@/content/site";
import { adminMetadata } from "@/lib/admin-metadata";
export async function generateMetadata({ params }: { params: Promise<{ desk: string }> }): Promise<Metadata> {
  const metadata = await adminMetadata(params, "Writing Desk");
  if (typeof metadata.title === "string")
    metadata.title = { default: metadata.title, template: `%s | ${site.name}` };
  return metadata;
}
export const dynamic = "force-dynamic";
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ desk: string }>;
}) {
  const path = await requireAdminRoute(params);
  return <AdminPathProvider path={path}><div className="admin-area">{children}</div></AdminPathProvider>;
}
