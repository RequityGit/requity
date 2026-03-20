"use client";

import { create } from "zustand";
import type {
  CommercialUWState,
  RentRollUnit,
  AncillaryItem,
  ExpenseLineItem,
  ClosingCostItem,
  ReserveItem,
  CapexCategory,
  CapexLineItem,
  WaterfallTier,
} from "./types";

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

const defaultRentRoll: RentRollUnit[] = [
  { id: uid(), unit: "MC Site", tenant: "Sara Wilsey | Ann", sf: 0, rentPerMonth: 0, marketPerMonth: 575, camNNN: 0, other: 0, isVacant: false },
  { id: uid(), unit: "MC Site", tenant: "Brandi P. King", sf: 0, rentPerMonth: 0, marketPerMonth: 705, camNNN: 0, other: 0, isVacant: false },
  { id: uid(), unit: "MC Site", tenant: "Maxey Haliburton", sf: 0, rentPerMonth: 0, marketPerMonth: 575, camNNN: 0, other: 0, isVacant: false },
  { id: uid(), unit: "MC Site", tenant: "Kevin VanRooyen", sf: 0, rentPerMonth: 0, marketPerMonth: 575, camNNN: 0, other: 0, isVacant: false },
  { id: uid(), unit: "MC Site", tenant: "Mark Core | Ann", sf: 0, rentPerMonth: 0, marketPerMonth: 575, camNNN: 0, other: 0, isVacant: false },
  { id: uid(), unit: "MC Site", tenant: "Dedra A. Harlow", sf: 0, rentPerMonth: 0, marketPerMonth: 705, camNNN: 0, other: 0, isVacant: false },
  { id: uid(), unit: "MC Site", tenant: "Vision M. Archur", sf: 0, rentPerMonth: 0, marketPerMonth: 700, camNNN: 0, other: 0, isVacant: false },
  { id: uid(), unit: "MC Site", tenant: "Aidan M. Humph", sf: 0, rentPerMonth: 0, marketPerMonth: 700, camNNN: 0, other: 0, isVacant: false },
];

const defaultExpenses: ExpenseLineItem[] = [
  { id: uid(), label: "Management Fee", t12Actual: 1215.99, yr1Override: null, isPercentOfEGI: true, pctOfEGI: 8, note: "Based on 8% of EGI" },
  { id: uid(), label: "Real Estate Taxes", t12Actual: 3372.05, yr1Override: 10000, isPercentOfEGI: false, pctOfEGI: null, note: "Reassessment post-acquisition" },
  { id: uid(), label: "Insurance", t12Actual: 152, yr1Override: 5100, isPercentOfEGI: false, pctOfEGI: null, note: "" },
  { id: uid(), label: "Utilities", t12Actual: 152, yr1Override: 0, isPercentOfEGI: false, pctOfEGI: null, note: "" },
  { id: uid(), label: "Repairs & Maintenance", t12Actual: 0, yr1Override: 0, isPercentOfEGI: false, pctOfEGI: null, note: "" },
  { id: uid(), label: "Contract Services", t12Actual: 0, yr1Override: 0, isPercentOfEGI: false, pctOfEGI: null, note: "" },
  { id: uid(), label: "On Site Mgmt (Payroll)", t12Actual: 1150, yr1Override: 0, isPercentOfEGI: false, pctOfEGI: null, note: "" },
  { id: uid(), label: "Marketing", t12Actual: 0, yr1Override: 0, isPercentOfEGI: false, pctOfEGI: null, note: "" },
  { id: uid(), label: "General & Administrative", t12Actual: 244.62, yr1Override: 0, isPercentOfEGI: false, pctOfEGI: null, note: "" },
];

const defaultClosingCosts: ClosingCostItem[] = [
  { id: uid(), label: "Title Policy", amount: 4000, note: "" },
  { id: uid(), label: "Phase 1 (Environmental)", amount: 2500, note: "" },
  { id: uid(), label: "ALTA Survey", amount: 8000, note: "" },
  { id: uid(), label: "Travel", amount: 3000, note: "" },
  { id: uid(), label: "Recording", amount: 500, note: "" },
  { id: uid(), label: "Appraisal", amount: 3500, note: "" },
  { id: uid(), label: "Title Charges", amount: 2500, note: "" },
  { id: uid(), label: "Legal (Buyer Rep)", amount: 6000, note: "" },
  { id: uid(), label: "Lender Legal", amount: 8000, note: "" },
  { id: uid(), label: "Physical Inspection", amount: 2500, note: "" },
  { id: uid(), label: "Loan Origination Fee", amount: 4625, note: "Based on loan amount" },
  { id: uid(), label: "Legal Fees (LLC, PPM) *", amount: 0, note: "Typically payable before closing" },
  { id: uid(), label: "Broker Commission", amount: 75000, note: "" },
];

const defaultReserves: ReserveItem[] = [
  { id: uid(), label: "Working Capital", amount: 20000 },
  { id: uid(), label: "Operating Reserves", amount: 0 },
  { id: uid(), label: "Contingency Reserves", amount: 0 },
  { id: uid(), label: "Real Estate Taxes (12 Mo)", amount: 0 },
  { id: uid(), label: "Insurance (12 Mo)", amount: 6600 },
];

const defaultCapexCategories: CapexCategory[] = [
  {
    id: uid(),
    name: "Interior Renovations",
    items: [
      { id: uid(), description: "Kitchen upgrades (per unit)", qty: 200, unitCost: 3500, timeline: "Yr 1-2" },
      { id: uid(), description: "Bathroom remodel (per unit)", qty: 200, unitCost: 2200, timeline: "Yr 1-2" },
      { id: uid(), description: "Flooring replacement (per unit)", qty: 200, unitCost: 1800, timeline: "Yr 1-3" },
      { id: uid(), description: "Appliance package (per unit)", qty: 200, unitCost: 1500, timeline: "Yr 1" },
    ],
  },
  {
    id: uid(),
    name: "Exterior & Common Areas",
    items: [
      { id: uid(), description: "Roof replacement", qty: 1, unitCost: 85000, timeline: "Yr 1" },
      { id: uid(), description: "Parking lot resurface", qty: 1, unitCost: 45000, timeline: "Yr 2" },
      { id: uid(), description: "Landscaping & signage", qty: 1, unitCost: 25000, timeline: "Yr 1" },
    ],
  },
  {
    id: uid(),
    name: "Mechanical / Systems",
    items: [
      { id: uid(), description: "HVAC replacement", qty: 40, unitCost: 4500, timeline: "Yr 1-3" },
      { id: uid(), description: "Plumbing upgrades", qty: 1, unitCost: 60000, timeline: "Yr 1" },
    ],
  },
];

const defaultWaterfallTiers: WaterfallTier[] = [
  { id: uid(), type: "pref", label: "Preferred Return", prefRate: 8, accrual: "Annual", compounding: "Simple" },
  { id: uid(), type: "roc", label: "Return of Capital" },
  { id: uid(), type: "promote", label: "GP Promote — Tier 1", irrHurdle: 12, gpSplit: 20, lpSplit: 80 },
  { id: uid(), type: "promote", label: "GP Promote — Tier 2", irrHurdle: 18, gpSplit: 30, lpSplit: 70 },
  { id: uid(), type: "residual", label: "Residual Split", gpSplit: 35, lpSplit: 65 },
];

export function getDefaultState(dealId = "", versionId = ""): CommercialUWState {
  return {
    dealId,
    versionId,
    version: 1,
    status: "draft",

    propertyType: "Multifamily",
    totalUnits: 200,
    totalSF: 5400,
    yearBuilt: 1985,
    purchasePrice: 950000,
    exitCapRate: 6,
    dispositionCost: 2,
    equityInvested: 275000,

    goingInLoanAmount: 750000,
    goingInInterestRate: 8.5,
    goingInTermMonths: 36,
    goingInIOMonths: 24,
    goingInOriginationPts: 1.5,

    exitLoanAmount: 700000,
    exitInterestRate: 6.5,
    exitAmortizationYears: 30,
    exitIOMonths: 0,

    marketRentGrowth: [3, 3, 3, 3, 3],
    physicalVacancy: [8, 6, 5, 5, 5],
    economicVacancy: [3, 2, 2, 2, 2],
    lossToLease: [5, 4, 3, 2, 1],
    stabilizedVacancy: 5,
    badDebtPct: 1,

    rentRoll: defaultRentRoll,
    ancillaryIncome: [
      { id: uid(), source: "Laundry", currentAnnual: 3600, stabilizedAnnual: 4200 },
      { id: uid(), source: "Parking", currentAnnual: 7200, stabilizedAnnual: 7200 },
    ],

    t12GPI: 40533,
    t12VacancyLoss: 5832,
    t12BadDebt: 229,
    expenseLineItems: defaultExpenses,
    expenseGrowth: [2, 2, 2, 2, 2],
    replacementReserve: 3600,

    closingCosts: defaultClosingCosts,
    acquisitionFee: 22500,
    reserves: defaultReserves,
    capexOverride: null,
    capexCategories: defaultCapexCategories,

    gpCoInvestPct: 10,
    waterfallTiers: defaultWaterfallTiers,
  };
}

interface CommercialUWStore {
  state: CommercialUWState;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  updateField: <K extends keyof CommercialUWState>(key: K, value: CommercialUWState[K]) => void;
  updateArrayField: <K extends keyof CommercialUWState>(key: K, index: number, value: number) => void;
  updateRentRollUnit: (id: string, field: keyof RentRollUnit, value: string | number | boolean) => void;
  addRentRollUnit: () => void;
  removeRentRollUnit: (id: string) => void;
  updateAncillaryItem: (id: string, field: keyof AncillaryItem, value: string | number) => void;
  addAncillaryItem: () => void;
  removeAncillaryItem: (id: string) => void;
  updateExpenseItem: (id: string, field: keyof ExpenseLineItem, value: string | number | boolean | null) => void;
  updateClosingCost: (id: string, field: keyof ClosingCostItem, value: string | number) => void;
  updateReserve: (id: string, field: keyof ReserveItem, value: string | number) => void;
  updateCapexItem: (categoryId: string, itemId: string, field: keyof CapexLineItem, value: string | number) => void;
  addCapexItem: (categoryId: string) => void;
  removeCapexItem: (categoryId: string, itemId: string) => void;
  addCapexCategory: () => void;
  updateWaterfallTier: (id: string, field: keyof WaterfallTier, value: string | number | undefined) => void;
  addPromoteTier: () => void;
  removeWaterfallTier: (id: string) => void;
  loadState: (state: CommercialUWState) => void;
}

export const useCommercialUWStore = create<CommercialUWStore>((set) => ({
  state: getDefaultState(),
  activeTab: "overview",

  setActiveTab: (tab) => set({ activeTab: tab }),

  updateField: (key, value) =>
    set((s) => ({ state: { ...s.state, [key]: value } })),

  updateArrayField: (key, index, value) =>
    set((s) => {
      const arr = [...(s.state[key] as number[])];
      arr[index] = value;
      return { state: { ...s.state, [key]: arr } };
    }),

  updateRentRollUnit: (id, field, value) =>
    set((s) => ({
      state: {
        ...s.state,
        rentRoll: s.state.rentRoll.map((u) =>
          u.id === id ? { ...u, [field]: value } : u
        ),
      },
    })),

  addRentRollUnit: () =>
    set((s) => ({
      state: {
        ...s.state,
        rentRoll: [
          ...s.state.rentRoll,
          { id: uid(), unit: "", tenant: "", sf: 0, rentPerMonth: 0, marketPerMonth: 0, camNNN: 0, other: 0, isVacant: false },
        ],
      },
    })),

  removeRentRollUnit: (id) =>
    set((s) => ({
      state: {
        ...s.state,
        rentRoll: s.state.rentRoll.filter((u) => u.id !== id),
      },
    })),

  updateAncillaryItem: (id, field, value) =>
    set((s) => ({
      state: {
        ...s.state,
        ancillaryIncome: s.state.ancillaryIncome.map((a) =>
          a.id === id ? { ...a, [field]: value } : a
        ),
      },
    })),

  addAncillaryItem: () =>
    set((s) => ({
      state: {
        ...s.state,
        ancillaryIncome: [
          ...s.state.ancillaryIncome,
          { id: uid(), source: "", currentAnnual: 0, stabilizedAnnual: 0 },
        ],
      },
    })),

  removeAncillaryItem: (id) =>
    set((s) => ({
      state: {
        ...s.state,
        ancillaryIncome: s.state.ancillaryIncome.filter((a) => a.id !== id),
      },
    })),

  updateExpenseItem: (id, field, value) =>
    set((s) => ({
      state: {
        ...s.state,
        expenseLineItems: s.state.expenseLineItems.map((e) =>
          e.id === id ? { ...e, [field]: value } : e
        ),
      },
    })),

  updateClosingCost: (id, field, value) =>
    set((s) => ({
      state: {
        ...s.state,
        closingCosts: s.state.closingCosts.map((c) =>
          c.id === id ? { ...c, [field]: value } : c
        ),
      },
    })),

  updateReserve: (id, field, value) =>
    set((s) => ({
      state: {
        ...s.state,
        reserves: s.state.reserves.map((r) =>
          r.id === id ? { ...r, [field]: value } : r
        ),
      },
    })),

  updateCapexItem: (categoryId, itemId, field, value) =>
    set((s) => ({
      state: {
        ...s.state,
        capexCategories: s.state.capexCategories.map((cat) =>
          cat.id === categoryId
            ? {
                ...cat,
                items: cat.items.map((item) =>
                  item.id === itemId ? { ...item, [field]: value } : item
                ),
              }
            : cat
        ),
      },
    })),

  addCapexItem: (categoryId) =>
    set((s) => ({
      state: {
        ...s.state,
        capexCategories: s.state.capexCategories.map((cat) =>
          cat.id === categoryId
            ? {
                ...cat,
                items: [
                  ...cat.items,
                  { id: uid(), description: "", qty: 1, unitCost: 0, timeline: "Yr 1" },
                ],
              }
            : cat
        ),
      },
    })),

  removeCapexItem: (categoryId, itemId) =>
    set((s) => ({
      state: {
        ...s.state,
        capexCategories: s.state.capexCategories.map((cat) =>
          cat.id === categoryId
            ? { ...cat, items: cat.items.filter((i) => i.id !== itemId) }
            : cat
        ),
      },
    })),

  addCapexCategory: () =>
    set((s) => ({
      state: {
        ...s.state,
        capexCategories: [
          ...s.state.capexCategories,
          { id: uid(), name: "New Category", items: [] },
        ],
      },
    })),

  updateWaterfallTier: (id, field, value) =>
    set((s) => ({
      state: {
        ...s.state,
        waterfallTiers: s.state.waterfallTiers.map((t) =>
          t.id === id ? { ...t, [field]: value } : t
        ),
      },
    })),

  addPromoteTier: () =>
    set((s) => {
      const tiers = s.state.waterfallTiers;
      const residualIdx = tiers.findIndex((t) => t.type === "residual");
      const newTier: WaterfallTier = {
        id: uid(),
        type: "promote",
        label: `GP Promote — Tier ${tiers.filter((t) => t.type === "promote").length + 1}`,
        irrHurdle: 20,
        gpSplit: 40,
        lpSplit: 60,
      };
      const newTiers = [...tiers];
      if (residualIdx >= 0) {
        newTiers.splice(residualIdx, 0, newTier);
      } else {
        newTiers.push(newTier);
      }
      return { state: { ...s.state, waterfallTiers: newTiers } };
    }),

  removeWaterfallTier: (id) =>
    set((s) => ({
      state: {
        ...s.state,
        waterfallTiers: s.state.waterfallTiers.filter((t) => t.id !== id),
      },
    })),

  loadState: (newState) => set({ state: newState }),
}));
