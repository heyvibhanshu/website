import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { remarkUnderline } from "@/lib/remark-underline";
export function Markdown({ content }: { content: string }) {
  return (
    <div className="prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkUnderline]}
        rehypePlugins={[rehypeHighlight]}
        skipHtml
        components={{
          a({ href, children, node, ...props }) {
            void node;
            const external = /^(?:https?:)?\/\//i.test(href || "");
            return (
              <a
                href={href}
                {...props}
                {...(external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {children}
              </a>
            );
          },
          img({ src, alt, title }) {
            // Markdown images can have unknown dimensions; native responsive images preserve their ratio.
            if (
              typeof src !== "string" ||
              !(
                (src.startsWith("/") && !src.startsWith("//")) ||
                src.startsWith("https://")
              )
            )
              return null;
            return (
              <span className="article-image">
                <img
                  src={src}
                  alt={alt || ""}
                  loading="lazy"
                  decoding="async"
                />
                {title && <span className="image-caption">{title}</span>}
              </span>
            );
          },
          pre({ children }) {
            return <pre tabIndex={0}>{children}</pre>;
          },
          table({ children }) {
            return (
              <div
                className="table-scroll"
                tabIndex={0}
                role="region"
                aria-label="Scrollable table"
              >
                <table>{children}</table>
              </div>
            );
          },
          code({ className, children, node, ...props }) {
            void node;
            if (className?.split(/\s+/).includes("language-youtube")) {
              const id = String(children).trim();
              if (/^[a-zA-Z0-9_-]{11}$/.test(id))
                return (
                  <iframe
                    className="video-embed"
                    src={`https://www.youtube-nocookie.com/embed/${id}`}
                    title="Embedded YouTube video"
                    loading="lazy"
                    sandbox="allow-scripts allow-same-origin allow-presentation"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
