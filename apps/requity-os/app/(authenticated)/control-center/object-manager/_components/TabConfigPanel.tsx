"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import {
  X,
  Plus,
  GripVertical,
  Trash2,
  Loader2,
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
import { updateTab, deleteTab, addSection } from "../actions";

interface Props {
  tab: TabInfo;
  pageType: string;
  onClose: () => void;
  onUpdated: () => void;
}

const TAB_ICONS = [
  "panel-right",
  "map-pin",
  "user",
  "calculator",
  "folder-open",
  "activity",
  "message-square",
  "file-text",
  "database",
  "layers",
];

export function TabConfigPanel({ tab, pageType, onClose, onUpdated }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [localLabel, setLocalLabel] = useState(tab.label);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync when tab changes
  useEffect(() => {
    setLocalLabel(tab.label);
  }, [tab.id, tab.label]);

  // Cleanup debounce
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleLabelChange = useCallback(
    (value: string) => {
      setLocalLabel(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (value.trim() && value.trim() !== tab.label) {
          setError(null);
          startTransition(async () => {
            const result = await updateTab(pageType, tab.id, { tab_label: value.trim() });
            if (result.error) setError(result.error);
            else onUpdated();
          });
        }
      }, 500);
    },
    [tab.id, tab.label, pageType, onUpdated]
  );

  const handleIconChange = (icon: string) => {
    setError(null);
    startTransition(async () => {
      const result = await updateTab(pageType, tab.id, { tab_icon: icon });
      if (result.error) setError(result.error);
      else onUpdated();
    });
  };

  const handleLockedChange = (checked: boolean) => {
    setError(null);
    startTransition(async () => {
      const result = await updateTab(pageType, tab.id, { tab_locked: checked });
      if (result.error) setError(result.error);
      else onUpdated();
    });
  };

  const handleAddSectionToTab = () => {
    setError(null);
    startTransition(async () => {
      const sectionKey = `${tab.id}_section_${Date.now()}`;
      const result = await addSection({
        page_type: pageType,
        section_key: sectionKey,
        section_label: "New Section",
        sidebar: false,
        section_type: "fields",
        tab_key: tab.id,
        tab_label: tab.label,
      });
      if (result.error) setError(result.error);
      else onUpdated();
    });
  };

  const handleDeleteTab = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteTab(pageType, tab.id);
      if (result.error) {
        setError(result.error);
      } else {
        onUpdated();
        onClose();
      }
    });
  };

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
        {isPending && <Loader2 size={12} className="animate-spin text-muted-foreground" />}
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X size={13} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-3">
          {error && (
            <div className="text-[10px] text-destructive bg-destructive/10 px-2 py-1.5 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Tab Label
            </label>
            <Input
              value={localLabel}
              onChange={(e) => handleLabelChange(e.target.value)}
              className="h-8 text-xs"
              disabled={tab.locked || isPending}
              readOnly={tab.locked}
            />
          </div>

          <div>
            <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Icon
            </label>
            <Select value={tab.icon} onValueChange={handleIconChange} disabled={isPending}>
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
            <Switch
              checked={tab.locked}
              onCheckedChange={handleLockedChange}
              disabled={isPending}
            />
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
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] gap-1"
            onClick={handleAddSectionToTab}
            disabled={isPending}
          >
            <Plus size={10} />
            Add Section to Tab
          </Button>

          {!tab.locked && (
            <>
              <div className="border-t border-border" />
              <Button
                variant="destructive"
                size="sm"
                className="h-7 text-[10px] gap-1 w-full"
                disabled={isPending}
                onClick={handleDeleteTab}
              >
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
