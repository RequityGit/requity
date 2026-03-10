"use client";

import {
  X,
  Plus,
  GripVertical,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TabInfo } from "../ObjectManagerView";

interface Props {
  tab: TabInfo;
  onClose: () => void;
}

const TAB_ICONS = [
  "PanelRight",
  "MapPin",
  "User",
  "Calculator",
  "FolderOpen",
  "Activity",
  "MessageSquare",
  "FileText",
  "Database",
  "Layers",
];

export function TabConfigPanel({ tab, onClose }: Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border flex items-center gap-2">
        <div className="w-[26px] h-[26px] rounded-md bg-blue-500/10 flex items-center justify-center">
          <span className="text-[10px] text-blue-500 font-semibold">T</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold truncate">{tab.label} Tab</div>
          <div className="text-[9px] text-muted-foreground">
            {tab.sections.length} sections
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
              Tab Label
            </label>
            <Input value={tab.label} className="h-8 text-xs" readOnly />
          </div>

          <div>
            <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Icon
            </label>
            <Select value={tab.icon}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select icon..." />
              </SelectTrigger>
              <SelectContent>
                {TAB_ICONS.map((icon) => (
                  <SelectItem key={icon} value={icon}>
                    {icon}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs">Locked</span>
              <br />
              <span className="text-[9px] text-muted-foreground">Cannot be removed</span>
            </div>
            <Switch checked={tab.locked} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs">Visible by Default</span>
              <br />
              <span className="text-[9px] text-muted-foreground">Show in tab bar</span>
            </div>
            <Switch checked={true} />
          </div>

          <div className="border-t border-border" />

          <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Sections in Tab ({tab.sections.length})
          </label>
          {tab.sections.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded border border-border bg-muted"
            >
              <GripVertical size={10} className="text-muted-foreground cursor-grab" />
              {s.section_type === "relationship" && (
                <span className="w-[5px] h-[5px] rounded-full bg-purple-500" />
              )}
              {s.section_type === "computed" && (
                <span className="w-[5px] h-[5px] rounded-full bg-yellow-600" />
              )}
              {s.section_type === "proforma" && (
                <span className="w-[5px] h-[5px] rounded-full bg-cyan-500" />
              )}
              <span className="text-xs flex-1">{s.section_label}</span>
            </div>
          ))}
          <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1">
            <Plus size={10} />
            Add Section to Tab
          </Button>

          {!tab.locked && (
            <>
              <div className="border-t border-border" />
              <Button variant="destructive" size="sm" className="h-7 text-[10px] gap-1 w-full">
                <Trash2 size={10} />
                Remove Tab
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
