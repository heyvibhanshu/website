import Image from "next/image";
import { about } from "@/content/about";
import { Markdown } from "@/components/writing/markdown";
export const metadata = {
  title: "about me",
  description:
    "I'm Vibhanshu. I like building things, figuring out how they work, and occasionally writing about them.",
  alternates: { canonical: "/about" },
};
export default function About() {
  return (
    <>
      <div className="page-heading">
        <h1>about me.</h1>
      </div>
      <section className="about-introduction" aria-label="Introduction">
        <figure>
          <Image
            src={about.portrait}
            alt={about.portraitAlt}
            width={480}
            height={600}
            priority
          />
          <figcaption>{about.portraitCaption}</figcaption>
        </figure>
        <p>{about.introduction}</p>
      </section>
      <div className="about-sections">
        {about.sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            <Markdown content={section.markdown} />
          </section>
        ))}
      </div>
    </>
  );
}
