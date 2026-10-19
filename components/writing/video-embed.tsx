"use client";

import { useState } from "react";

export function VideoEmbed({ id }: { id: string }) {
  const [playing, setPlaying] = useState(false);
  if (playing)
    return (
      <iframe
        className="video-embed"
        src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
        title="Embedded YouTube video"
        sandbox="allow-scripts allow-same-origin allow-presentation"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    );

  return (
    <a
      className="video-embed video-placeholder"
      href={`https://www.youtube.com/watch?v=${id}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        setPlaying(true);
      }}
    >
      <span aria-hidden="true">▶</span>
      <span>Play YouTube video</span>
    </a>
  );
}
