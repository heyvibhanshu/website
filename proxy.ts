import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfig } from "@/lib/supabase/config";
import { getAdminPath } from "@/lib/admin-path";

export async function proxy(request: NextRequest) {
  const path = getAdminPath();
  const pathname = request.nextUrl.pathname;
  if (!path || (pathname !== path && !pathname.startsWith(`${path}/`)))
    return NextResponse.next();

  let response = NextResponse.next({ request });
  const backend = supabaseConfig();
  if (backend) {
    const client = createServerClient(backend.url, backend.key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values) {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    await client.auth.getClaims();
  }
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

// Public pages and assets bypass session refresh and keep their CDN caching.
// The configured desk must be one non-reserved, extension-free path segment.
export const config = {
  matcher: ["/((?!writing(?:/|$)|about(?:/|$)|_next(?:/|$)|opengraph-image(?:/|$)|.*\\.).+)"],
};
