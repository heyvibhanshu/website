import { indexNowKey } from "@/lib/indexnow/config";
import { isPreviewDeployment } from "@/lib/seo/metadata";
export const dynamic = "force-dynamic";
export function GET() {
  const key = indexNowKey();
  return new Response(key && !isPreviewDeployment() ? key : "Not found", { status: key && !isPreviewDeployment() ? 200 : 404, headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex", "Cache-Control": "no-store" } });
}
