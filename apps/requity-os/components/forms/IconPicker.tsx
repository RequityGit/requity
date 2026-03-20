"use client";

import { useState, useMemo } from "react";
import * as LucideIcons from "lucide-react";
import { FileText } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const ICON_PICKER_SET = [
  // Real estate & property
  "Home", "Building", "Building2", "Landmark", "Hotel", "Warehouse", "Store", "Factory",
  "Tent", "Trees", "Mountain", "MapPin", "Map", "Navigation", "Fence",
  // Construction & tools
  "Hammer", "Wrench", "HardHat", "Ruler", "PaintBucket", "Drill", "Crane", "Construction",
  "Paintbrush", "Shovel",
  // Finance & business
  "DollarSign", "CreditCard", "Wallet", "PiggyBank", "TrendingUp", "TrendingDown",
  "BarChart3", "LineChart", "PieChart", "Calculator", "Receipt", "Banknote", "CircleDollarSign",
  "BadgeDollarSign", "HandCoins", "Coins",
  // Documents & legal
  "FileText", "Files", "FolderOpen", "ClipboardList", "ClipboardCheck", "FileSignature",
  "BookOpen", "Scale", "Stamp", "Award",
  // People & communication
  "User", "Users", "UserPlus", "Handshake", "Phone", "Mail", "Send", "MessageSquare",
  // Actions & status
  "ArrowRightLeft", "ArrowUpRight", "RefreshCw", "Repeat", "ShieldCheck", "CheckCircle",
  "Clock", "Timer", "Calendar", "CalendarCheck",
  // Categories & organization
  "Layers", "LayoutGrid", "Briefcase", "Target", "Zap", "Star", "Heart", "Flag",
  "Tag", "Bookmark", "Filter", "Settings", "Key", "Lock", "Unlock", "Eye",
  // Misc
  "Truck", "Car", "Plane", "Globe", "Sun", "Droplets", "Leaf", "Sprout",
];

function getLucideIcon(name: string): any {
  const icon = (LucideIcons as Record<string, unknown>)[name];
  if (typeof icon === "function" || (typeof icon === "object" && icon !== null)) {
    return icon;
  }
  return null;
}

interface IconPickerProps {
  value: string | null;
  onChange: (icon: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredIcons = useMemo(() => {
    if (!search) return ICON_PICKER_SET;
    const lower = search.toLowerCase();
    return ICON_PICKER_SET.filter((name) => name.toLowerCase().includes(lower));
  }, [search]);

  const SelectedIcon = value ? getLucideIcon(value) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded border transition-colors",
            value
              ? "border-border bg-muted"
              : "border-dashed border-border hover:border-foreground/30"
          )}
        >
          {SelectedIcon ? (
            <SelectedIcon size={16} strokeWidth={1.5} className="text-foreground" />
          ) : (
            <FileText size={16} strokeWidth={1.5} className="text-muted-foreground" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <Input
          placeholder="Search icons..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-sm mb-2"
          autoFocus
        />
        <div className="grid grid-cols-6 gap-1 max-h-80 overflow-y-auto">
          {filteredIcons.map((name) => {
            const Icon = getLucideIcon(name);
            if (!Icon) return null;
            return (
              <button
                key={name}
                type="button"
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                  setSearch("");
                }}
                className={cn(
                  "flex flex-col items-center justify-center rounded p-2 transition-colors",
                  value === name
                    ? "bg-foreground/10 border border-foreground/20"
                    : "hover:bg-muted"
                )}
                title={name}
              >
                <Icon size={20} strokeWidth={1.5} className="text-foreground" />
                <span className="text-[9px] text-muted-foreground mt-1 truncate w-full text-center">
                  {name}
                </span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
