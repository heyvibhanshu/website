import "server-only";
import { createClient } from "@supabase/supabase-js";
import { seo } from "@/content/seo";
import { canonicalUrl } from "@/lib/seo/metadata";
import { supabaseConfig } from "@/lib/supabase/config";
import { INDEXNOW_ENDPOINT, INDEXNOW_KEY_PATH, indexNowKey, indexNowEnabled, eligiblePath, retryAt } from "./config";
type Job = { path: string; version: number; lease_token: string; attempts: number; kind: "public" | "removed" | "collection" };
export async function processIndexNow() {
  if (!indexNowEnabled()) return { state: "disabled" };
  const backend = supabaseConfig();
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!backend || !secret) return { state: "unconfigured" };
  const client = createClient(backend.url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  // Verify the canonical host serves this key before claiming or sending jobs.
  const keyLocation = canonicalUrl(INDEXNOW_KEY_PATH);
  const ownership = await fetch(keyLocation, { redirect: "error", cache: "no-store", signal: AbortSignal.timeout(5000) });
  if (ownership.status !== 200 || (await ownership.text()).trim() !== indexNowKey()) {
    console.warn("IndexNow", { state: "ownership-unverified" });
    return { state: "ownership-unverified" };
  }
  const { data, error } = await client.rpc("claim_indexnow_jobs");
  if (error) throw new Error("IndexNow queue is unavailable.");
  const jobs = (data || []) as Job[];
  if (!jobs.length) return { state: "idle" };
  const valid = jobs.filter(j => eligiblePath(j.path));
  async function finish(batch: Job[], outcome: string, next: string | null, status: number | null) {
    if (!batch.length) return;
    const { error } = await client.rpc("finish_indexnow_jobs", { p_jobs: batch.map(({ path, version, lease_token }) => ({ path, version, lease_token })), p_outcome: outcome, p_retry_at: next, p_status: status });
    if (error) throw new Error("IndexNow queue acknowledgement failed.");
  }
  await finish(jobs.filter(j => !eligiblePath(j.path)), "failed", null, null);
  if (!valid.length) return { state: "ineligible" };
  let status: number | null = null;
  let outcome = "retry";
  let next = retryAt(null, Math.max(...valid.map(j => j.attempts)));
  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: new URL(seo.origin).hostname, key: indexNowKey(), keyLocation, urlList: [...new Set([...valid.map(j => canonicalUrl(j.path)), ...(valid.some(j => j.kind === "public") ? [canonicalUrl("/"), canonicalUrl("/writing")] : [])])] }),
      redirect: "error", signal: AbortSignal.timeout(8000),
    });
    status = response.status;
    outcome = status === 200 || status === 202 ? "success" : status === 429 || status >= 500 || status === 408 ? "retry" : "failed";
    next = retryAt(response.headers.get("Retry-After"), Math.max(...valid.map(j => j.attempts)));
  } catch { /* The durable lease is returned to pending; no in-memory timers. */ }
  await finish(valid, outcome, next, status);
  // Counts/status only: never log keys, credentials, URLs, article content, or response bodies.
  console.info("IndexNow", { outcome, status, count: valid.length });
  return { state: outcome, status, count: valid.length };
}
export async function runIndexNowSafely() {
  try { return await processIndexNow(); }
  catch { console.warn("IndexNow", { state: "worker-error" }); return { state: "worker-error" }; }
}
