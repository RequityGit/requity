"use client";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FREQUENCIES = ["daily", "weekly", "monthly", "annually"] as const;
const DAYS_OF_WEEK = ["Su", "M", "Tu", "W", "Th", "F", "Sa"];

interface RecurrencePanelProps {
  pattern: string;
  onPatternChange: (v: string) => void;
  daysOfWeek: number[];
  onDaysOfWeekChange: (v: number[]) => void;
  dayOfMonth: number;
  onDayOfMonthChange: (v: number) => void;
  repeatInterval: number;
  onRepeatIntervalChange: (v: number) => void;
  monthlyWhen: string;
  onMonthlyWhenChange: (v: string) => void;
  startDate: string;
  onStartDateChange: (v: string) => void;
  endDate: string;
  onEndDateChange: (v: string) => void;
}

export function RecurrencePanel({
  pattern,
  onPatternChange,
  daysOfWeek,
  onDaysOfWeekChange,
  dayOfMonth,
  onDayOfMonthChange,
  repeatInterval,
  onRepeatIntervalChange,
  monthlyWhen,
  onMonthlyWhenChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
}: RecurrencePanelProps) {
  const unitLabel: Record<string, string> = {
    daily: "Day",
    weekly: "Week",
    monthly: "Month",
    annually: "Year",
  };

  const maxRepeat: Record<string, number> = {
    daily: 7,
    weekly: 4,
    monthly: 12,
    annually: 5,
  };

  const toggleDay = (dayIndex: number) => {
    if (daysOfWeek.includes(dayIndex)) {
      onDaysOfWeekChange(daysOfWeek.filter((d) => d !== dayIndex));
    } else {
      onDaysOfWeekChange([...daysOfWeek, dayIndex].sort());
    }
  };

  const unit = unitLabel[pattern] ?? "Period";
  const max = maxRepeat[pattern] ?? 5;
  const repeatOptions = Array.from({ length: max }, (_, i) => ({
    value: i + 1,
    label: i === 0 ? `Every ${unit}` : `Every ${i + 1} ${unit}s`,
  }));

  return (
    <div className="bg-secondary rounded-lg p-4 border border-border space-y-4">
      {/* Frequency tabs */}
      <div className="space-y-1.5">
        <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Frequency
        </Label>
        <div className="flex rounded-md overflow-hidden border border-border">
          {FREQUENCIES.map((f, i) => (
            <button
              key={f}
              type="button"
              onClick={() => onPatternChange(f)}
              className={cn(
                "flex-1 py-2 text-[12px] font-semibold capitalize transition-colors",
                pattern === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-transparent text-muted-foreground hover:bg-accent",
                i < FREQUENCIES.length - 1 && "border-r border-border"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Repeat interval */}
      <div className="space-y-1.5">
        <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Repeat
        </Label>
        <Select
          value={String(repeatInterval)}
          onValueChange={(v) => onRepeatIntervalChange(parseInt(v))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {repeatOptions.map((o) => (
              <SelectItem key={o.value} value={String(o.value)}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Weekly: day picker */}
      {pattern === "weekly" && (
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Repeat On
          </Label>
          <div className="flex rounded-md overflow-hidden border border-border">
            {DAYS_OF_WEEK.map((d, i) => {
              const active = daysOfWeek.includes(i);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={cn(
                    "flex-1 py-2 text-[12px] font-semibold transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-transparent text-muted-foreground hover:bg-accent",
                    i < 6 && "border-r border-border"
                  )}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Monthly options */}
      {pattern === "monthly" && (
        <>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              When
            </Label>
            <Select value={monthlyWhen} onValueChange={onMonthlyWhenChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="specific_day">Specific Day</SelectItem>
                <SelectItem value="first_weekday">First Weekday</SelectItem>
                <SelectItem value="last_day">Last Day</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {monthlyWhen === "specific_day" && (
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Day
              </Label>
              <Select
                value={String(dayOfMonth)}
                onValueChange={(v) => onDayOfMonthChange(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </>
      )}

      {/* Start / End dates */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Start Date
          </Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            End Date
          </Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
          />
          <span className="text-[10px] text-muted-foreground/70">
            Leave blank for no end
          </span>
        </div>
      </div>
    </div>
  );
}
