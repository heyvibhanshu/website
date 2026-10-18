"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="page-heading">
      <h1>A small interruption.</h1>
      <p>This page couldn’t load just now. Please try again in a moment.</p>
      <button className="button" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
