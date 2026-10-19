import { getImageProps } from "next/image";
import { about } from "@/content/about";
import { Markdown } from "@/components/writing/markdown";
export const metadata = {
  title: "About Me",
  description:
    "I'm Vibhanshu. I like building things, figuring out how they work, and occasionally writing about them.",
  alternates: { canonical: "/about" },
};
export default function About() {
  const { props: portrait } = getImageProps({
    src: about.portrait,
    alt: about.portraitAlt,
    sizes: "(max-width: 600px) 200px, 188px",
    // Route prefetching must not download the portrait on other pages.
    loading: "lazy",
    fetchPriority: "high",
  });
  return (
    <>
      <div className="page-heading">
        <h1>About me.</h1>
      </div>
      <section className="about-introduction" aria-label="Introduction">
        <figure>
          <img {...portrait} />
          {about.portraitCaption && (
            <figcaption>{about.portraitCaption}</figcaption>
          )}
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
