type PageDefinition = { path: `/${string}`; title: string; description: string };
type SeoConfiguration = {
  name: string; alternateNames: string[]; title: string; description: string;
  tagline: string; origin: `https://${string}`; language: string; locale: string;
  themeColor: string; email: string; socials: Record<string, string>; xSite: `@${string}`;
  preview: { path: string; alt: string; width: number; height: number; type: string };
  pages: Record<"home" | "writing" | "about", PageDefinition>;
  organization: { name: string; url: string };
  relatedProduct: { name: string; description: string; url: string };
  externalRedirects: string[]; alternateHosts: string[];
};
const description = "Thoughts, experiments, and things learned along the way by me.";
export const seo = {
  name: "Vibhanshu Rathod", alternateNames: ["Vibe"], title: "Vibhanshu Rathod", description,
  tagline: "be curious.", origin: "https://vibhanshurathod.com", language: "en-IN", locale: "en_IN",
  themeColor: "#FAF9F6", email: "hey@vibhanshurathod.com", xSite: "@heyvibhanshu",
  socials: { x: "https://x.com/heyvibhanshu", github: "https://github.com/heyvibhanshu", linkedin: "https://www.linkedin.com/in/heyvibhanshu/" },
  preview: { path: "/opengraph-image", alt: "hey, i'm vibhanshu. this is my corner of the internet. be curious.", width: 1200, height: 630, type: "image/png" },
  pages: {
    home: { path: "/", title: "Vibhanshu Rathod", description },
    writing: { path: "/writing", title: "Writing", description: "Thoughts, ideas, experiments, and things I've learned along the way." },
    about: { path: "/about", title: "About Me", description: "I'm Vibhanshu. I like building things, figuring out how they work, and occasionally writing about them." },
  },
  organization: { name: "Maturate", url: "https://www.maturate.ai/" },
  // Supplied by the owner. Emit product schema only on an actual product page.
  relatedProduct: { name: "superOS", description: "superOS is an operating system where AI agents replace apps.", url: "https://www.superos.to/" },
  externalRedirects: ["https://superos.to/founder", "https://superos.to/vibe"],
  alternateHosts: ["www.vibhanshurathod.com", "heyvibhanshu.vercel.app", "website-vibhanshu-rathod.vercel.app"],
} satisfies SeoConfiguration;
