import { seo } from "@/content/seo";
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
export const INDEXNOW_KEY_PATH = "/indexnow-key.txt";
export function indexNowKey() {
  const key = process.env.INDEXNOW_KEY;
  return key && /^[a-zA-Z0-9-]{8,128}$/.test(key) ? key : null;
}
export function indexNowEnabled() {
  return process.env.VERCEL_ENV === "production" && Boolean(indexNowKey());
}
export function eligiblePath(path: string) {
  return Object.values(seo.pages).some(p => p.path === path) || /^\/writing\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path) && path.length <= 129;
}
export function retryAt(header: string | null, attempt: number, now = Date.now()) {
  const seconds = header && /^\d+$/.test(header.trim()) ? Number(header) * 1000 : NaN;
  const date = header && !Number.isFinite(seconds) ? Date.parse(header) : NaN;
  // Honor Retry-After even if it is longer than the exponential fallback.
  return new Date(Math.max(now + Math.min(86400000, 60000 * 2 ** Math.min(attempt, 10)), Number.isFinite(seconds) ? now + seconds : 0, Number.isFinite(date) ? date : 0)).toISOString();
}
