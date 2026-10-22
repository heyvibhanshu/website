import { ImageResponse } from "next/og";
import { seo } from "@/content/seo";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export default function AppleIcon() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: seo.themeColor, color: "#222", fontSize: 112, fontFamily: "sans-serif" }}>v.</div>, size);
}
