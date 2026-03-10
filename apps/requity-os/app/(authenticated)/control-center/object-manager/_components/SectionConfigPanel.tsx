"use client";

import {
  X,
  Link2,
  Calculator,
  TrendingUp,
  Rows,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@repo/lib";
import type { PageSection } from "../actions";

interface Props {
  section: PageSection;
  onClose: () => void;
}

const SECTION_TYPES = [
  { v: "fields", l: "Fields", color: "text-muted-foreground" },
  { v: "relationship", l: "Relationship", color: "text-purple-500" },
  { v: "computed", l: "Card Type", color: "text-yellow-600" },
  { v: "proforma", l: "Pro Forma", color: "text-cyan-500" },
];

export function SectionConfigPanel({ section, onClose }: Props) {
  const isRel = section.section_type === "relationship";
  const isComputed = section.section_type === "computed";
  const isProforma = section.section_type === "proforma";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border flex items-center gap-2">
        <div
          className={cn(
            "w-[26px] h-[26px] rounded-md flex items-center justify-center",
            isRel && "bg-purple-500/10",
            isComputed && "bg-yellow-600/10",
            isProforma && "bg-cyan-500/10",
            !isRel && !isComputed && !isProforma && "bg-muted"
          )}
        >
          {isRel ? (
            <Link2 size={13} className="text-purple-500" />
          ) : isComputed ? (
            <Calculator size={13} className="text-yellow-600" />
          ) : isProforma ? (
            <TrendingUp size={13} className="text-cyan-500" />
          ) : (
            <Rows size={13} className="text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold truncate">{section.section_label}</div>
          <div className="text-[9px] text-muted-foreground">
            {section.section_type} section
          </div>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X size={13} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-3">
          <div>
            <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Section Name
            </label>
            <Input value={section.section_label} className="h-8 text-xs" readOnly />
          </div>

          <div>
            <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Section Type
            </label>
            <div className="grid grid-cols-2 gap-1">
              {SECTION_TYPES.map((st) => (
                <div
                  key={st.v}
                  className={cn(
                    "px-2 py-1.5 rounded border text-xs text-center cursor-pointer transition-colors",
                    section.section_type === st.v
                      ? `${st.color} border-current bg-current/10`
                      : "border-border text-muted-foreground"
                  )}
                >
                  {st.l}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs">Default Collapsed</span>
              <br />
              <span className="text-[9px] text-muted-foreground">Start section minimized</span>
            </div>
            <Switch checked={section.default_collapsed || false} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs">Visible</span>
              <br />
              <span className="text-[9px] text-muted-foreground">Show this section</span>
            </div>
            <Switch checked={section.is_visible} />
          </div>

          {!section.is_locked && (
            <>
              <div className="border-t border-border" />
              <Button variant="destructive" size="sm" className="h-7 text-[10px] gap-1 w-full">
                <Trash2 size={10} />
                Remove Section
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
