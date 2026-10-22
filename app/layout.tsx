import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Header, Footer } from "@/components/shell";
import { seo } from "@/content/seo";
import { rootMetadata } from "@/lib/seo/metadata";
import "./globals.css";
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
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
      <body className={geist.variable}>
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
