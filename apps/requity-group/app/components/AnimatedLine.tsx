"use client";

import { useEffect, useRef } from "react";

interface AnimatedLineProps {
  light?: boolean;
  delay?: number;
  className?: string;
}

export default function AnimatedLine({
  light = false,
  delay = 0,
  className = "",
}: AnimatedLineProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add("visible"), delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`animated-line ${light ? "on-navy" : "on-cream"} ${className}`.trim()}
    />
  );
}
