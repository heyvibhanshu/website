import { ImageResponse } from "next/og";
export const alt = "Vibhanshu Rathod — a personal notebook";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        background: "#FAF9F6",
        color: "#222222",
        padding: "100px",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ fontSize: 24, color: "#656963", marginBottom: 60 }}>
        vibhanshurathod.com
      </div>
      <div style={{ fontSize: 64, letterSpacing: "-2px" }}>
        hey, i&apos;m vibhanshu.
      </div>
      <div style={{ fontSize: 28, color: "#555", marginTop: 24 }}>
        A personal notebook on the internet.
      </div>
      <div style={{ fontSize: 24, fontStyle: "italic", marginTop: 80 }}>
        be curious.
      </div>
    </div>,
    size,
  );
}
