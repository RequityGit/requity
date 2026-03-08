// ── Types ──────────────────────────────────────────────────────────────────

export type RecurrenceType = "daily" | "weekly" | "monthly" | "annually";
export type MonthlyMode = "date" | "weekday";

export interface RecurringTaskTemplate {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  assigned_to: string | null;
  recurrence_type: RecurrenceType;
  monthly_mode: MonthlyMode | null;
  anchor_day: number | null;
  anchor_month: number | null;
  every_x_months: number;
  nth_occurrence: number | null;
  nth_weekday: number | null;
  lead_days: number;
  next_generation_date: string;
  next_due_date: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined
  assignee?: { id: string; full_name: string; avatar_url: string | null };
}

export interface CreateTemplateInput {
  title: string;
  description?: string;
  category: string;
  priority: string;
  assigned_to?: string;
  recurrence_type: RecurrenceType;
  monthly_mode?: MonthlyMode;
  anchor_day?: number;
  anchor_month?: number;
  every_x_months?: number;
  nth_occurrence?: number;
  nth_weekday?: number;
  lead_days?: number;
}

// ── Constants ─────────────────────────────────────────────────────────────

export const RECURRENCE_TYPES: { value: RecurrenceType; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "annually", label: "Annually" },
];

export const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  annually: "Annually",
};

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const WEEKDAY_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
export const NTH_LABELS = ["1st", "2nd", "3rd", "4th"];

// ── Helpers ───────────────────────────────────────────────────────────────

/** Get a human-readable frequency label including every_x_months */
export function getFrequencyLabel(template: RecurringTaskTemplate): string {
  if (template.recurrence_type === "monthly" && template.every_x_months > 1) {
    if (template.every_x_months === 3) return "Quarterly";
    if (template.every_x_months === 6) return "Semi-annually";
    if (template.every_x_months === 2) return "Bimonthly";
    return `Every ${template.every_x_months}mo`;
  }
  return FREQUENCY_LABELS[template.recurrence_type] ?? template.recurrence_type;
}

/** Get a human-readable anchor label */
export function getAnchorLabel(template: RecurringTaskTemplate): string {
  switch (template.recurrence_type) {
    case "daily":
      return "—";
    case "weekly":
      return WEEKDAY_LABELS[template.anchor_day ?? 1] ?? "Mon";
    case "monthly":
      if (template.monthly_mode === "weekday") {
        const nth = NTH_LABELS[(template.nth_occurrence ?? 1) - 1] ?? "1st";
        const day = WEEKDAY_LABELS[template.nth_weekday ?? 1] ?? "Mon";
        return `${nth} ${day}`;
      }
      return ordinalSuffix(template.anchor_day ?? 1);
    case "annually": {
      const month = MONTH_LABELS[(template.anchor_month ?? 1) - 1] ?? "Jan";
      return `${month} ${template.anchor_day ?? 1}`;
    }
    default:
      return "—";
  }
}

function ordinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Calculate next N due dates for preview */
export function getNextDueDates(
  recurrenceType: RecurrenceType,
  anchorDay: number,
  anchorMonth: number,
  everyXMonths: number,
  monthlyMode: MonthlyMode,
  nthOccurrence: number,
  nthWeekday: number,
  count: number = 3
): Date[] {
  const now = new Date();
  const dates: Date[] = [];

  function getNthWeekdayOfMonth(
    year: number,
    month: number,
    weekday: number,
    nth: number
  ): Date | null {
    let c = 0;
    for (let day = 1; day <= 31; day++) {
      const d = new Date(year, month, day);
      if (d.getMonth() !== month) break;
      if (d.getDay() === weekday) {
        c++;
        if (c === nth) return d;
      }
    }
    return null;
  }

  for (let i = 0; i < count; i++) {
    let d: Date | null = null;
    if (recurrenceType === "daily") {
      d = new Date(now);
      d.setDate(d.getDate() + i + 1);
    } else if (recurrenceType === "weekly") {
      d = new Date(now);
      const target = anchorDay ?? 1;
      let diff = target - d.getDay();
      if (diff <= 0) diff += 7;
      d.setDate(d.getDate() + diff + i * 7);
    } else if (recurrenceType === "monthly") {
      const step = everyXMonths || 1;
      const targetMonth = now.getMonth() + (i + 1) * step;
      const targetYear = now.getFullYear() + Math.floor(targetMonth / 12);
      const targetMo = targetMonth % 12;
      if (monthlyMode === "weekday") {
        d = getNthWeekdayOfMonth(targetYear, targetMo, nthWeekday, nthOccurrence);
      } else {
        d = new Date(targetYear, targetMo, Math.min(anchorDay || 1, 28));
      }
    } else if (recurrenceType === "annually") {
      d = new Date(
        now.getFullYear() + i + 1,
        (anchorMonth ?? 1) - 1,
        Math.min(anchorDay || 1, 28)
      );
    }
    if (d) dates.push(d);
  }
  return dates;
}

/** Calculate initial next_due_date given recurrence config */
export function calculateInitialDueDate(
  recurrenceType: RecurrenceType,
  anchorDay: number,
  anchorMonth: number,
  everyXMonths: number,
  monthlyMode: MonthlyMode,
  nthOccurrence: number,
  nthWeekday: number
): string {
  const dates = getNextDueDates(
    recurrenceType,
    anchorDay,
    anchorMonth,
    everyXMonths,
    monthlyMode,
    nthOccurrence,
    nthWeekday,
    1
  );
  if (dates.length === 0) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }
  return dates[0].toISOString().split("T")[0];
}
