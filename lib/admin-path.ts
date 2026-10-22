const reserved = new Set(["admin", "writing", "about", "blog", "api", "_next", "opengraph-image", "sitemaps", "apple-icon"]);

export function parseAdminPath(value: string | undefined): string | null {
  if (!value || !/^\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) return null;
  return reserved.has(value.slice(1)) ? null : value;
}

export function getAdminPath() {
  return parseAdminPath(process.env.CMS_ADMIN_PATH);
}
