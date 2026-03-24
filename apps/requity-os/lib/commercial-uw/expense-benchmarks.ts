// ============================================================================
// Commercial Underwriting — Expense Benchmarks
// Static benchmark matrix from Requity's commercial UW template.
// 10 asset classes x 10 expense categories = 100 values.
// Stored as code, not a DB table. Promote to DB if admin editing is needed.
// ============================================================================

import type { CommercialPropertyType } from "./types";

/** Benchmark basis: per-unit types use unit count, per-SF types use square footage */
export type BenchmarkBasis = "per_unit" | "per_sf";

export interface BenchmarkEntry {
  /** Dollar amount per unit or per SF */
  amount: number;
  /** Low end of typical range */
  rangeLow: number;
  /** High end of typical range */
  rangeHigh: number;
}

export interface AssetClassBenchmarks {
  basis: BenchmarkBasis;
  basisLabel: string; // "unit", "pad", "site", "room", "SF"
  mgmtFeePct: number; // Default management fee as % of EGI
  categories: Record<ExpenseBenchmarkCategory, BenchmarkEntry>;
}

export const EXPENSE_BENCHMARK_CATEGORIES = [
  "taxes",
  "insurance",
  "utilities",
  "repairs",
  "contract_services",
  "payroll",
  "marketing",
  "ga",
  "reserve",
] as const;

export type ExpenseBenchmarkCategory = (typeof EXPENSE_BENCHMARK_CATEGORIES)[number];

export const EXPENSE_BENCHMARK_LABELS: Record<ExpenseBenchmarkCategory, string> = {
  taxes: "Real Estate Taxes",
  insurance: "Insurance",
  utilities: "Utilities",
  repairs: "Repairs & Maintenance",
  contract_services: "Contract Services",
  payroll: "On-Site Payroll",
  marketing: "Marketing",
  ga: "General & Administrative",
  reserve: "Replacement Reserve",
};

// ── Benchmark Data (from RL Comm UW Template.xlsx — Expense Guidance tab) ──

export const EXPENSE_BENCHMARKS: Record<string, AssetClassBenchmarks> = {
  // ── Per-Unit Types ──

  multifamily: {
    basis: "per_unit",
    basisLabel: "unit",
    mgmtFeePct: 8,
    categories: {
      taxes:             { amount: 1650,  rangeLow: 1200,  rangeHigh: 2500  },
      insurance:         { amount: 625,   rangeLow: 400,   rangeHigh: 1000  },
      utilities:         { amount: 2350,  rangeLow: 1800,  rangeHigh: 3200  },
      repairs:           { amount: 1500,  rangeLow: 900,   rangeHigh: 2200  },
      contract_services: { amount: 400,   rangeLow: 200,   rangeHigh: 700   },
      payroll:           { amount: 1000,  rangeLow: 600,   rangeHigh: 1800  },
      marketing:         { amount: 125,   rangeLow: 50,    rangeHigh: 300   },
      ga:                { amount: 400,   rangeLow: 200,   rangeHigh: 700   },
      reserve:           { amount: 375,   rangeLow: 250,   rangeHigh: 500   },
    },
  },

  mobile_home_park: {
    basis: "per_unit",
    basisLabel: "pad",
    mgmtFeePct: 8,
    categories: {
      taxes:             { amount: 400,   rangeLow: 200,   rangeHigh: 700   },
      insurance:         { amount: 275,   rangeLow: 150,   rangeHigh: 450   },
      utilities:         { amount: 550,   rangeLow: 300,   rangeHigh: 900   },
      repairs:           { amount: 200,   rangeLow: 100,   rangeHigh: 400   },
      contract_services: { amount: 200,   rangeLow: 100,   rangeHigh: 350   },
      payroll:           { amount: 300,   rangeLow: 150,   rangeHigh: 600   },
      marketing:         { amount: 50,    rangeLow: 25,    rangeHigh: 100   },
      ga:                { amount: 125,   rangeLow: 75,    rangeHigh: 200   },
      reserve:           { amount: 200,   rangeLow: 100,   rangeHigh: 350   },
    },
  },

  rv_campground: {
    basis: "per_unit",
    basisLabel: "site",
    mgmtFeePct: 8,
    categories: {
      taxes:             { amount: 300,   rangeLow: 150,   rangeHigh: 600   },
      insurance:         { amount: 350,   rangeLow: 200,   rangeHigh: 600   },
      utilities:         { amount: 650,   rangeLow: 400,   rangeHigh: 1000  },
      repairs:           { amount: 550,   rangeLow: 300,   rangeHigh: 800   },
      contract_services: { amount: 275,   rangeLow: 150,   rangeHigh: 450   },
      payroll:           { amount: 500,   rangeLow: 250,   rangeHigh: 900   },
      marketing:         { amount: 300,   rangeLow: 150,   rangeHigh: 500   },
      ga:                { amount: 225,   rangeLow: 100,   rangeHigh: 400   },
      reserve:           { amount: 200,   rangeLow: 100,   rangeHigh: 350   },
    },
  },

  hospitality: {
    basis: "per_unit",
    basisLabel: "room",
    mgmtFeePct: 8,
    categories: {
      taxes:             { amount: 2600,  rangeLow: 1500,  rangeHigh: 4500  },
      insurance:         { amount: 1650,  rangeLow: 1000,  rangeHigh: 2800  },
      utilities:         { amount: 3200,  rangeLow: 2000,  rangeHigh: 5000  },
      repairs:           { amount: 2600,  rangeLow: 1500,  rangeHigh: 4000  },
      contract_services: { amount: 600,   rangeLow: 300,   rangeHigh: 1000  },
      payroll:           { amount: 3500,  rangeLow: 2000,  rangeHigh: 6000  },
      marketing:         { amount: 1250,  rangeLow: 700,   rangeHigh: 2000  },
      ga:                { amount: 550,   rangeLow: 300,   rangeHigh: 900   },
      reserve:           { amount: 1000,  rangeLow: 500,   rangeHigh: 1800  },
    },
  },

  marina: {
    basis: "per_unit",
    basisLabel: "slip",
    mgmtFeePct: 8,
    categories: {
      taxes:             { amount: 350,   rangeLow: 200,   rangeHigh: 600   },
      insurance:         { amount: 500,   rangeLow: 300,   rangeHigh: 800   },
      utilities:         { amount: 400,   rangeLow: 200,   rangeHigh: 700   },
      repairs:           { amount: 600,   rangeLow: 350,   rangeHigh: 1000  },
      contract_services: { amount: 250,   rangeLow: 100,   rangeHigh: 450   },
      payroll:           { amount: 450,   rangeLow: 200,   rangeHigh: 800   },
      marketing:         { amount: 200,   rangeLow: 100,   rangeHigh: 400   },
      ga:                { amount: 175,   rangeLow: 75,    rangeHigh: 300   },
      reserve:           { amount: 250,   rangeLow: 125,   rangeHigh: 450   },
    },
  },

  // ── Per-SF Types ──

  office: {
    basis: "per_sf",
    basisLabel: "SF",
    mgmtFeePct: 8,
    categories: {
      taxes:             { amount: 4.25,  rangeLow: 2.50,  rangeHigh: 7.00  },
      insurance:         { amount: 1.40,  rangeLow: 0.80,  rangeHigh: 2.25  },
      utilities:         { amount: 4.75,  rangeLow: 3.00,  rangeHigh: 7.50  },
      repairs:           { amount: 3.35,  rangeLow: 2.00,  rangeHigh: 5.50  },
      contract_services: { amount: 0.55,  rangeLow: 0.25,  rangeHigh: 1.00  },
      payroll:           { amount: 2.00,  rangeLow: 1.00,  rangeHigh: 3.50  },
      marketing:         { amount: 0.25,  rangeLow: 0.10,  rangeHigh: 0.50  },
      ga:                { amount: 0.56,  rangeLow: 0.25,  rangeHigh: 1.00  },
      reserve:           { amount: 0.35,  rangeLow: 0.15,  rangeHigh: 0.65  },
    },
  },

  retail: {
    basis: "per_sf",
    basisLabel: "SF",
    mgmtFeePct: 8,
    categories: {
      taxes:             { amount: 3.75,  rangeLow: 2.00,  rangeHigh: 6.50  },
      insurance:         { amount: 1.10,  rangeLow: 0.60,  rangeHigh: 2.00  },
      utilities:         { amount: 2.50,  rangeLow: 1.50,  rangeHigh: 4.00  },
      repairs:           { amount: 2.25,  rangeLow: 1.25,  rangeHigh: 3.75  },
      contract_services: { amount: 0.45,  rangeLow: 0.20,  rangeHigh: 0.85  },
      payroll:           { amount: 0.75,  rangeLow: 0.25,  rangeHigh: 1.50  },
      marketing:         { amount: 0.35,  rangeLow: 0.15,  rangeHigh: 0.65  },
      ga:                { amount: 0.40,  rangeLow: 0.20,  rangeHigh: 0.75  },
      reserve:           { amount: 0.30,  rangeLow: 0.15,  rangeHigh: 0.55  },
    },
  },

  industrial: {
    basis: "per_sf",
    basisLabel: "SF",
    mgmtFeePct: 8,
    categories: {
      taxes:             { amount: 1.75,  rangeLow: 0.80,  rangeHigh: 3.25  },
      insurance:         { amount: 0.65,  rangeLow: 0.35,  rangeHigh: 1.25  },
      utilities:         { amount: 1.25,  rangeLow: 0.60,  rangeHigh: 2.50  },
      repairs:           { amount: 1.50,  rangeLow: 0.75,  rangeHigh: 2.75  },
      contract_services: { amount: 0.30,  rangeLow: 0.10,  rangeHigh: 0.60  },
      payroll:           { amount: 0.50,  rangeLow: 0.15,  rangeHigh: 1.00  },
      marketing:         { amount: 0.10,  rangeLow: 0.05,  rangeHigh: 0.25  },
      ga:                { amount: 0.25,  rangeLow: 0.10,  rangeHigh: 0.50  },
      reserve:           { amount: 0.20,  rangeLow: 0.10,  rangeHigh: 0.40  },
    },
  },

  self_storage: {
    basis: "per_sf",
    basisLabel: "SF",
    mgmtFeePct: 8,
    categories: {
      taxes:             { amount: 1.50,  rangeLow: 0.75,  rangeHigh: 2.75  },
      insurance:         { amount: 0.55,  rangeLow: 0.25,  rangeHigh: 1.00  },
      utilities:         { amount: 0.85,  rangeLow: 0.40,  rangeHigh: 1.50  },
      repairs:           { amount: 0.65,  rangeLow: 0.30,  rangeHigh: 1.25  },
      contract_services: { amount: 0.20,  rangeLow: 0.08,  rangeHigh: 0.45  },
      payroll:           { amount: 1.25,  rangeLow: 0.60,  rangeHigh: 2.00  },
      marketing:         { amount: 0.45,  rangeLow: 0.20,  rangeHigh: 0.85  },
      ga:                { amount: 0.30,  rangeLow: 0.12,  rangeHigh: 0.60  },
      reserve:           { amount: 0.15,  rangeLow: 0.08,  rangeHigh: 0.35  },
    },
  },

  healthcare: {
    basis: "per_sf",
    basisLabel: "SF",
    mgmtFeePct: 8,
    categories: {
      taxes:             { amount: 3.50,  rangeLow: 2.00,  rangeHigh: 6.00  },
      insurance:         { amount: 2.00,  rangeLow: 1.00,  rangeHigh: 3.50  },
      utilities:         { amount: 5.50,  rangeLow: 3.50,  rangeHigh: 8.50  },
      repairs:           { amount: 3.00,  rangeLow: 1.75,  rangeHigh: 5.00  },
      contract_services: { amount: 0.75,  rangeLow: 0.35,  rangeHigh: 1.25  },
      payroll:           { amount: 3.00,  rangeLow: 1.50,  rangeHigh: 5.00  },
      marketing:         { amount: 0.30,  rangeLow: 0.10,  rangeHigh: 0.60  },
      ga:                { amount: 0.65,  rangeLow: 0.30,  rangeHigh: 1.10  },
      reserve:           { amount: 0.40,  rangeLow: 0.20,  rangeHigh: 0.75  },
    },
  },
} as const;

// ── Lookup Helpers ──

/** Map property type aliases to their benchmark key */
function getBenchmarkKey(propertyType: string): string | null {
  const aliases: Record<string, string> = {
    vacation_rental: "hospitality",
    mixed_use: "office",     // Mixed use defaults to office benchmarks
    warehouse: "industrial",
    specialty: "industrial",
    other: "industrial",
  };
  const key = aliases[propertyType] ?? propertyType;
  return key in EXPENSE_BENCHMARKS ? key : null;
}

/** Get benchmarks for a property type (returns null if no benchmarks exist) */
export function getBenchmarksForType(propertyType: string): AssetClassBenchmarks | null {
  const key = getBenchmarkKey(propertyType);
  return key ? EXPENSE_BENCHMARKS[key] : null;
}

/**
 * Calculate benchmark dollar amounts for all expense categories.
 * Returns the annual dollar amount for each category based on unit count or SF.
 */
export function calcBenchmarkExpenses(
  propertyType: string,
  unitCount: number,
  totalSf: number
): Record<ExpenseBenchmarkCategory, number> | null {
  const benchmarks = getBenchmarksForType(propertyType);
  if (!benchmarks) return null;

  const basis = benchmarks.basis === "per_sf" ? totalSf : unitCount;
  if (basis <= 0) return null;

  const result = {} as Record<ExpenseBenchmarkCategory, number>;
  for (const cat of EXPENSE_BENCHMARK_CATEGORIES) {
    result[cat] = Math.round(benchmarks.categories[cat].amount * basis);
  }
  return result;
}

/**
 * Get the benchmark per-unit/SF amount and range for a specific category.
 */
export function getBenchmarkForCategory(
  propertyType: string,
  category: ExpenseBenchmarkCategory
): BenchmarkEntry | null {
  const benchmarks = getBenchmarksForType(propertyType);
  if (!benchmarks) return null;
  return benchmarks.categories[category] ?? null;
}

/**
 * Calculate variance between actual and benchmark amounts.
 * Returns { delta, pct, status } where status is 'match' | 'over' | 'under'.
 */
export function calcVariance(
  actual: number,
  benchmark: number
): { delta: number; pct: number; status: "match" | "over" | "under" } {
  const delta = actual - benchmark;
  const pct = benchmark > 0 ? (delta / benchmark) * 100 : 0;

  if (Math.abs(delta) < 1) return { delta: 0, pct: 0, status: "match" };
  return { delta, pct, status: delta > 0 ? "over" : "under" };
}
