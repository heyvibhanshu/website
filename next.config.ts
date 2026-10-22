import type { NextConfig } from "next";
import { seo } from "./content/seo";
const devEval = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";
const config: NextConfig = {
  turbopack: { root: process.cwd() },
  poweredByHeader: false,
  trailingSlash: false,
  images: { imageSizes: [32, 48, 64, 96, 128, 200, 256, 384, 400] },
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
  async redirects() {
    return [
      ...seo.alternateHosts.map((host) => ({ source: "/:path*", has: [{ type: "host" as const, value: host.replaceAll(".", "\\.") }], destination: `${seo.origin}/:path*`, permanent: true })),
      { source: "/blog", destination: "/writing", permanent: true },
      { source: "/blog/:slug", destination: "/writing/:slug", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; script-src 'self' 'unsafe-inline'${devEval}; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; font-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-src https://www.youtube-nocookie.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`,
          },
        ],
      },
    ];
  },
};
export default config;
