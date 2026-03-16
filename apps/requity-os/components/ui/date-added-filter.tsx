"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays } from "lucide-react";

const DATE_PRESETS = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "this_month", label: "This Month" },
] as const;

export type DatePreset = (typeof DATE_PRESETS)[number]["value"];

interface DateAddedFilterProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function DateAddedFilter({ value, onChange, className }: DateAddedFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className ?? "w-full sm:w-40 h-10 md:h-9"}>
        <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
        <SelectValue placeholder="All Time" />
      </SelectTrigger>
      <SelectContent>
        {DATE_PRESETS.map((p) => (
          <SelectItem key={p.value} value={p.value}>
            {p.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function filterByDateAdded(createdAt: string, preset: string): boolean {
  if (preset === "all") return true;
  const created = new Date(createdAt);
  if (isNaN(created.getTime())) return true;

  const now = new Date();
  const todayStart = startOfDay(now);

  switch (preset) {
    case "today":
      return created >= todayStart;
    case "yesterday": {
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      return created >= yesterdayStart && created < todayStart;
    }
    case "7d": {
      const sevenDaysAgo = new Date(todayStart);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return created >= sevenDaysAgo;
    }
    case "30d": {
      const thirtyDaysAgo = new Date(todayStart);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return created >= thirtyDaysAgo;
    }
    case "this_month":
      return (
        created.getFullYear() === now.getFullYear() &&
        created.getMonth() === now.getMonth()
      );
    default:
      return true;
  }
}
