import { seo } from "@/content/seo";
import { socialImage, socialImageSize } from "@/lib/social-image";
export const alt = seo.preview.alt;
export const size = socialImageSize;
export const contentType = "image/png";
export default function Image() {
  return socialImage("hey, i'm vibhanshu.", "this is my little corner of the internet.");
}
