import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import { Header, Footer } from "@/components/shell";
import { site } from "@/content/site";
import "./globals.css";
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  style: ["normal", "italic"],
});
export const viewport: Viewport = { themeColor: "#FAF9F6" };
export const metadata: Metadata = {
  metadataBase: new URL(site.domain),
  title: { default: site.title, template: `%s — ${site.name}` },
  description: site.description,
  alternates: { types: { "application/rss+xml": "/rss.xml" } },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: site.name,
    title: site.title,
    description: site.description,
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", creator: "@heyvibhanshu" },
  icons: { icon: "/icon.svg" },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
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
      </body>
    </html>
  );
}
