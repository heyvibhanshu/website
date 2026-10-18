import "server-only";
import { notFound } from "next/navigation";
import { getAdminPath } from "./admin-path";

export async function requireAdminRoute(params: Promise<{ desk: string }>) {
  const path = getAdminPath();
  const { desk } = await params;
  if (!path || `/${desk}` !== path) notFound();
  return path;
}
