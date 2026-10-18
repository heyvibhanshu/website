import type { Metadata } from "next";
import { requireAdminRoute } from "@/lib/admin-route";
import { AdminPathProvider } from "@/components/admin/admin-path";
export const metadata: Metadata = {
  title: "Private writing desk",
  robots: { index: false, follow: false },
  openGraph: null,
  twitter: null,
};
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
