import Link from "next/link";
export const metadata = { title: "Page Not Found", robots: { index: false, follow: false }, alternates: { canonical: null }, openGraph: null, twitter: null };
export default function NotFound() {
  return (
    <div className="page-heading">
      <p className="eyebrow">404</p>
      <h1>A page out of place.</h1>
      <p>This page doesn’t exist, or the writing isn’t public yet.</p>
      <Link className="text-link" href="/">
        ← back home
      </Link>
    </div>
  );
}
