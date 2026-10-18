"use client";
import { createContext, useContext } from "react";

const AdminPath = createContext<string | null>(null);
export function AdminPathProvider({ path, children }: { path: string; children: React.ReactNode }) {
  return <AdminPath.Provider value={path}>{children}</AdminPath.Provider>;
}
export function useAdminPath() {
  const path = useContext(AdminPath);
  if (!path) throw new Error("The writing desk has no configured path.");
  return path;
}
