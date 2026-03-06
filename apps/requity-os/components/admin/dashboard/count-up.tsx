"use client";

import { useState, useEffect, useRef } from "react";

interface CountUpProps {
  end: number;
  duration?: number;
  delay?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function CountUp({
  end,
  duration = 900,
  delay = 0,
  prefix = "",
  suffix = "",
  decimals = 0,
}: CountUpProps) {
  const [val, setVal] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (started.current) return;
      started.current = true;
      const startTime = performance.now();
      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setVal(eased * end);
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(timeout);
  }, [end, duration, delay]);

  const display = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toString();

  return (
    <span>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
