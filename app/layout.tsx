import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Header, Footer } from "@/components/shell";
import { seo } from "@/content/seo";
import { rootMetadata } from "@/lib/seo/metadata";
import "./globals.css";
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  preload: false,
});
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  style: ["normal", "italic"],
  preload: false,
});
export const viewport: Viewport = {
  themeColor: seo.themeColor,
  viewportFit: "cover",
};
export const metadata: Metadata = rootMetadata();
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={seo.language}>
      <body
        className={`${geist.variable} ${newsreader.variable} ${mono.variable}`}
      >
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Header />
        <main id="main" className="shell main-content">
          {children}
        </main>
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
