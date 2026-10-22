import { seo } from "./seo";
export const site = {
  name: seo.name,
  domain: seo.origin,
  title: seo.title,
  description: seo.description,
  email: seo.email,
  tagline: seo.tagline,
  navigation: [
    { href: "/writing", label: "writing" },
    { href: "/about", label: "about" },
  ],
  socials: seo.socials,
  home: {
    greeting: "Hey, I'm Vibhanshu.",
    introduction: [
      "I like building things, figuring out how they work, and occasionally writing about them.",
      [
        "I'm currently building ",
        { label: "superOS", href: "https://www.superos.to/" },
        " at ",
        { label: "Maturate", href: "https://www.maturate.ai/" },
        ", where we're making technology easier for everyone to use.",
      ],
      "This is my little corner of the internet. A collection of thoughts, experiments, things I've learned, and whatever else catches my curiosity.",
    ],
    postscript: "PS: my friends call me vibe. :D",
  },
};
