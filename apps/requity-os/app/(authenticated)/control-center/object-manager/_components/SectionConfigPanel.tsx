"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import {
  X,
  Link2,
  Calculator,
  TrendingUp,
  Rows,
  Trash2,
  Lock,
  PanelRight,
  LayoutList,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@repo/lib";
import type { PageSection } from "../actions";
import { updateSection, deleteSection } from "../actions";

interface Props {
  section: PageSection;
  onClose: () => void;
  onUpdated: () => void;
}

const SECTION_TYPES = [
  { v: "fields", l: "Fields", color: "text-muted-foreground" },
  { v: "relationship", l: "Relationship", color: "text-purple-500" },
  { v: "computed", l: "Card Type", color: "text-yellow-600" },
  { v: "proforma", l: "Pro Forma", color: "text-cyan-500" },
  { v: "system", l: "System", color: "text-zinc-400" },
];

export function SectionConfigPanel({ section, onClose, onUpdated }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [localName, setLocalName] = useState(section.section_label);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local name when section changes
  useEffect(() => {
    setLocalName(section.section_label);
  }, [section.id, section.section_label]);

  const handleNameChange = useCallback(
    (value: string) => {
      setLocalName(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (value.trim() && value.trim() !== section.section_label) {
          setError(null);
          startTransition(async () => {
            const result = await updateSection(section.id, { section_label: value.trim() });
            if (result.error) {
              setError(result.error);
            } else {
              onUpdated();
            }
          });
        }
      }, 500);
    },
    [section.id, section.section_label, onUpdated]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const isRel = section.section_type === "relationship";
  const isComputed = section.section_type === "computed";
  const isProforma = section.section_type === "proforma";
  const isSystem = section.section_type === "system";

  const handleUpdate = (updates: Parameters<typeof updateSection>[1]) => {
    setError(null);
    startTransition(async () => {
      const result = await updateSection(section.id, updates);
      if (result.error) {
        setError(result.error);
      } else {
        onUpdated();
      }
    });
  };

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteSection(section.id);
      if (result.error) {
        setError(result.error);
      } else {
        onUpdated();
        onClose();
      }
    });
  };

  const handleTypeChange = (type: string) => {
    if (section.is_locked) return;
    handleUpdate({ section_type: type });
  };

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
            isSystem && "bg-zinc-500/10",
            !isRel && !isComputed && !isProforma && !isSystem && "bg-muted"
          )}
        >
          {isRel ? (
            <Link2 size={13} className="text-purple-500" />
          ) : isComputed ? (
            <Calculator size={13} className="text-yellow-600" />
          ) : isProforma ? (
            <TrendingUp size={13} className="text-cyan-500" />
          ) : isSystem ? (
            <Lock size={13} className="text-zinc-400" />
          ) : (
            <Rows size={13} className="text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold truncate">{section.section_label}</div>
          <div className="text-[9px] text-muted-foreground flex items-center gap-1.5">
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
          {/* Placement indicator */}
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50 border border-border">
            {section.sidebar ? (
              <>
                <PanelRight size={12} className="text-blue-500 shrink-0" />
                <div>
                  <span className="text-[10px] font-medium text-blue-500">Sidebar</span>
                  <span className="text-[9px] text-muted-foreground block">Renders in the right sidebar</span>
                </div>
              </>
            ) : (
              <>
                <LayoutList size={12} className="text-emerald-500 shrink-0" />
                <div>
                  <span className="text-[10px] font-medium text-emerald-500">Main Content</span>
                  <span className="text-[9px] text-muted-foreground block">Renders in the main content area</span>
                </div>
              </>
            )}
          </div>

          {/* Locked indicator */}
          {section.is_locked && (
            <Badge variant="outline" className="text-[9px] gap-1 w-full justify-center">
              <Lock size={8} />
              System-locked section
            </Badge>
          )}

          {error && (
            <div className="text-[10px] text-destructive bg-destructive/10 px-2 py-1.5 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Section Name
            </label>
            <Input
              value={localName}
              onChange={(e) => handleNameChange(e.target.value)}
              className="h-8 text-xs"
              disabled={section.is_locked || isPending}
              readOnly={section.is_locked}
            />
          </div>

          <div>
            <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Section Type
            </label>
            <div className="grid grid-cols-2 gap-1">
              {SECTION_TYPES.map((st) => (
                <div
                  key={st.v}
                  onClick={() => handleTypeChange(st.v)}
                  className={cn(
                    "px-2 py-1.5 rounded border text-xs text-center transition-colors",
                    section.is_locked ? "cursor-not-allowed opacity-60" : "cursor-pointer",
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

          {section.visibility_rule && (
            <div>
              <label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Visibility Rule
              </label>
              <Input value={section.visibility_rule} className="h-8 text-xs" readOnly />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs">Default Collapsed</span>
              <br />
              <span className="text-[9px] text-muted-foreground">Start section minimized</span>
            </div>
            <Switch
              checked={section.default_collapsed || false}
              disabled={isPending}
              onCheckedChange={(checked) => handleUpdate({ default_collapsed: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs">Visible</span>
              <br />
              <span className="text-[9px] text-muted-foreground">Show this section</span>
            </div>
            <Switch
              checked={section.is_visible}
              disabled={isPending}
              onCheckedChange={(checked) => handleUpdate({ is_visible: checked })}
            />
          </div>

          {!section.is_locked && (
            <>
              <div className="border-t border-border" />
              <Button
                variant="destructive"
                size="sm"
                className="h-7 text-[10px] gap-1 w-full"
                disabled={isPending}
                onClick={handleDelete}
              >
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
