import { z } from "zod";
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null);
const imageUrl = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (v) => !v || (URL.canParse(v) && new URL(v).protocol === "https:"),
    "Use an HTTPS image URL.",
  )
  .transform((v) => v || null);
export const postSchema = z
  .object({
    id: z.union([z.uuid(), z.literal("")]),
    title: z.string().trim().min(1, "Add a title.").max(200),
    slug: z
      .string()
      .min(1)
      .max(120)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Use lowercase letters, numbers, and single hyphens.",
      ),
    description: optionalText(500),
    content: z.string().max(200000, "Keep articles below 200,000 characters."),
    status: z.enum(["draft", "published"]),
    published_at: z
      .string()
      .refine(
        (v) => !v || !Number.isNaN(Date.parse(v)),
        "Choose a valid publication date.",
      ),
    cover_image: imageUrl,
    seo_title: optionalText(200),
    seo_description: optionalText(500),
  })
  .superRefine((value, ctx) => {
    if (value.status === "published" && !value.content.trim())
      ctx.addIssue({
        code: "custom",
        path: ["content"],
        message: "Add some writing before publishing.",
      });
  });
export const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(1024),
});
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export function imageExtension(bytes: Uint8Array, mime: string): string | null {
  if (
    mime === "image/png" &&
    [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v)
  )
    return "png";
  if (
    mime === "image/jpeg" &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[2] === 255
  )
    return "jpg";
  const ascii = (start: number, end: number) =>
    String.fromCharCode(...bytes.slice(start, end));
  if (
    mime === "image/webp" &&
    ascii(0, 4) === "RIFF" &&
    ascii(8, 12) === "WEBP"
  )
    return "webp";
  return null;
}
