import { timingSafeEqual } from "node:crypto";
import { runIndexNowSafely } from "@/lib/indexnow/worker";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization") || "";
  const expected = `Bearer ${secret}`;
  const allowed = secret && Buffer.byteLength(authorization) === Buffer.byteLength(expected) && timingSafeEqual(Buffer.from(authorization), Buffer.from(expected));
  if (!allowed) return new Response("Unauthorized", { status: 401, headers: { "X-Robots-Tag": "noindex", "Cache-Control": "no-store" } });
  const result = await runIndexNowSafely();
  return Response.json(result, { status: ["worker-error", "unconfigured", "ownership-unverified"].includes(result.state) ? 503 : 200, headers: { "X-Robots-Tag": "noindex", "Cache-Control": "no-store" } });
}
