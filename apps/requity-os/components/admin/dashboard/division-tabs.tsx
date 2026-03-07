"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DivisionTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = ["combined", "lending", "investments"] as const;

export function DivisionTabs({ activeTab, onTabChange }: DivisionTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList className="bg-dash-surface-alt border border-border h-auto p-[3px]">
        {TABS.map((key) => (
          <TabsTrigger
            key={key}
            value={key}
            className="px-4 py-[5px] text-[10.5px] font-semibold tracking-[0.03em] uppercase data-[state=inactive]:text-dash-text-mut"
          >
            {key}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
