import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Private writing desk",
  robots: { index: false, follow: false },
  openGraph: null,
  twitter: null,
};
export const dynamic = "force-dynamic";
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="admin-area">{children}</div>;
}
