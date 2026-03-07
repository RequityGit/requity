"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FREQUENCIES = ["daily", "weekly", "monthly", "annually"] as const;
const DAYS_OF_WEEK = ["Su", "M", "Tu", "W", "Th", "F", "Sa"];
const DAY_NAMES_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const NTH_OPTIONS = [
  { value: 1, label: "1st" },
  { value: 2, label: "2nd" },
  { value: 3, label: "3rd" },
  { value: 4, label: "4th" },
  { value: -1, label: "Last" },
];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

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

  const handleMonthlyWhenChange = (v: string) => {
    onMonthlyWhenChange(v);
    if (v === "specific_day") {
      onDayOfMonthChange(1);
      onDaysOfWeekChange([]);
    } else if (v === "nth_weekday") {
      onDayOfMonthChange(1);
      if (daysOfWeek.length === 0) onDaysOfWeekChange([1]);
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
              On
            </Label>
            <Select value={monthlyWhen} onValueChange={handleMonthlyWhenChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="specific_day">
                  Specific day of month
                </SelectItem>
                <SelectItem value="nth_weekday">
                  Nth weekday of month
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {monthlyWhen === "specific_day" && (
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Day of Month
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

          {monthlyWhen === "nth_weekday" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Which
                </Label>
                <Select
                  value={String(dayOfMonth)}
                  onValueChange={(v) => onDayOfMonthChange(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NTH_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={String(o.value)}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Day
                </Label>
                <Select
                  value={String(daysOfWeek[0] ?? 1)}
                  onValueChange={(v) => onDaysOfWeekChange([parseInt(v)])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAY_NAMES_FULL.map((name, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </>
      )}

      {/* Annually: month + day */}
      {pattern === "annually" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Month
            </Label>
            <Select
              value={String(daysOfWeek[0] ?? 0)}
              onValueChange={(v) => onDaysOfWeekChange([parseInt(v)])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_NAMES.map((name, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
        </div>
      )}

      {/* Start / End dates */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Start Date
          </Label>
          <DatePicker
            value={startDate}
            onChange={(value) => onStartDateChange(value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            End Date
          </Label>
          <DatePicker
            value={endDate}
            onChange={(value) => onEndDateChange(value)}
          />
          <span className="text-[10px] text-muted-foreground/70">
            Leave blank for no end
          </span>
        </div>
      </div>
    </div>
  );
}
