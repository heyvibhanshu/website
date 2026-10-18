import portrait from "@/public/me.webp";

// Only facts supplied by the owner appear here. Unwritten sections stay editable.
export const about = {
  portrait,
  portraitAlt: "Vibhanshu Rathod",
  portraitCaption: "",
  introduction:
    "I'm Vibhanshu. I like building things, figuring out how they work, and occasionally writing about them.",
  sections: [
    {
      title: "my story",
      markdown:
        "This little corner of the internet is a place to collect thoughts, experiments, and things I’ve learned.\n\nMore of my story will find its way here over time.",
    },
    {
      title: "what i'm working on",
      markdown:
        "I’m currently building [superOS](https://tosuperos.com) at [Maturate](https://maturate.ai), where we’re making technology easier for everyone to use.",
    },
    {
      title: "things i'm curious about",
      markdown:
        "Building things. Figuring out how they work. Following a question and seeing where it leads.\n\nThis is a space I’ll add to as I go.",
    },
  ],
};
