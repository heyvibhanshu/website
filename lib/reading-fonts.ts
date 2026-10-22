import { Geist_Mono, Newsreader } from "next/font/google";

// Only articles and the writing desk need reading/code fonts. Keep their
// font-face declarations out of the homepage's render-blocking stylesheet.
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
export const readingFontClassName = `${newsreader.variable} ${mono.variable}`;
