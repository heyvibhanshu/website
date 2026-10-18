export function browserTitle(value: string) {
  const title = value.trim().replace(/\.+$/u, "").trimEnd();
  const [first = "", ...rest] = Array.from(title);
  return first.toLocaleUpperCase("en") + rest.join("");
}

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120)
    .replace(/-$/, "");
}
export function formatDate(
  value: string,
  style: "short" | "full" | "archive" = "short",
) {
  return new Intl.DateTimeFormat("en-US", {
    month: style === "full" ? "long" : "short",
    day: "numeric",
    ...(style !== "archive" && { year: "numeric" }),
    timeZone: "UTC",
  }).format(new Date(value));
}
export function readingTime(markdown: string) {
  return Math.max(1, Math.ceil(markdown.trim().split(/\s+/).length / 220));
}
export function escapeXml(value: string) {
  return value.replace(
    /[<>&"']/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
}
export function safeJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
