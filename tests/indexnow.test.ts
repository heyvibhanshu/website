import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ jobs: [{ path: "/writing/public-post", kind: "public", version: 2, lease_token: "lease", attempts: 1 }], rpc: vi.fn(), fetch: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ rpc: state.rpc }) }));
vi.mock("@/lib/supabase/config", () => ({ supabaseConfig: () => ({ url: "https://test.supabase.co", key: "public-key" }) }));
import { processIndexNow } from "../lib/indexnow/worker";
import { GET as cron } from "../app/api/indexnow/route";
beforeEach(() => {
 vi.stubEnv("VERCEL_ENV", "production"); vi.stubEnv("INDEXNOW_KEY", "a".repeat(64)); vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "server-only-test-key");
 state.rpc.mockReset().mockImplementation(async name => ({ data: name === "claim_indexnow_jobs" ? state.jobs : null, error: null }));
 state.fetch.mockReset().mockResolvedValueOnce(new Response("a".repeat(64))).mockResolvedValue(new Response(null, { status: 202 }));
 vi.stubGlobal("fetch", state.fetch);
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe("server-only IndexNow submissions", () => {
 it("proves ownership and submits one deduplicated batch to the official endpoint, accepting pending key validation", async () => {
  expect(await processIndexNow()).toMatchObject({ state: "success", status: 202 });
  const [endpoint, request] = state.fetch.mock.calls[1];
  expect(endpoint).toBe("https://api.indexnow.org/indexnow");
  expect(JSON.parse(request.body)).toMatchObject({ host: "vibhanshurathod.com", keyLocation: "https://vibhanshurathod.com/indexnow-key.txt", urlList: ["https://vibhanshurathod.com/writing/public-post", "https://vibhanshurathod.com/", "https://vibhanshurathod.com/writing"] });
  expect(state.rpc).toHaveBeenLastCalledWith("finish_indexnow_jobs", expect.objectContaining({ p_outcome: "success" }));
 });
 it("never claims or submits from preview deployments or for an unverified key", async () => {
  vi.stubEnv("VERCEL_ENV", "preview"); await processIndexNow(); expect(state.fetch).not.toHaveBeenCalled();
  vi.stubEnv("VERCEL_ENV", "production"); state.fetch.mockReset().mockResolvedValue(new Response("wrong key"));
  expect(await processIndexNow()).toMatchObject({ state: "ownership-unverified" }); expect(state.rpc).not.toHaveBeenCalled();
 });
 it("durably reschedules transient errors and Retry-After instead of waiting inside a request", async () => {
  state.fetch.mockReset().mockResolvedValueOnce(new Response("a".repeat(64))).mockResolvedValueOnce(new Response(null, { status: 429, headers: { "Retry-After": "3600" } }));
  const before = Date.now();
  expect(await processIndexNow()).toMatchObject({ state: "retry", status: 429 });
  const payload = state.rpc.mock.calls.at(-1)![1];
  expect(Date.parse(payload.p_retry_at)).toBeGreaterThanOrEqual(before + 3600000);
 });
 it("returns network failures to the durable outbox and dead-letters permanent errors", async () => {
  state.fetch.mockReset().mockResolvedValueOnce(new Response("a".repeat(64))).mockRejectedValueOnce(new Error("Network down"));
  expect(await processIndexNow()).toMatchObject({ state: "retry" });
  state.fetch.mockReset().mockResolvedValueOnce(new Response("a".repeat(64))).mockResolvedValueOnce(new Response(null, { status: 403 }));
  expect(await processIndexNow()).toMatchObject({ state: "failed", status: 403 });
 });
 it("requires a configured bearer secret on the worker endpoint", async () => {
  expect((await cron(new Request("https://example.com/api/indexnow"))).status).toBe(401);
  vi.stubEnv("CRON_SECRET", "test-worker-secret");
  expect((await cron(new Request("https://example.com/api/indexnow", { headers: { authorization: "Bearer test-worker-secret" } }))).status).toBe(200);
 });
});
