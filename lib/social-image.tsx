import { ImageResponse } from "next/og";

export const socialImageSize = { width: 1200, height: 630 };
export function SocialImage({ title, description }: { title: string; description?: string | null }) {
  const clip = (text: string, limit: number) => text.length > limit ? `${text.slice(0, limit - 1).trimEnd()}…` : text;
  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "100%", height: "100%", background: "#FAF9F6", color: "#222222", padding: "64px 88px", fontFamily: "sans-serif", overflow: "hidden" }}>
      <div style={{ fontSize: 22, color: "#656963", marginBottom: 32 }}>vibhanshurathod.com</div>
      <div style={{ fontSize: title.length > 80 ? 40 : 60, letterSpacing: "-1.5px", lineHeight: 1.2, maxHeight: 144, overflow: "hidden" }}>{clip(title, 120)}</div>
      {description && <div style={{ fontSize: 24, color: "#555", marginTop: 24, lineHeight: 1.35, maxHeight: 98, overflow: "hidden" }}>{clip(description, 180)}</div>}
      <div style={{ fontSize: 22, marginTop: 32 }}>be curious.</div>
    </div>
  );
}
export function socialImage(title: string, description?: string | null) {
  return new ImageResponse(<SocialImage title={title} description={description} />, socialImageSize);
}
