import "server-only";
import type { Metadata } from "next";
import { getAdminPath } from "./admin-path";
import { site } from "@/content/site";

export async function adminMetadata(params: Promise<{ desk: string }>, title: string): Promise<Metadata> {
  const { desk } = await params;
  return {
    title: getAdminPath() === `/${desk}` ? title : { absolute: `Page Not Found | ${site.name}` },
    robots: { index: false, follow: false },
    alternates: { canonical: null },
    openGraph: null,
    twitter: null,
  };
}
