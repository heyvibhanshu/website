import Link from "next/link";
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
