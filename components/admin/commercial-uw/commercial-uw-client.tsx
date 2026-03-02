"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Save, Send, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  createUnderwriting,
  saveUnderwriting,
  saveRentRoll,
  saveOccupancyRows,
  saveAncillaryRows,
  saveProFormaYears,
  updateUWStatus,
  saveUploadMapping,
} from "@/app/(authenticated)/admin/loans/[id]/commercial-uw/actions";
import type { RentRollImportMetadata } from "./upload-rent-roll-dialog";
import type { T12ImportMetadata } from "./upload-t12-dialog";
import type { UploadVersion } from "./rent-roll-version-history";
import {
  calcLeaseIncome,
  calcOccupancyRevenue,
  calcAncillaryIncome,
  calcGPI,
  calcExpenseDefaults,
  calcYr1Expenses,
  calcAnnualDebtService,
  buildProForma,
  calcExitAnalysis,
  calcValuationTable,
  calcSensitivityMatrix,
  calcPOHAnalysis,
  getBasisCount,
} from "@/lib/commercial-uw/calculator";
import type {
  CommercialPropertyType,
  RentRollRow,
  OccupancyRow,
  AncillaryRow,
  ExpenseDefault,
  ExpenseOverrides,
  YearAssumptions,
  FinancingTerms,
  T12Data,
  ProFormaYear,
  UWStatus,
} from "@/lib/commercial-uw/types";
import {
  COMMERCIAL_PROPERTY_TYPES,
  getExpenseDefaultsKey,
  isLeaseBased,
  isOccupancyBased,
} from "@/lib/commercial-uw/types";
import {
  createT12Upload,
  saveT12LineItems,
  saveT12Mappings,
  saveT12Overrides,
  activateT12Version,
  getT12UploadData,
  updateT12MappingSuggestions,
} from "@/app/(authenticated)/admin/loans/[id]/commercial-uw/t12-actions";
import type {
  T12LineItem,
  T12FieldMapping,
  T12Upload,
  T12Version,
  T12Override,
  T12Category,
} from "@/lib/commercial-uw/types";
import { T12_TO_PROFORMA_MAP } from "@/lib/commercial-uw/types";
import type { T12HistoricalsImportData } from "./upload-t12-historicals-dialog";
import { IncomeTab } from "./income-tab";
import { ExpensesTab } from "./expenses-tab";
import { HistoricalsTab } from "./historicals-tab";
import { ProFormaTab } from "./proforma-tab";
import { FinancingTab } from "./financing-tab";
import { SummaryTab } from "./summary-tab";

interface Props {
  loanId: string;
  loan: {
    loan_number: string | null;
    property_address: string | null;
    property_type: string | null;
    purchase_price: number | null;
    loan_amount: number | null;
  };
  existingUW: Record<string, unknown> | null;
  existingRentRoll: unknown[];
  existingOccupancy: unknown[];
  existingAncillary: unknown[];
  existingProforma: unknown[];
  existingUploadMappings: unknown[];
  expenseDefaults: ExpenseDefault[];
  existingT12Upload?: T12Upload | null;
  existingT12LineItems?: T12LineItem[];
  existingT12Mappings?: T12FieldMapping[];
  existingT12Versions?: T12Version[];
  existingT12Overrides?: T12Override[];
  existingT12PreviousMappings?: Record<
    string,
    { category: string; is_excluded: boolean; exclusion_reason: string | null }
  >;
}

// Build simple T12Data (for ProForma) from historicals line items + mappings + overrides
function buildT12DataFromHistoricals(
  lineItems: T12LineItem[],
  mappings: T12FieldMapping[],
  overrides: T12Override[]
): T12Data {
  const categoryTotals: Record<string, number> = {};

  for (const mapping of mappings) {
    if (mapping.is_excluded) continue;
    const lineItem = lineItems.find((li) => li.id === mapping.t12_line_item_id);
    if (!lineItem) continue;
    const cat = mapping.mapped_category;
    categoryTotals[cat] = (categoryTotals[cat] ?? 0) + (lineItem.annual_total ?? 0);
  }

  // Apply overrides
  for (const override of overrides) {
    categoryTotals[override.category] = override.override_annual_total;
  }

  // Map to ProForma T12Data keys
  const get = (cat: string) => categoryTotals[cat] ?? 0;
  const gpr = get("gross_potential_rent");
  const vacancyLoss = get("vacancy_loss");
  const badDebt = get("bad_debt");
  const egi = gpr - Math.abs(vacancyLoss) - Math.abs(badDebt) + get("other_income") - Math.abs(get("concessions"));

  return {
    gpi: gpr,
    vacancy_pct: gpr > 0 ? (Math.abs(vacancyLoss) / gpr) * 100 : 0,
    bad_debt_pct: gpr > 0 ? (Math.abs(badDebt) / gpr) * 100 : 0,
    mgmt_fee: get("management_fee"),
    taxes: get("real_estate_taxes"),
    insurance: get("insurance"),
    utilities: get("water_sewer") + get("electricity") + get("gas"),
    repairs: get("repairs_maintenance"),
    contract_services: get("contract_services"),
    payroll: get("payroll"),
    marketing: get("marketing"),
    ga: get("general_administrative"),
    replacement_reserve: get("replacement_reserve"),
  };
}

const STATUS_LABELS: Record<UWStatus, string> = {
  draft: "Draft",
  in_review: "In Review",
  approved: "Approved",
  rejected: "Rejected",
};

const STATUS_COLORS: Record<UWStatus, string> = {
  draft: "bg-slate-100 text-slate-800",
  in_review: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export function CommercialUWClient({
  loanId,
  loan,
  existingUW,
  existingRentRoll,
  existingOccupancy,
  existingAncillary,
  existingProforma,
  existingUploadMappings,
  expenseDefaults,
  existingT12Upload,
  existingT12LineItems,
  existingT12Mappings,
  existingT12Versions,
  existingT12Overrides,
  existingT12PreviousMappings,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uwId, setUwId] = useState<string | null>(
    (existingUW?.id as string) ?? null
  );
  const [status, setStatus] = useState<UWStatus>(
    (existingUW?.status as UWStatus) ?? "draft"
  );

  // Property header
  const [propertyType, setPropertyType] = useState<CommercialPropertyType>(
    (existingUW?.property_type as CommercialPropertyType) ?? "multifamily"
  );
  const [totalUnits, setTotalUnits] = useState(
    (existingUW?.total_units_spaces as number) ?? 0
  );
  const [totalSf, setTotalSf] = useState(
    (existingUW?.total_sf as number) ?? 0
  );
  const [yearBuilt, setYearBuilt] = useState(
    (existingUW?.year_built as number) ?? 2000
  );
  const [operatingDays, setOperatingDays] = useState(
    (existingUW?.operating_days_per_year as number) ?? 365
  );

  // Income data
  const [rentRoll, setRentRoll] = useState<RentRollRow[]>(
    (existingRentRoll as RentRollRow[]) ?? []
  );
  const [occupancyRows, setOccupancyRows] = useState<OccupancyRow[]>(
    (existingOccupancy as OccupancyRow[]) ?? []
  );
  const [ancillaryRows, setAncillaryRows] = useState<AncillaryRow[]>(
    (existingAncillary as AncillaryRow[]) ?? []
  );

  // T12
  const [t12, setT12] = useState<T12Data | null>(() => {
    if (!existingUW || !existingUW.t12_gpi) return null;
    return {
      gpi: (existingUW.t12_gpi as number) ?? 0,
      vacancy_pct: (existingUW.t12_vacancy_pct as number) ?? 0,
      bad_debt_pct: (existingUW.t12_bad_debt_pct as number) ?? 0,
      mgmt_fee: (existingUW.t12_mgmt_fee as number) ?? 0,
      taxes: (existingUW.t12_taxes as number) ?? 0,
      insurance: (existingUW.t12_insurance as number) ?? 0,
      utilities: (existingUW.t12_utilities as number) ?? 0,
      repairs: (existingUW.t12_repairs as number) ?? 0,
      contract_services: (existingUW.t12_contract_services as number) ?? 0,
      payroll: (existingUW.t12_payroll as number) ?? 0,
      marketing: (existingUW.t12_marketing as number) ?? 0,
      ga: (existingUW.t12_ga as number) ?? 0,
      replacement_reserve: (existingUW.t12_replacement_reserve as number) ?? 0,
    };
  });

  // Expense overrides
  const [expenseOverrides, setExpenseOverrides] = useState<ExpenseOverrides>({
    mgmt_fee_pct: (existingUW?.yr1_mgmt_fee_pct as number) ?? 8,
    taxes: (existingUW?.yr1_taxes_override as number) ?? null,
    insurance: (existingUW?.yr1_insurance_override as number) ?? null,
    utilities: (existingUW?.yr1_utilities_override as number) ?? null,
    repairs: (existingUW?.yr1_repairs_override as number) ?? null,
    contract_services: (existingUW?.yr1_contract_override as number) ?? null,
    payroll: (existingUW?.yr1_payroll_override as number) ?? null,
    marketing: (existingUW?.yr1_marketing_override as number) ?? null,
    ga: (existingUW?.yr1_ga_override as number) ?? null,
    reserve: (existingUW?.yr1_reserve_override as number) ?? null,
  });

  // Assumptions
  const [assumptions, setAssumptions] = useState<YearAssumptions>({
    rent_growth: [
      (existingUW?.rent_growth_yr1 as number) ?? 0,
      (existingUW?.rent_growth_yr2 as number) ?? 3,
      (existingUW?.rent_growth_yr3 as number) ?? 3,
      (existingUW?.rent_growth_yr4 as number) ?? 3,
      (existingUW?.rent_growth_yr5 as number) ?? 3,
    ],
    expense_growth: [
      (existingUW?.expense_growth_yr1 as number) ?? 0,
      (existingUW?.expense_growth_yr2 as number) ?? 2,
      (existingUW?.expense_growth_yr3 as number) ?? 2,
      (existingUW?.expense_growth_yr4 as number) ?? 2,
      (existingUW?.expense_growth_yr5 as number) ?? 2,
    ],
    vacancy_pct: [
      (existingUW?.vacancy_pct_yr1 as number) ?? 10,
      (existingUW?.vacancy_pct_yr2 as number) ?? 8,
      (existingUW?.vacancy_pct_yr3 as number) ?? 7,
      (existingUW?.vacancy_pct_yr4 as number) ?? 5,
      (existingUW?.vacancy_pct_yr5 as number) ?? 5,
    ],
    bad_debt_pct: (existingUW?.bad_debt_pct as number) ?? 1,
    stabilized_vacancy_pct: (existingUW?.stabilized_vacancy_pct as number) ?? 5,
    mgmt_fee_pct: (existingUW?.yr1_mgmt_fee_pct as number) ?? 8,
  });

  // Financing
  const [financing, setFinancing] = useState<FinancingTerms>({
    bridge_loan_amount: (existingUW?.bridge_loan_amount as number) ?? (loan.loan_amount ?? 0),
    bridge_rate: (existingUW?.bridge_rate as number) ?? 0,
    bridge_term_months: (existingUW?.bridge_term_months as number) ?? 24,
    bridge_amortization_months: (existingUW?.bridge_amortization_months as number) ?? 0,
    bridge_io_months: (existingUW?.bridge_io_months as number) ?? 0,
    bridge_origination_pts: (existingUW?.bridge_origination_pts as number) ?? 0,
    exit_loan_amount: (existingUW?.exit_loan_amount as number) ?? 0,
    exit_rate: (existingUW?.exit_rate as number) ?? 0,
    exit_amortization_years: (existingUW?.exit_amortization_years as number) ?? 30,
    exit_io_months: (existingUW?.exit_io_months as number) ?? 0,
  });

  // Valuation / Exit
  const [purchasePrice, setPurchasePrice] = useState(
    (existingUW?.purchase_price as number) ?? (loan.purchase_price ?? 0)
  );
  const [goingInCapRate, setGoingInCapRate] = useState(
    (existingUW?.going_in_cap_rate as number) ?? 0
  );
  const [exitCapRate, setExitCapRate] = useState(
    (existingUW?.exit_cap_rate as number) ?? 0
  );
  const [dispositionCostPct, setDispositionCostPct] = useState(
    (existingUW?.disposition_cost_pct as number) ?? 2
  );
  const [equityInvested, setEquityInvested] = useState(
    (existingUW?.equity_invested as number) ?? 0
  );

  // MHP POH
  const [pohRentalIncome, setPohRentalIncome] = useState(
    (existingUW?.poh_rental_income as number) ?? 0
  );
  const [pohExpenseRatio, setPohExpenseRatio] = useState(
    (existingUW?.poh_expense_ratio as number) ?? 50
  );

  // T12 Historicals state
  const [t12Upload, setT12Upload] = useState<T12Upload | null>(
    existingT12Upload ?? null
  );
  const [t12LineItems, setT12LineItems] = useState<T12LineItem[]>(
    existingT12LineItems ?? []
  );
  const [t12Mappings, setT12Mappings] = useState<T12FieldMapping[]>(
    existingT12Mappings ?? []
  );
  const [t12Versions, setT12Versions] = useState<T12Version[]>(
    existingT12Versions ?? []
  );
  const [t12Overrides, setT12Overrides] = useState<T12Override[]>(
    existingT12Overrides ?? []
  );

  // Upload version history
  const [rentRollVersions, setRentRollVersions] = useState<UploadVersion[]>(
    () => {
      const all = (existingUploadMappings ?? []) as UploadVersion[];
      return all.filter((m) => m.upload_type === "rent_roll");
    }
  );

  // Pending upload mappings to save on next Save Draft
  const [pendingUploads, setPendingUploads] = useState<
    { uploadType: string; filename: string; columnMapping: Record<string, string>; rowCount: number; parsedData: Record<string, unknown>[] }[]
  >([]);

  const handleRentRollImport = useCallback(
    (rows: RentRollRow[], metadata: RentRollImportMetadata) => {
      setRentRoll(rows);
      // Queue the upload mapping to be saved on next Save Draft
      setPendingUploads((prev) => [
        ...prev,
        {
          uploadType: "rent_roll",
          filename: metadata.filename,
          columnMapping: metadata.columnMapping,
          rowCount: metadata.rowCount,
          parsedData: metadata.parsedData,
        },
      ]);
      // Optimistically add to version history
      setRentRollVersions((prev) => [
        {
          id: `pending-${Date.now()}`,
          upload_type: "rent_roll",
          original_filename: metadata.filename,
          row_count: metadata.rowCount,
          created_at: new Date().toISOString(),
          parsed_data: metadata.parsedData,
          column_mapping: metadata.columnMapping,
        },
        ...prev,
      ]);
      toast({ title: "Imported", description: `${metadata.rowCount} units imported from ${metadata.filename}` });
    },
    [toast]
  );

  const handleT12Import = useCallback(
    (data: T12Data, metadata: T12ImportMetadata) => {
      setT12(data);
      setPendingUploads((prev) => [
        ...prev,
        {
          uploadType: "t12",
          filename: metadata.filename,
          columnMapping: metadata.fieldMapping,
          rowCount: 1,
          parsedData: [metadata.parsedData as unknown as Record<string, unknown>],
        },
      ]);
      toast({ title: "Imported", description: `T12 data imported from ${metadata.filename}` });
    },
    [toast]
  );

  const handleRestoreVersion = useCallback(
    (rows: RentRollRow[]) => {
      setRentRoll(rows);
      toast({ title: "Restored", description: "Rent roll restored from previous version. Click Save Draft to persist." });
    },
    [toast]
  );

  // ---- T12 Historicals Handlers ----

  const handleT12HistoricalsImport = useCallback(
    async (data: T12HistoricalsImportData) => {
      try {
        // 1. Create upload record + version
        const uploadResult = await createT12Upload(
          loanId,
          data.fileName,
          data.periodStart,
          data.periodEnd,
          data.sourceLabel || null
        );
        if (uploadResult.error || !uploadResult.uploadId) {
          toast({ title: "Error", description: uploadResult.error ?? "Failed to create upload", variant: "destructive" });
          return;
        }
        const uploadId = uploadResult.uploadId;

        // 2. Save line items
        const lineItemsResult = await saveT12LineItems(uploadId, data.lineItems);
        if (lineItemsResult.error || !lineItemsResult.ids) {
          toast({ title: "Error", description: lineItemsResult.error ?? "Failed to save line items", variant: "destructive" });
          return;
        }
        const lineItemIds = lineItemsResult.ids;

        // 3. Save mappings (map lineItemIndex to actual IDs)
        const mappingsToSave = data.mappings.map((m) => ({
          t12_line_item_id: lineItemIds[m.lineItemIndex],
          mapped_category: m.mapped_category,
          is_excluded: m.is_excluded,
          exclusion_reason: m.exclusion_reason,
        }));
        const mappingsResult = await saveT12Mappings(uploadId, mappingsToSave);
        if (mappingsResult.error) {
          toast({ title: "Error", description: mappingsResult.error, variant: "destructive" });
          return;
        }

        // 4. Update global mapping suggestions
        const suggestions = data.mappings
          .filter((m) => !m.is_excluded)
          .map((m) => ({
            label: data.lineItems[m.lineItemIndex]?.original_row_label ?? "",
            category: m.mapped_category,
          }))
          .filter((s) => s.label);
        await updateT12MappingSuggestions(suggestions);

        // 5. Update local state
        const newUpload: T12Upload = {
          id: uploadId,
          loan_id: loanId,
          file_name: data.fileName,
          file_url: "",
          upload_date: new Date().toISOString(),
          period_start: data.periodStart,
          period_end: data.periodEnd,
          source_label: data.sourceLabel || null,
          uploaded_by: null,
          status: "mapped",
          notes: null,
          created_at: new Date().toISOString(),
        };
        setT12Upload(newUpload);

        const newLineItems: T12LineItem[] = data.lineItems.map((li, i) => ({
          id: lineItemIds[i],
          t12_upload_id: uploadId,
          original_row_label: li.original_row_label,
          original_category: li.original_category,
          amount_month_1: li.amounts[0] ?? null,
          amount_month_2: li.amounts[1] ?? null,
          amount_month_3: li.amounts[2] ?? null,
          amount_month_4: li.amounts[3] ?? null,
          amount_month_5: li.amounts[4] ?? null,
          amount_month_6: li.amounts[5] ?? null,
          amount_month_7: li.amounts[6] ?? null,
          amount_month_8: li.amounts[7] ?? null,
          amount_month_9: li.amounts[8] ?? null,
          amount_month_10: li.amounts[9] ?? null,
          amount_month_11: li.amounts[10] ?? null,
          amount_month_12: li.amounts[11] ?? null,
          annual_total: li.annual_total,
          is_income: li.is_income,
          sort_order: li.sort_order,
        }));
        setT12LineItems(newLineItems);

        const newMappings: T12FieldMapping[] = mappingsToSave.map((m, i) => ({
          id: `mapping-${i}`,
          t12_upload_id: uploadId,
          t12_line_item_id: m.t12_line_item_id,
          mapped_category: m.mapped_category as T12Category,
          mapped_subcategory: null,
          is_excluded: m.is_excluded,
          exclusion_reason: m.exclusion_reason ?? null,
        }));
        setT12Mappings(newMappings);

        // Update versions list
        setT12Versions((prev) => {
          const deactivated = prev.map((v) => ({ ...v, is_active: false }));
          const fmt = (d: string) =>
            new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" });
          return [
            {
              id: `version-${Date.now()}`,
              loan_id: loanId,
              t12_upload_id: uploadId,
              version_number: (prev[0]?.version_number ?? 0) + 1,
              version_label: `T12 ${fmt(data.periodStart)} – ${fmt(data.periodEnd)}`,
              is_active: true,
              created_at: new Date().toISOString(),
            },
            ...deactivated,
          ];
        });
        setT12Overrides([]);

        // 6. Also update the simple T12Data for ProForma compatibility
        const t12Data = buildT12DataFromHistoricals(newLineItems, newMappings, []);
        setT12(t12Data);

        toast({
          title: "T12 Imported",
          description: `${data.lineItems.length} rows imported and mapped from ${data.fileName}`,
        });
      } catch (err) {
        console.error("T12 import error:", err);
        toast({ title: "Error", description: "Failed to import T12 data", variant: "destructive" });
      }
    },
    [loanId, toast]
  );

  const handleActivateT12Version = useCallback(
    async (versionId: string) => {
      const version = t12Versions.find((v) => v.id === versionId);
      if (!version) return;

      const result = await activateT12Version(loanId, versionId);
      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
        return;
      }

      // Fetch data for this version's upload
      const uploadData = await getT12UploadData(version.t12_upload_id);
      if (uploadData.error) {
        toast({ title: "Error", description: uploadData.error, variant: "destructive" });
        return;
      }

      setT12Upload(uploadData.upload as T12Upload | null);
      setT12LineItems((uploadData.lineItems ?? []) as T12LineItem[]);
      setT12Mappings((uploadData.mappings ?? []) as T12FieldMapping[]);
      setT12Overrides((uploadData.overrides ?? []) as T12Override[]);
      setT12Versions((prev) =>
        prev.map((v) => ({ ...v, is_active: v.id === versionId }))
      );

      // Update ProForma T12 data
      const t12Data = buildT12DataFromHistoricals(
        (uploadData.lineItems ?? []) as T12LineItem[],
        (uploadData.mappings ?? []) as T12FieldMapping[],
        (uploadData.overrides ?? []) as T12Override[]
      );
      setT12(t12Data);

      toast({ title: "Version Activated", description: "T12 version switched successfully." });
    },
    [loanId, t12Versions, toast]
  );

  const handleT12OverrideChange = useCallback(
    (category: string, value: number | null) => {
      setT12Overrides((prev) => {
        if (value === null) {
          return prev.filter((o) => o.category !== category);
        }
        const existing = prev.find((o) => o.category === category);
        if (existing) {
          return prev.map((o) =>
            o.category === category
              ? { ...o, override_annual_total: value }
              : o
          );
        }
        return [
          ...prev,
          {
            id: `override-${Date.now()}`,
            t12_upload_id: t12Upload?.id ?? "",
            category,
            override_annual_total: value,
          },
        ];
      });

      // Save overrides to DB (debounced via save button)
      // The overrides will be persisted on next Save Draft
    },
    [t12Upload?.id]
  );

  // ---- Computed Values ----

  const leaseIncome = useMemo(() => calcLeaseIncome(rentRoll), [rentRoll]);
  const occRevenue = useMemo(
    () => calcOccupancyRevenue(occupancyRows, operatingDays),
    [occupancyRows, operatingDays]
  );
  const ancIncome = useMemo(
    () => calcAncillaryIncome(ancillaryRows),
    [ancillaryRows]
  );
  const gpi = useMemo(
    () => calcGPI(leaseIncome, occRevenue, ancIncome),
    [leaseIncome, occRevenue, ancIncome]
  );

  const defaultsKey = getExpenseDefaultsKey(propertyType);
  const relevantDefaults = useMemo(
    () => expenseDefaults.filter((d) => d.property_type === defaultsKey),
    [expenseDefaults, defaultsKey]
  );

  const basisCount = useMemo(
    () => getBasisCount(propertyType, totalUnits, totalSf),
    [propertyType, totalUnits, totalSf]
  );

  const expenseDefaultAmounts = useMemo(
    () => calcExpenseDefaults(relevantDefaults, basisCount),
    [relevantDefaults, basisCount]
  );

  // Yr1 EGI for expense calc
  const yr1VacancyPct = assumptions.vacancy_pct[0] ?? 10;
  const yr1EGI =
    gpi.current * (1 - yr1VacancyPct / 100) * (1 - assumptions.bad_debt_pct / 100);

  const yr1Expenses = useMemo(
    () => calcYr1Expenses(expenseDefaultAmounts, expenseOverrides, yr1EGI),
    [expenseDefaultAmounts, expenseOverrides, yr1EGI]
  );

  const proforma = useMemo(
    () =>
      buildProForma(
        gpi.current,
        gpi.stabilized,
        t12,
        yr1Expenses,
        assumptions,
        financing,
        purchasePrice
      ),
    [gpi, t12, yr1Expenses, assumptions, financing, purchasePrice]
  );

  const yr1NOI = proforma.find((p) => p.year === 1)?.noi ?? 0;
  const yr1DS = proforma.find((p) => p.year === 1)?.debt_service ?? 0;
  const yr1DSCR = yr1DS > 0 ? yr1NOI / yr1DS : 0;
  const computedGoingInCap = purchasePrice > 0 ? (yr1NOI / purchasePrice) * 100 : 0;

  const exitAnalysis = useMemo(
    () =>
      calcExitAnalysis(
        proforma,
        exitCapRate,
        dispositionCostPct,
        equityInvested,
        financing.exit_loan_amount,
        financing.exit_rate,
        financing.exit_amortization_years,
        financing.bridge_term_months
      ),
    [proforma, exitCapRate, dispositionCostPct, equityInvested, financing]
  );

  const stabilizedNOI = proforma.find((p) => p.year === 6)?.noi ?? yr1NOI;
  const valuationTable = useMemo(
    () => calcValuationTable(stabilizedNOI),
    [stabilizedNOI]
  );

  const sensitivityMatrix = useMemo(
    () =>
      calcSensitivityMatrix(
        yr1NOI,
        financing.bridge_rate || financing.exit_rate,
        financing.bridge_loan_amount || financing.exit_loan_amount,
        financing.bridge_amortization_months || financing.exit_amortization_years * 12
      ),
    [yr1NOI, financing]
  );

  const pohAnalysis = useMemo(() => {
    if (propertyType !== "mobile_home_park") return null;
    return calcPOHAnalysis(pohRentalIncome, pohExpenseRatio, yr1NOI, yr1DS);
  }, [propertyType, pohRentalIncome, pohExpenseRatio, yr1NOI, yr1DS]);

  // ---- Save ----

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      let currentUwId = uwId;

      if (!currentUwId) {
        const result = await createUnderwriting(loanId, propertyType);
        if (result.error || !result.id) {
          toast({
            title: "Error",
            description: result.error ?? "Failed to create underwriting",
            variant: "destructive",
          });
          setSaving(false);
          return;
        }
        currentUwId = result.id;
        setUwId(currentUwId);
      }

      // Save all data in parallel
      const uwData = {
        property_type: propertyType,
        total_units_spaces: totalUnits,
        total_sf: totalSf,
        year_built: yearBuilt,
        operating_days_per_year: operatingDays,
        current_lease_income: leaseIncome.current,
        stabilized_lease_income: leaseIncome.stabilized,
        current_occupancy_revenue: occRevenue.current,
        stabilized_occupancy_revenue: occRevenue.stabilized,
        current_ancillary_income: ancIncome.current,
        stabilized_ancillary_income: ancIncome.stabilized,
        t12_gpi: t12?.gpi ?? null,
        t12_vacancy_pct: t12?.vacancy_pct ?? null,
        t12_bad_debt_pct: t12?.bad_debt_pct ?? null,
        t12_mgmt_fee: t12?.mgmt_fee ?? null,
        t12_taxes: t12?.taxes ?? null,
        t12_insurance: t12?.insurance ?? null,
        t12_utilities: t12?.utilities ?? null,
        t12_repairs: t12?.repairs ?? null,
        t12_contract_services: t12?.contract_services ?? null,
        t12_payroll: t12?.payroll ?? null,
        t12_marketing: t12?.marketing ?? null,
        t12_ga: t12?.ga ?? null,
        t12_replacement_reserve: t12?.replacement_reserve ?? null,
        yr1_mgmt_fee_pct: expenseOverrides.mgmt_fee_pct,
        yr1_taxes_override: expenseOverrides.taxes,
        yr1_insurance_override: expenseOverrides.insurance,
        yr1_utilities_override: expenseOverrides.utilities,
        yr1_repairs_override: expenseOverrides.repairs,
        yr1_contract_override: expenseOverrides.contract_services,
        yr1_payroll_override: expenseOverrides.payroll,
        yr1_marketing_override: expenseOverrides.marketing,
        yr1_ga_override: expenseOverrides.ga,
        yr1_reserve_override: expenseOverrides.reserve,
        rent_growth_yr1: assumptions.rent_growth[0],
        rent_growth_yr2: assumptions.rent_growth[1],
        rent_growth_yr3: assumptions.rent_growth[2],
        rent_growth_yr4: assumptions.rent_growth[3],
        rent_growth_yr5: assumptions.rent_growth[4],
        expense_growth_yr1: assumptions.expense_growth[0],
        expense_growth_yr2: assumptions.expense_growth[1],
        expense_growth_yr3: assumptions.expense_growth[2],
        expense_growth_yr4: assumptions.expense_growth[3],
        expense_growth_yr5: assumptions.expense_growth[4],
        vacancy_pct_yr1: assumptions.vacancy_pct[0],
        vacancy_pct_yr2: assumptions.vacancy_pct[1],
        vacancy_pct_yr3: assumptions.vacancy_pct[2],
        vacancy_pct_yr4: assumptions.vacancy_pct[3],
        vacancy_pct_yr5: assumptions.vacancy_pct[4],
        stabilized_vacancy_pct: assumptions.stabilized_vacancy_pct,
        bad_debt_pct: assumptions.bad_debt_pct,
        bridge_loan_amount: financing.bridge_loan_amount,
        bridge_term_months: financing.bridge_term_months,
        bridge_rate: financing.bridge_rate,
        bridge_amortization_months: financing.bridge_amortization_months,
        bridge_io_months: financing.bridge_io_months,
        bridge_origination_pts: financing.bridge_origination_pts,
        exit_loan_amount: financing.exit_loan_amount,
        exit_rate: financing.exit_rate,
        exit_amortization_years: financing.exit_amortization_years,
        exit_io_months: financing.exit_io_months,
        purchase_price: purchasePrice,
        going_in_cap_rate: goingInCapRate || computedGoingInCap,
        exit_cap_rate: exitCapRate,
        disposition_cost_pct: dispositionCostPct,
        equity_invested: equityInvested,
        poh_rental_income: pohRentalIncome,
        poh_expense_ratio: pohExpenseRatio,
      };

      const rrRows = rentRoll.map(({ id: _id, ...r }) => r);
      const occRows = occupancyRows.map(({ id: _id, ...r }) => r);
      const ancRows = ancillaryRows.map(({ id: _id, ...r }) => r);
      const pfRows = proforma.map((p) => ({
        year: p.year,
        gpi: p.gpi,
        vacancy: p.vacancy,
        bad_debt: p.bad_debt,
        egi: p.egi,
        mgmt_fee: p.mgmt_fee,
        taxes: p.taxes,
        insurance: p.insurance,
        utilities: p.utilities,
        repairs: p.repairs,
        contract_services: p.contract_services,
        payroll: p.payroll,
        marketing: p.marketing,
        ga: p.ga,
        replacement_reserve: p.replacement_reserve,
        total_opex: p.total_opex,
        noi: p.noi,
        debt_service: p.debt_service,
        net_cash_flow: p.net_cash_flow,
        dscr: p.dscr,
        cap_rate: p.cap_rate,
        expense_ratio: p.expense_ratio,
        cumulative_cash_flow: p.cumulative_cash_flow,
      }));

      // Save pending upload mappings alongside other data
      const uploadPromises = pendingUploads.map((pu) =>
        saveUploadMapping(
          currentUwId!,
          pu.uploadType,
          pu.filename,
          pu.columnMapping,
          pu.rowCount,
          pu.parsedData
        )
      );

      // Save T12 overrides if we have an active upload
      const t12OverridePromise = t12Upload?.id && t12Overrides.length > 0
        ? saveT12Overrides(
            t12Upload.id,
            t12Overrides.map((o) => ({
              category: o.category,
              override_annual_total: o.override_annual_total,
            }))
          )
        : Promise.resolve({ success: true } as { success: boolean; error?: string });

      const results = await Promise.all([
        saveUnderwriting(currentUwId, uwData),
        saveRentRoll(currentUwId, rrRows),
        saveOccupancyRows(currentUwId, occRows),
        saveAncillaryRows(currentUwId, ancRows),
        saveProFormaYears(currentUwId, pfRows),
        t12OverridePromise,
        ...uploadPromises,
      ]);

      const hasError = results.some((r) => "error" in r && r.error);
      if (hasError) {
        toast({
          title: "Save Error",
          description: results.find((r) => "error" in r && r.error)?.error as string,
          variant: "destructive",
        });
      } else {
        // Clear pending uploads after successful save
        setPendingUploads([]);
        toast({ title: "Saved", description: "Underwriting saved successfully." });
      }
    } catch (err) {
      console.error("Save error:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [
    uwId, loanId, propertyType, totalUnits, totalSf, yearBuilt, operatingDays,
    leaseIncome, occRevenue, ancIncome, t12, expenseOverrides, assumptions,
    financing, purchasePrice, goingInCapRate, computedGoingInCap, exitCapRate,
    dispositionCostPct, equityInvested, pohRentalIncome, pohExpenseRatio,
    rentRoll, occupancyRows, ancillaryRows, proforma, toast, pendingUploads,
    t12Upload, t12Overrides,
  ]);

  const handleSubmitForReview = useCallback(async () => {
    await handleSave();
    if (uwId) {
      const result = await updateUWStatus(uwId, "in_review");
      if (!result.error) {
        setStatus("in_review");
        toast({ title: "Submitted", description: "Underwriting submitted for review." });
      }
    }
  }, [handleSave, uwId, toast]);

  const handleApprove = useCallback(async () => {
    if (uwId) {
      const result = await updateUWStatus(uwId, "approved");
      if (!result.error) {
        setStatus("approved");
        toast({ title: "Approved", description: "Underwriting approved." });
      }
    }
  }, [uwId, toast]);

  const handleReject = useCallback(async () => {
    if (uwId) {
      const result = await updateUWStatus(uwId, "rejected");
      if (!result.error) {
        setStatus("rejected");
        toast({ title: "Rejected", description: "Underwriting rejected." });
      }
    }
  }, [uwId, toast]);

  return (
    <div className="space-y-4">
      {/* Status + Actions Bar */}
      <div className="flex items-center justify-between bg-card border rounded-lg p-3">
        <div className="flex items-center gap-3">
          <Badge className={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Badge>
          {uwId && (
            <span className="text-xs text-muted-foreground">ID: {uwId.slice(0, 8)}...</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleSave} disabled={saving} size="sm">
            <Save className="h-4 w-4 mr-1" />
            {saving ? "Saving..." : "Save Draft"}
          </Button>
          {status === "draft" && (
            <Button
              onClick={handleSubmitForReview}
              disabled={saving}
              variant="outline"
              size="sm"
            >
              <Send className="h-4 w-4 mr-1" />
              Submit for Review
            </Button>
          )}
          {status === "in_review" && (
            <>
              <Button onClick={handleApprove} size="sm" className="bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button onClick={handleReject} variant="destructive" size="sm">
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="income" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="historicals">Historicals</TabsTrigger>
          <TabsTrigger value="proforma">Pro Forma</TabsTrigger>
          <TabsTrigger value="financing">Financing</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="income">
          <IncomeTab
            propertyType={propertyType}
            setPropertyType={setPropertyType}
            totalUnits={totalUnits}
            setTotalUnits={setTotalUnits}
            totalSf={totalSf}
            setTotalSf={setTotalSf}
            yearBuilt={yearBuilt}
            setYearBuilt={setYearBuilt}
            operatingDays={operatingDays}
            setOperatingDays={setOperatingDays}
            rentRoll={rentRoll}
            setRentRoll={setRentRoll}
            occupancyRows={occupancyRows}
            setOccupancyRows={setOccupancyRows}
            ancillaryRows={ancillaryRows}
            setAncillaryRows={setAncillaryRows}
            gpi={gpi}
            onRentRollImport={handleRentRollImport}
            rentRollVersions={rentRollVersions}
            onRestoreVersion={handleRestoreVersion}
          />
        </TabsContent>

        <TabsContent value="expenses">
          <ExpensesTab
            t12={t12}
            setT12={setT12}
            expenseOverrides={expenseOverrides}
            setExpenseOverrides={setExpenseOverrides}
            assumptions={assumptions}
            setAssumptions={setAssumptions}
            expenseDefaultAmounts={expenseDefaultAmounts}
            yr1Expenses={yr1Expenses}
            relevantDefaults={relevantDefaults}
            basisCount={basisCount}
            propertyType={propertyType}
            onT12Import={handleT12Import}
          />
        </TabsContent>

        <TabsContent value="historicals">
          <HistoricalsTab
            loanId={loanId}
            totalUnits={totalUnits}
            upload={t12Upload}
            lineItems={t12LineItems}
            mappings={t12Mappings}
            versions={t12Versions}
            overrides={t12Overrides}
            onUploadT12={handleT12HistoricalsImport}
            onActivateVersion={handleActivateT12Version}
            onOverrideChange={handleT12OverrideChange}
            previousMappings={existingT12PreviousMappings}
          />
        </TabsContent>

        <TabsContent value="proforma">
          <ProFormaTab
            proforma={proforma}
            propertyType={propertyType}
            totalUnits={totalUnits}
            pohAnalysis={pohAnalysis}
            pohRentalIncome={pohRentalIncome}
            setPohRentalIncome={setPohRentalIncome}
            pohExpenseRatio={pohExpenseRatio}
            setPohExpenseRatio={setPohExpenseRatio}
          />
        </TabsContent>

        <TabsContent value="financing">
          <FinancingTab
            financing={financing}
            setFinancing={setFinancing}
            purchasePrice={purchasePrice}
            setPurchasePrice={setPurchasePrice}
            goingInCapRate={goingInCapRate}
            setGoingInCapRate={setGoingInCapRate}
            exitCapRate={exitCapRate}
            setExitCapRate={setExitCapRate}
            dispositionCostPct={dispositionCostPct}
            setDispositionCostPct={setDispositionCostPct}
            equityInvested={equityInvested}
            setEquityInvested={setEquityInvested}
            exitAnalysis={exitAnalysis}
            valuationTable={valuationTable}
            sensitivityMatrix={sensitivityMatrix}
            yr1NOI={yr1NOI}
            yr1DSCR={yr1DSCR}
            computedGoingInCap={computedGoingInCap}
            loanAmount={loan.loan_amount ?? 0}
          />
        </TabsContent>

        <TabsContent value="summary">
          <SummaryTab
            loan={loan}
            propertyType={propertyType}
            totalUnits={totalUnits}
            totalSf={totalSf}
            purchasePrice={purchasePrice}
            financing={financing}
            proforma={proforma}
            exitAnalysis={exitAnalysis}
            yr1DSCR={yr1DSCR}
            computedGoingInCap={computedGoingInCap}
            gpi={gpi}
            status={status}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
