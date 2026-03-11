const NTH_LABELS = ["", "1st", "2nd", "3rd", "4th"];
const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * Compose structured recurrence fields into a pattern string for the DB/RPC.
 */
export function composeRecurrencePattern(
  pattern: string,
  monthlyWhen: string,
  dayOfMonth: number,
  daysOfWeek: number[]
): string {
  if (pattern === "monthly") {
    if (monthlyWhen === "nth_weekday") {
      return `monthly_nth:${dayOfMonth}:${daysOfWeek[0] ?? 1}`;
    }
    if (monthlyWhen === "specific_day") {
      return `monthly_day:${dayOfMonth}`;
    }
  }
  if (pattern === "annually" && daysOfWeek.length > 0) {
    return `annually_date:${daysOfWeek[0]}:${dayOfMonth}`;
  }
  return pattern;
}

/**
 * Parse a composed recurrence pattern string back into structured fields.
 */
export function parseRecurrencePattern(pat: string): {
  base: string;
  monthlyWhen: string;
  dayOfMonth: number;
  daysOfWeek: number[];
} {
  if (pat.startsWith("monthly_nth:")) {
    const parts = pat.split(":");
    return {
      base: "monthly",
      monthlyWhen: "nth_weekday",
      dayOfMonth: parseInt(parts[1], 10) || 1,
      daysOfWeek: [parseInt(parts[2], 10) || 1],
    };
  }
  if (pat.startsWith("monthly_day:")) {
    return {
      base: "monthly",
      monthlyWhen: "specific_day",
      dayOfMonth: parseInt(pat.split(":")[1], 10) || 1,
      daysOfWeek: [],
    };
  }
  if (pat.startsWith("annually_date:")) {
    const parts = pat.split(":");
    return {
      base: "annually",
      monthlyWhen: "specific_day",
      daysOfWeek: [parseInt(parts[1], 10) || 0],
      dayOfMonth: parseInt(parts[2], 10) || 1,
    };
  }
  return {
    base: pat || "weekly",
    monthlyWhen: "specific_day",
    dayOfMonth: 1,
    daysOfWeek: [],
  };
}

/**
 * Compute the nth-weekday info for a given date.
 * e.g., March 8 2026 (Sunday) → { nth: 2, dayOfWeek: 0, nthLabel: "2nd", dayName: "Sunday" }
 */
export function getNthWeekdayInfo(date: Date): {
  nth: number;
  dayOfWeek: number;
  nthLabel: string;
  dayName: string;
} {
  const dayOfWeek = date.getDay(); // 0=Sun ... 6=Sat
  const dayOfMonth = date.getDate();
  const nth = Math.ceil(dayOfMonth / 7); // 1-based week occurrence
  const nthLabel = nth <= 4 ? NTH_LABELS[nth] : `${nth}th`;
  return {
    nth,
    dayOfWeek,
    nthLabel,
    dayName: DAY_NAMES[dayOfWeek],
  };
}
