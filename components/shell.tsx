import Link from "next/link";
import { Navigation } from "./navigation";
import { site } from "@/content/site";
export function Header() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link href="/" className="wordmark" prefetch={true}>
          vibhanshu rathod
        </Link>
        <Navigation />
      </div>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <span className="tagline">{site.tagline}</span>
        <nav aria-label="Contact links">
          <a href={`mailto:${site.email}`}>email</a>
          {Object.entries(site.socials)
            .filter(([, url]) => url)
            .map(([label, url]) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {label}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            ))}
        </nav>
      </div>
    </footer>
  );
}
