import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { parseAdminPath } from "../lib/admin-path";
import { proxy, config } from "../proxy";
import { requireAdminRoute } from "../lib/admin-route";

const claims = vi.hoisted(() => vi.fn(async () => ({ data: null, error: null })));
vi.mock("server-only", () => ({}));
vi.mock("@supabase/ssr", () => ({ createServerClient: () => ({ auth: { getClaims: claims } }) }));
vi.mock("@/lib/supabase/config", () => ({ supabaseConfig: () => ({ url: "https://test.supabase.co", key: "test" }) }));
vi.mock("next/navigation", () => ({ notFound: () => { throw Error("NOT_FOUND"); } }));
afterEach(() => { vi.unstubAllEnvs(); claims.mockClear(); });

describe("environment-configured writing desk", () => {
  it("has no default, rejects unsafe and reserved paths, and accepts a chosen segment", () => {
    for (const value of [undefined, "", "/", "/admin", "/writing", "/about", "//example.com", "/desk/login", "/desk?x=1", "/Uppercase", "/desk.html", "/_next"])
      expect(parseAdminPath(value)).toBeNull();
    expect(parseAdminPath("/test-desk-9")).toBe("/test-desk-9");
  });
  it("fails closed without configuration and validates every requested desk before rendering", async () => {
    vi.stubEnv("CMS_ADMIN_PATH", "");
    await expect(requireAdminRoute(Promise.resolve({ desk: "test-desk" }))).rejects.toThrow("NOT_FOUND");
    vi.stubEnv("CMS_ADMIN_PATH", "/test-desk");
    await expect(requireAdminRoute(Promise.resolve({ desk: "other-desk" }))).rejects.toThrow("NOT_FOUND");
    await expect(requireAdminRoute(Promise.resolve({ desk: "test-desk" }))).resolves.toBe("/test-desk");
  });
  it("keeps public pages, article previews, and assets out of the auth proxy", () => {
    for (const url of ["/", "/about", "/writing", "/writing/a-post", "/writing/a-post/preview", "/opengraph-image", "/me.webp", "/rss.xml", "/_next/static/file.js"])
      expect(unstable_doesMiddlewareMatch({ config, url })).toBe(false);
    for (const url of ["/test-desk", "/test-desk/login", "/test-desk/new"])
      expect(unstable_doesMiddlewareMatch({ config, url })).toBe(true);
  });
  it("refreshes sessions only at the configured path and marks responses private and noindex", async () => {
    vi.stubEnv("CMS_ADMIN_PATH", "/test-desk");
    const response = await proxy(new NextRequest("https://example.com/test-desk/login"));
    expect(claims).toHaveBeenCalledTimes(1);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    await proxy(new NextRequest("https://example.com/test-desk-other/login"));
    expect(claims).toHaveBeenCalledTimes(1);
  });
});
