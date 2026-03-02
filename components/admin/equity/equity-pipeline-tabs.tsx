"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EquityKanban } from "./equity-kanban";
import { EquityListView } from "./equity-list-view";
import { LayoutGrid, List, Building2 } from "lucide-react";
import type { EquityDealRow } from "./equity-kanban";

interface EquityPipelineTabsProps {
  deals: EquityDealRow[];
  dealCount: number;
}

export function EquityPipelineTabs({
  deals,
  dealCount,
}: EquityPipelineTabsProps) {
  const [view, setView] = useState<"board" | "list">("board");

  return (
    <Tabs defaultValue="pipeline">
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="pipeline" className="gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            Pipeline
            <span className="ml-1 rounded-full bg-slate-200 text-slate-700 text-[10px] font-semibold px-1.5 py-0.5">
              {dealCount}
            </span>
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-1 border rounded-md p-0.5">
          <button
            onClick={() => setView("board")}
            className={`p-1.5 rounded-sm transition-colors ${
              view === "board"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Board view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("list")}
            className={`p-1.5 rounded-sm transition-colors ${
              view === "list"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      <TabsContent value="pipeline" className="mt-4">
        {view === "board" ? (
          <EquityKanban data={deals} />
        ) : (
          <EquityListView data={deals} />
        )}
      </TabsContent>
    </Tabs>
  );
}
