import { socialImage, socialImageSize } from "@/lib/social-image";
export const alt = "Vibhanshu Rathod — This is my little corner of the internet.";
export const size = socialImageSize;
export const contentType = "image/png";
export default function Image() {
  return socialImage("hey, i'm vibhanshu.", "This is my little corner of the internet.");
}
