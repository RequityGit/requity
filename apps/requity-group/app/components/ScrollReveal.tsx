"use client";

import { useEffect, useRef } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  /** Also animate direct children with staggered delays */
  staggerChildren?: boolean;
  /** Additional delay index (0.1s increments) */
  delay?: number;
}

export default function ScrollReveal({
  children,
  className = "",
  staggerChildren = false,
  delay,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
          observer.unobserve(el);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const baseClass = staggerChildren ? "reveal-children" : "reveal";
  const delayClass = delay ? `reveal-delay-${delay}` : "";

  return (
    <div ref={ref} className={`${baseClass} ${delayClass} ${className}`.trim()}>
      {children}
    </div>
  );
}
