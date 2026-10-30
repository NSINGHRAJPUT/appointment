"use client";

import { useEffect, useState } from "react";

export default function HomeScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="pointer-events-none fixed left-0 top-0 z-[60] h-0.5 w-full bg-transparent"
      aria-hidden
    >
      <div
        className="h-full bg-gradient-to-r from-primary via-tertiary to-secondary transition-[width] duration-150 ease-out shadow-[0_0_12px_rgba(64,129,117,0.45)]"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}
