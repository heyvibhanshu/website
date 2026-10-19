"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

// Archives can contain many articles. Fetch only after someone shows interest.
export function IntentLink({ href, children }: { href: string; children: ReactNode }) {
  const [interested, setInterested] = useState(false);
  return (
    <Link
      href={href}
      prefetch={interested ? null : false}
      onMouseEnter={() => setInterested(true)}
      onFocus={() => setInterested(true)}
    >
      {children}
    </Link>
  );
}
