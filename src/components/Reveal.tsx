"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Reveal — wraps children and toggles `data-reveal="in"` when it scrolls
 * into view, triggering the fade-in animation defined in globals.css.
 *
 * Zero JS cost after the observer fires once. Respects prefers-reduced-motion
 * (CSS media query in globals.css disables the transition automatically).
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            if (delay > 0) {
              window.setTimeout(() => setInView(true), delay);
            } else {
              setInView(true);
            }
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  return (
    <div ref={ref} data-reveal={inView ? "in" : ""} className={className}>
      {children}
    </div>
  );
}
