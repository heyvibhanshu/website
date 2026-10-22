import { ImageResponse } from "next/og";

export const socialImageSize = { width: 1200, height: 630 };
export function SocialImage({ title, description }: { title: string; description?: string | null }) {
  const clip = (text: string, limit: number) => text.length > limit ? `${text.slice(0, limit - 1).trimEnd()}…` : text;
  const titleSize = title.length > 80 ? 46 : title.length > 40 ? 60 : 80;
  const descriptionSize = description && description.length > 100 ? 30 : 38;
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "#FAF9F6", color: "#222222", padding: "64px 88px", fontFamily: "sans-serif", overflow: "hidden" }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, minHeight: 0 }}>
        <div style={{ fontSize: titleSize, letterSpacing: "-1.5px", lineHeight: 1.15, maxHeight: titleSize * 1.15 * 3, overflow: "hidden", flexShrink: 0 }}>{clip(title, 120)}</div>
        {description && <div style={{ fontSize: descriptionSize, color: "#555", marginTop: 28, lineHeight: 1.35, maxHeight: descriptionSize * 1.35 * 3, overflow: "hidden", flexShrink: 0 }}>{clip(description, 180)}</div>}
      </div>
      <div style={{ fontSize: 24, lineHeight: 1.2, marginTop: 32, flexShrink: 0 }}>be curious.</div>
    </div>
  );
}
export function socialImage(title: string, description?: string | null) {
  return new ImageResponse(<SocialImage title={title} description={description} />, socialImageSize);
}
