"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { site } from "@/content/site";
export function Navigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main navigation">
      {site.navigation.map(({ href, label }) => {
        const active =
          href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            prefetch={true}
            aria-current={active ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
