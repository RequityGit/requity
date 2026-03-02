"use client";

import { useState, useRef, useEffect } from "react";

interface DivisionTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = ["combined", "lending", "investments"] as const;

export function DivisionTabs({ activeTab, onTabChange }: DivisionTabsProps) {
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const el = tabRefs.current[activeTab];
    if (el) {
      setPillStyle({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [activeTab]);

  return (
    <div className="flex relative bg-dash-surface-alt rounded-md p-[3px] border border-border">
      {/* Sliding pill */}
      <div
        className="absolute top-[3px] h-[calc(100%-6px)] bg-card rounded shadow-sm dash-tab-pill"
        style={{ left: pillStyle.left, width: pillStyle.width }}
      />
      {TABS.map((key) => (
        <button
          key={key}
          ref={(el) => {
            tabRefs.current[key] = el;
          }}
          onClick={() => onTabChange(key)}
          className={`px-4 py-[5px] rounded border-none cursor-pointer text-[10.5px] font-semibold tracking-[0.03em] uppercase bg-transparent relative z-[1] transition-colors duration-150 ${
            activeTab === key ? "text-foreground" : "text-dash-text-mut"
          }`}
        >
          {key}
        </button>
      ))}
    </div>
  );
}
