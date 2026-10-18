import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfig } from "@/lib/supabase/config";
export async function requireOwner() {
  if (!supabaseConfig()) redirect("/cms-admin/login");
  const client = await createClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) redirect("/cms-admin/login");
  const { data: owner, error: ownerError } = await client.rpc("is_site_owner");
  if (ownerError || owner !== true)
    redirect("/cms-admin/login?error=unauthorized");
  return { client, user };
}
