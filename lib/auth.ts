import "server-only";
import { redirect, notFound } from "next/navigation";
import { getAdminPath } from "@/lib/admin-path";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfig } from "@/lib/supabase/config";
export async function requireOwner() {
  const path = getAdminPath();
  if (!path) notFound();
  if (!supabaseConfig()) redirect(`${path}/login`);
  const client = await createClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) redirect(`${path}/login`);
  const { data: owner, error: ownerError } = await client.rpc("is_site_owner");
  if (ownerError || owner !== true)
    redirect(`${path}/login?error=unauthorized`);
  return { client, user };
}
