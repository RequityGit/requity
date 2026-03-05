"use client";

import { useState, useEffect } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface DeltaBadgeProps {
  value: string;
  up?: boolean;
  delay?: number;
}

export function DeltaBadge({ value, up = true, delay = 0 }: DeltaBadgeProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay + 600);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <span
      className={`
        num text-[10.5px] font-semibold px-1.5 py-0.5 rounded-[3px]
        inline-flex items-center gap-0.5
        transition-all duration-300
        ${up ? "bg-dash-success/[0.08] text-dash-success" : "bg-dash-danger/[0.06] text-dash-danger"}
        ${show ? "opacity-100 scale-100" : "opacity-0 scale-[0.8]"}
      `}
    >
      {up ? (
        <ArrowUpRight size={10} strokeWidth={2.5} />
      ) : (
        <ArrowDownRight size={10} strokeWidth={2.5} />
      )}
      {value}
    </span>
  );
}
