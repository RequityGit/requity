"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Braces, Search } from "lucide-react";
import type { UserEmailTemplateVariable } from "@/lib/types/user-email-templates";

interface VariableInserterProps {
  variables: UserEmailTemplateVariable[];
  onInsert: (key: string) => void;
}

const sourceColors: Record<string, string> = {
  contact: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  loan: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  computed: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  static: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  user: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

export function VariableInserter({
  variables,
  onInsert,
}: VariableInserterProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = variables.filter(
    (v) =>
      v.key.toLowerCase().includes(search.toLowerCase()) ||
      v.label.toLowerCase().includes(search.toLowerCase())
  );

  // Group by source
  const grouped = filtered.reduce(
    (acc, v) => {
      if (!acc[v.source]) acc[v.source] = [];
      acc[v.source].push(v);
      return acc;
    },
    {} as Record<string, UserEmailTemplateVariable[]>
  );

  const sourceOrder = ["contact", "loan", "computed", "static", "user"];

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs"
        onClick={() => setOpen(true)}
      >
        <Braces className="h-3 w-3" />
        Insert Variable
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm max-h-[60vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-sm">Insert Variable</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search variables..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-7 text-xs"
            />
          </div>
          <div className="flex-1 overflow-y-auto space-y-2">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No variables found
              </p>
            ) : (
              sourceOrder
                .filter((s) => grouped[s]?.length)
                .map((source) => (
                  <div key={source}>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase px-1 py-1">
                      {source}
                    </p>
                    {grouped[source].map((v) => (
                      <button
                        key={v.key}
                        type="button"
                        className="w-full text-left px-2 py-1.5 rounded-sm text-xs hover:bg-muted transition-colors flex items-center justify-between gap-2"
                        onClick={() => {
                          onInsert(v.key);
                          setOpen(false);
                          setSearch("");
                        }}
                      >
                        <div className="min-w-0">
                          <span className="font-mono text-[11px]">
                            {`{{${v.key}}}`}
                          </span>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {v.label}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[9px] shrink-0 ${sourceColors[v.source] ?? ""}`}
                        >
                          {v.source}
                        </Badge>
                      </button>
                    ))}
                  </div>
                ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
