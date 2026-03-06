/* eslint-disable @typescript-eslint/no-explicit-any */
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// ── Types ──────────────────────────────────────────────────────────────

interface LoanData {
  loan_id: string;
  borrower_name: string | null;
  entity_name: string | null;
  property_address: string | null;
  total_loan_amount: number;
  current_balance: number | null;
  interest_rate: number | null;
  default_rate: number | null;
  origination_date: string | null;
  maturity_date: string | null;
  first_payment_date: string | null;
  term_months: number | null;
  monthly_payment: number | null;
  payment_structure: string | null;
  interest_method: string | null;
  grace_period_days: number | null;
  late_fee_type: string | null;
  late_fee_amount: number | null;
  dutch_interest: boolean | null;
  loan_status: string | null;
  servicing_status: string | null;
  // Enrichment from loans table
  extension_term_months: number | null;
  extension_fee_pct: number | null;
  escrow_holdback: number | null;
  interest_reserve: number | null;
  prepayment_penalty_type: string | null;
  prepayment_penalty_pct: number | null;
  loan_type: string | null;
  payment_type: string | null;
}

interface PaymentRecord {
  date: string | null;
  type: string | null;
  amount_due: number | null;
  amount_paid: number | null;
  principal: number | null;
  interest: number | null;
  late_fee: number | null;
  balance_after: number | null;
  payment_method: string | null;
  entry_type: string | null;
}

// ── Styles ─────────────────────────────────────────────────────────────

const COLORS = {
  headerBg: "FF1A1A1A",
  headerFont: "FFFFFFFF",
  sectionLabel: "FF1A1A1A",
  inputFont: "FF0000FF",
  formulaFont: "FF000000",
  crossSheetFont: "FF008000",
  inputBg: "FFFFFFF0",
  stripeBg: "FFF7F7F8",
  white: "FFFFFFFF",
  accentOrange: "FFE5930E",
  accentRed: "FFE5453D",
};

const FONT_BASE: Partial<ExcelJS.Font> = {
  name: "Arial",
  size: 11,
};

const FONT_HEADER: Partial<ExcelJS.Font> = {
  ...FONT_BASE,
  bold: true,
  color: { argb: COLORS.headerFont },
};

const FONT_SECTION: Partial<ExcelJS.Font> = {
  ...FONT_BASE,
  size: 12,
  bold: true,
  color: { argb: COLORS.sectionLabel },
};

const FONT_INPUT: Partial<ExcelJS.Font> = {
  ...FONT_BASE,
  color: { argb: COLORS.inputFont },
};

const FONT_FORMULA: Partial<ExcelJS.Font> = {
  ...FONT_BASE,
  color: { argb: COLORS.formulaFont },
};

const FONT_CROSS_SHEET: Partial<ExcelJS.Font> = {
  ...FONT_BASE,
  color: { argb: COLORS.crossSheetFont },
};

const FILL_HEADER: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: COLORS.headerBg },
};

const FILL_INPUT: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: COLORS.inputBg },
};

const FILL_STRIPE: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: COLORS.stripeBg },
};

const BORDER_THIN: Partial<ExcelJS.Borders> = {
  bottom: { style: "thin", color: { argb: "FFE5E5E7" } },
};

const BORDER_SECTION: Partial<ExcelJS.Borders> = {
  bottom: { style: "medium", color: { argb: COLORS.sectionLabel } },
};

const BORDER_DOUBLE_TOP: Partial<ExcelJS.Borders> = {
  top: { style: "double", color: { argb: COLORS.sectionLabel } },
};

const FMT = {
  currency: "$#,##0.00",
  currencyWhole: "$#,##0",
  pct: "0.00%",
  pctDaily: "0.000000%",
  date: "MM/DD/YYYY",
  integer: "0",
};

// ── Helpers ────────────────────────────────────────────────────────────

function normalizeRate(rate: number | null): number {
  if (rate == null) return 0;
  return rate > 1 ? rate / 100 : rate;
}

function colLetter(col: number): string {
  let letter = "";
  let c = col;
  while (c > 0) {
    const mod = (c - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    c = Math.floor((c - 1) / 26);
  }
  return letter;
}

function cell(col: number, row: number): string {
  return `${colLetter(col)}${row}`;
}

function applyHeaderRow(ws: ExcelJS.Worksheet, row: number, cols: number) {
  const r = ws.getRow(row);
  for (let c = 1; c <= cols; c++) {
    const ce = r.getCell(c);
    ce.font = FONT_HEADER;
    ce.fill = FILL_HEADER;
    ce.alignment = { vertical: "middle", horizontal: "center" };
  }
  r.height = 22;
}

function applyInputCell(ce: ExcelJS.Cell) {
  ce.font = FONT_INPUT;
  ce.fill = FILL_INPUT;
}

function applyFormulaCell(ce: ExcelJS.Cell) {
  ce.font = FONT_FORMULA;
}

function applyCrossSheetCell(ce: ExcelJS.Cell) {
  ce.font = FONT_CROSS_SHEET;
}

function applyStripe(ws: ExcelJS.Worksheet, row: number, cols: number) {
  const r = ws.getRow(row);
  for (let c = 1; c <= cols; c++) {
    r.getCell(c).fill = FILL_STRIPE;
  }
}

function dateSerial(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00Z");
  if (isNaN(d.getTime())) return null;
  // Excel date serial: days since 1899-12-30
  const epoch = new Date("1899-12-30T00:00:00Z");
  return Math.floor((d.getTime() - epoch.getTime()) / 86400000);
}

function setupLandscape(ws: ExcelJS.Worksheet) {
  ws.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  };
}

// ── Main Export Function ───────────────────────────────────────────────

export async function exportServicingWorkbook(
  supabase: any,
  loanId: string
): Promise<{ success: boolean; loanId: string }> {
  // 1. Fetch data
  const loanData = await fetchLoanData(supabase, loanId);
  const payments = await fetchPayments(supabase, loanId);

  // 2. Create workbook
  const wb = new ExcelJS.Workbook();
  wb.creator = "Requity Group Portal";
  wb.created = new Date();

  // Track row positions for each sheet
  const summaryRows: Record<string, number> = {};

  // 3. Build all tabs
  buildLoanSummary(wb, loanData, summaryRows);
  buildAmortizationSchedule(wb, loanData, summaryRows);
  buildPaymentTracker(wb, loanData, payments, summaryRows);
  buildPayoffQuote(wb, loanData, summaryRows);
  buildStressTest(wb, loanData, summaryRows);

  // 4. Generate and download
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const today = new Date().toISOString().slice(0, 10);
  const filename = `Requity_Servicing_${loanId}_${today}.xlsx`;
  saveAs(blob, filename);

  return { success: true, loanId };
}

// ── Data Fetching ──────────────────────────────────────────────────────

async function fetchLoanData(supabase: any, loanId: string): Promise<LoanData> {
  // Try servicing_loans first
  const { data: servicingLoan } = await supabase
    .from("servicing_loans")
    .select("*")
    .eq("loan_id", loanId)
    .single();

  // Always try loans table for enrichment
  const { data: pipelineLoan } = await supabase
    .from("loans")
    .select(
      "loan_number, total_loan_amount, interest_rate, default_rate, loan_term_months, extension_term_months, extension_fee_pct, origination_date, maturity_date, first_payment_date, monthly_payment, escrow_holdback, interest_reserve, prepayment_penalty_type, prepayment_penalty_pct, property_address, type, purpose"
    )
    .eq("loan_number", loanId)
    .single();

  if (servicingLoan) {
    return {
      loan_id: servicingLoan.loan_id,
      borrower_name: servicingLoan.borrower_name,
      entity_name: servicingLoan.entity_name,
      property_address: servicingLoan.property_address,
      total_loan_amount: servicingLoan.total_loan_amount ?? 0,
      current_balance: servicingLoan.current_balance,
      interest_rate: normalizeRate(servicingLoan.interest_rate),
      default_rate: normalizeRate(servicingLoan.default_rate),
      origination_date: servicingLoan.origination_date,
      maturity_date: servicingLoan.maturity_date,
      first_payment_date: servicingLoan.first_payment_date,
      term_months: servicingLoan.term_months,
      monthly_payment: servicingLoan.monthly_payment,
      payment_structure: servicingLoan.payment_structure ?? servicingLoan.payment_type,
      interest_method: servicingLoan.interest_method ?? (servicingLoan.dutch_interest ? "dutch" : "non_dutch"),
      grace_period_days: servicingLoan.grace_period_days ?? 10,
      late_fee_type: servicingLoan.late_fee_type ?? "percentage",
      late_fee_amount: servicingLoan.late_fee_amount != null
        ? (servicingLoan.late_fee_amount > 1
          ? servicingLoan.late_fee_amount / 100
          : servicingLoan.late_fee_amount)
        : 0.05,
      dutch_interest: servicingLoan.dutch_interest,
      loan_status: servicingLoan.loan_status,
      servicing_status: servicingLoan.servicing_status,
      loan_type: servicingLoan.loan_type ?? pipelineLoan?.type,
      payment_type: servicingLoan.payment_type,
      // Enrichment
      extension_term_months: pipelineLoan?.extension_term_months ?? null,
      extension_fee_pct: pipelineLoan?.extension_fee_pct != null
        ? normalizeRate(pipelineLoan.extension_fee_pct)
        : null,
      escrow_holdback: pipelineLoan?.escrow_holdback ?? null,
      interest_reserve: pipelineLoan?.interest_reserve ?? null,
      prepayment_penalty_type: pipelineLoan?.prepayment_penalty_type ?? null,
      prepayment_penalty_pct: pipelineLoan?.prepayment_penalty_pct != null
        ? normalizeRate(pipelineLoan.prepayment_penalty_pct)
        : null,
    };
  }

  // Fallback to loans table
  if (pipelineLoan) {
    return {
      loan_id: loanId,
      borrower_name: null,
      entity_name: null,
      property_address: pipelineLoan.property_address,
      total_loan_amount: pipelineLoan.total_loan_amount ?? 0,
      current_balance: pipelineLoan.total_loan_amount,
      interest_rate: normalizeRate(pipelineLoan.interest_rate),
      default_rate: normalizeRate(pipelineLoan.default_rate),
      origination_date: pipelineLoan.origination_date,
      maturity_date: pipelineLoan.maturity_date,
      first_payment_date: pipelineLoan.first_payment_date,
      term_months: pipelineLoan.loan_term_months,
      monthly_payment: pipelineLoan.monthly_payment,
      payment_structure: "interest_only",
      interest_method: "non_dutch",
      grace_period_days: 10,
      late_fee_type: "percentage",
      late_fee_amount: 0.05,
      dutch_interest: false,
      loan_status: null,
      servicing_status: null,
      loan_type: pipelineLoan.type,
      payment_type: null,
      extension_term_months: pipelineLoan.extension_term_months,
      extension_fee_pct: pipelineLoan.extension_fee_pct != null
        ? normalizeRate(pipelineLoan.extension_fee_pct)
        : null,
      escrow_holdback: pipelineLoan.escrow_holdback,
      interest_reserve: pipelineLoan.interest_reserve,
      prepayment_penalty_type: pipelineLoan.prepayment_penalty_type,
      prepayment_penalty_pct: pipelineLoan.prepayment_penalty_pct != null
        ? normalizeRate(pipelineLoan.prepayment_penalty_pct)
        : null,
    };
  }

  throw new Error(`Loan not found: ${loanId}`);
}

async function fetchPayments(
  supabase: any,
  loanId: string
): Promise<PaymentRecord[]> {
  const { data } = await supabase
    .from("servicing_payments")
    .select("*")
    .eq("loan_id", loanId)
    .order("date", { ascending: true });

  return (data ?? []).map((p: any) => ({
    date: p.date,
    type: p.type,
    amount_due: p.amount_due,
    amount_paid: p.amount_paid,
    principal: p.principal,
    interest: p.interest,
    late_fee: p.late_fee,
    balance_after: p.balance_after,
    payment_method: p.payment_method,
    entry_type: p.entry_type,
  }));
}

// ── Tab 1: Loan Summary ────────────────────────────────────────────────

function buildLoanSummary(
  wb: ExcelJS.Workbook,
  loan: LoanData,
  rows: Record<string, number>
) {
  const ws = wb.addWorksheet("Loan Summary", {
    properties: { tabColor: { argb: "FF1A1A1A" } },
  });
  setupLandscape(ws);

  ws.columns = [
    { width: 32 }, // A: Label
    { width: 24 }, // B: Value
    { width: 6 },  // C: spacer
    { width: 32 }, // D: Label
    { width: 24 }, // E: Value
  ];

  let r = 1;

  // ── Title
  ws.mergeCells(`A${r}:E${r}`);
  const titleCell = ws.getCell(`A${r}`);
  titleCell.value = `Loan Summary — ${loan.loan_id}`;
  titleCell.font = { ...FONT_BASE, size: 14, bold: true };
  titleCell.alignment = { horizontal: "left", vertical: "middle" };
  ws.getRow(r).height = 28;
  r += 2;

  // ── LOAN TERMS section ──
  ws.mergeCells(`A${r}:B${r}`);
  ws.getCell(`A${r}`).value = "LOAN TERMS";
  ws.getCell(`A${r}`).font = FONT_SECTION;
  ws.getCell(`A${r}`).border = BORDER_SECTION;
  ws.getCell(`B${r}`).border = BORDER_SECTION;

  ws.mergeCells(`D${r}:E${r}`);
  ws.getCell(`D${r}`).value = "CALCULATED FIELDS";
  ws.getCell(`D${r}`).font = FONT_SECTION;
  ws.getCell(`D${r}`).border = BORDER_SECTION;
  ws.getCell(`E${r}`).border = BORDER_SECTION;
  r += 1;

  // Helper to write an input row on the left side (columns A-B)
  function writeInput(label: string, value: any, fmt?: string, key?: string) {
    ws.getCell(`A${r}`).value = label;
    ws.getCell(`A${r}`).font = FONT_BASE;
    const valCell = ws.getCell(`B${r}`);
    valCell.value = value;
    applyInputCell(valCell);
    if (fmt) valCell.numFmt = fmt;
    valCell.border = BORDER_THIN;
    ws.getCell(`A${r}`).border = BORDER_THIN;
    if (key) rows[key] = r;
    r++;
  }

  // Helper to write a calculated row on the right side (columns D-E)
  let calcRow = r; // Track right column independently
  function writeCalc(label: string, formula: string, fmt?: string, key?: string) {
    ws.getCell(`D${calcRow}`).value = label;
    ws.getCell(`D${calcRow}`).font = FONT_BASE;
    const valCell = ws.getCell(`E${calcRow}`);
    valCell.value = { formula };
    applyFormulaCell(valCell);
    if (fmt) valCell.numFmt = fmt;
    valCell.border = BORDER_THIN;
    ws.getCell(`D${calcRow}`).border = BORDER_THIN;
    if (key) rows[key] = calcRow;
    calcRow++;
  }

  // Determine payment structure label
  const isIO =
    loan.payment_structure === "interest_only" ||
    loan.payment_type === "interest_only";
  const loanTypeLabel = loan.loan_type
    ? `${loan.loan_type.toUpperCase()} — ${isIO ? "Interest Only" : "P&I"}`
    : isIO
    ? "Bridge — Interest Only"
    : "Amortizing — P&I";

  // Compute payment day from first_payment_date or origination_date
  const pmtDay = loan.first_payment_date
    ? new Date(loan.first_payment_date + "T00:00:00Z").getUTCDate()
    : loan.origination_date
    ? new Date(loan.origination_date + "T00:00:00Z").getUTCDate()
    : 1;

  const escrowMonthly = loan.escrow_holdback
    ? loan.escrow_holdback / Math.max(loan.term_months ?? 12, 1)
    : 0;

  // Left column — LOAN TERMS (inputs, blue on yellow)
  writeInput("Borrower", loan.borrower_name ?? "—", undefined, "borrower");
  writeInput("Entity", loan.entity_name ?? "—", undefined, "entity");
  writeInput("Loan Number", loan.loan_id, undefined, "loanNumber");
  writeInput("Loan Type", loanTypeLabel, undefined, "loanType");
  writeInput(
    "Original Principal Balance",
    loan.total_loan_amount,
    FMT.currencyWhole,
    "opb"
  );
  writeInput("Note Rate Annual", loan.interest_rate ?? 0, FMT.pct, "noteRate");
  writeInput(
    "Default Rate Annual",
    loan.default_rate ?? (loan.interest_rate ? loan.interest_rate + 0.05 : 0.18),
    FMT.pct,
    "defaultRate"
  );

  // Dates — store as Excel serial numbers for formula use
  const origSerial = dateSerial(loan.origination_date);
  const matSerial = dateSerial(loan.maturity_date);
  const firstPmtSerial = dateSerial(loan.first_payment_date);

  writeInput(
    "Origination Date",
    origSerial ?? "",
    FMT.date,
    "origDate"
  );
  writeInput(
    "Maturity Date",
    matSerial ?? "",
    FMT.date,
    "maturityDate"
  );
  writeInput(
    "First Payment Date",
    firstPmtSerial ?? "",
    FMT.date,
    "firstPmtDate"
  );
  writeInput(
    "Loan Term Months",
    loan.term_months ?? 12,
    FMT.integer,
    "termMonths"
  );
  writeInput(
    "Extension Option Months",
    loan.extension_term_months ?? 0,
    FMT.integer,
    "extensionMonths"
  );
  writeInput(
    "Extension Fee %",
    loan.extension_fee_pct ?? 0,
    FMT.pct,
    "extensionFeePct"
  );
  writeInput("Payment Day of Month", pmtDay, FMT.integer, "pmtDay");
  writeInput(
    "Late Fee Grace Days",
    loan.grace_period_days ?? 10,
    FMT.integer,
    "graceDays"
  );
  writeInput(
    "Late Fee % or Flat $",
    loan.late_fee_amount ?? 0.05,
    loan.late_fee_type === "flat" ? FMT.currency : FMT.pct,
    "lateFeeValue"
  );
  writeInput(
    "Late Fee Type",
    loan.late_fee_type === "flat" ? "Flat" : "Pct",
    undefined,
    "lateFeeType"
  );
  writeInput(
    "Prepayment Penalty",
    loan.prepayment_penalty_type ?? "None",
    undefined,
    "prepayPenalty"
  );
  writeInput(
    "Escrow/Impound Monthly",
    escrowMonthly,
    FMT.currency,
    "escrowMonthly"
  );
  writeInput(
    "Interest Method",
    loan.dutch_interest ? "Dutch (30/360)" : "Actual/360",
    undefined,
    "interestMethod"
  );

  // Right column — CALCULATED FIELDS (formulas)
  const opbCell = `B${rows["opb"]}`;
  const noteRateCell = `B${rows["noteRate"]}`;
  const defaultRateCell = `B${rows["defaultRate"]}`;
  const origDateCell = `B${rows["origDate"]}`;
  const matDateCell = `B${rows["maturityDate"]}`;
  const escrowCell = `B${rows["escrowMonthly"]}`;
  const lateFeeValueCell = `B${rows["lateFeeValue"]}`;
  const lateFeeTypeCell = `B${rows["lateFeeType"]}`;
  const extFeePctCell = `B${rows["extensionFeePct"]}`;

  writeCalc(
    "Daily Rate Note",
    `${noteRateCell}/360`,
    FMT.pctDaily,
    "dailyRateNote"
  );
  writeCalc(
    "Daily Rate Default",
    `${defaultRateCell}/360`,
    FMT.pctDaily,
    "dailyRateDefault"
  );
  writeCalc(
    "Monthly IO Payment",
    `${opbCell}*${noteRateCell}/12`,
    FMT.currency,
    "monthlyIO"
  );
  writeCalc(
    "Monthly Payment + Escrow",
    `E${rows["monthlyIO"]}+${escrowCell}`,
    FMT.currency,
    "monthlyPlusEscrow"
  );
  writeCalc(
    "Per Diem Interest Note",
    `${opbCell}*E${rows["dailyRateNote"]}`,
    FMT.currency,
    "perDiemNote"
  );
  writeCalc(
    "Per Diem Interest Default",
    `${opbCell}*E${rows["dailyRateDefault"]}`,
    FMT.currency,
    "perDiemDefault"
  );
  writeCalc(
    "Late Fee Amount",
    `IF(${lateFeeTypeCell}="Pct",${lateFeeValueCell}*E${rows["monthlyIO"]},${lateFeeValueCell})`,
    FMT.currency,
    "lateFeeCalc"
  );
  writeCalc(
    "Extension Fee Amount",
    `${opbCell}*${extFeePctCell}`,
    FMT.currency,
    "extensionFeeAmt"
  );
  writeCalc(
    "Days in Loan Term",
    `${matDateCell}-${origDateCell}`,
    FMT.integer,
    "daysInTerm"
  );
  writeCalc(
    "Total Interest if Held to Maturity",
    `E${rows["perDiemNote"]}*E${rows["daysInTerm"]}`,
    FMT.currency,
    "totalInterestToMat"
  );

  // Advance r past any calc rows
  r = Math.max(r, calcRow) + 2;

  // ── Color Legend ──
  ws.mergeCells(`A${r}:E${r}`);
  ws.getCell(`A${r}`).value = "COLOR LEGEND";
  ws.getCell(`A${r}`).font = FONT_SECTION;
  ws.getCell(`A${r}`).border = BORDER_SECTION;
  r++;

  const legend = [
    { color: COLORS.inputFont, bg: COLORS.inputBg, text: "Blue text on yellow = Editable input (change to stress test)" },
    { color: COLORS.formulaFont, bg: COLORS.white, text: "Black text = Formula (auto-calculates)" },
    { color: COLORS.crossSheetFont, bg: COLORS.white, text: "Green text = Cross-sheet reference" },
  ];
  for (const item of legend) {
    const swatch = ws.getCell(`A${r}`);
    swatch.value = "  ██  ";
    swatch.font = { ...FONT_BASE, color: { argb: item.color } };
    swatch.fill = { type: "pattern", pattern: "solid", fgColor: { argb: item.bg } };
    ws.mergeCells(`B${r}:E${r}`);
    ws.getCell(`B${r}`).value = item.text;
    ws.getCell(`B${r}`).font = { ...FONT_BASE, size: 10 };
    r++;
  }
}

// ── Tab 2: Amortization Schedule ───────────────────────────────────────

function buildAmortizationSchedule(
  wb: ExcelJS.Workbook,
  loan: LoanData,
  summaryRows: Record<string, number>
) {
  const ws = wb.addWorksheet("Amortization Schedule", {
    properties: { tabColor: { argb: "FF3B82F6" } },
  });
  setupLandscape(ws);

  const termMonths = loan.term_months ?? 12;
  const scheduleRows = Math.max(termMonths + 6, 24);

  ws.columns = [
    { width: 6 },  // A: #
    { width: 14 }, // B: Pmt Date
    { width: 16 }, // C: Beg Balance
    { width: 14 }, // D: Interest
    { width: 12 }, // E: Escrow
    { width: 14 }, // F: Total Pmt
    { width: 14 }, // G: Principal
    { width: 16 }, // H: End Balance
    { width: 16 }, // I: Cumul Int
    { width: 8 },  // J: Days
    { width: 14 }, // K: Per Diem
  ];

  // Summary references
  const sOPB = `'Loan Summary'!B${summaryRows["opb"]}`;
  const sRate = `'Loan Summary'!B${summaryRows["noteRate"]}`;
  const sOrigDate = `'Loan Summary'!B${summaryRows["origDate"]}`;
  const sMatDate = `'Loan Summary'!B${summaryRows["maturityDate"]}`;
  const sPmtDay = `'Loan Summary'!B${summaryRows["pmtDay"]}`;
  const sEscrow = `'Loan Summary'!B${summaryRows["escrowMonthly"]}`;
  const sFirstPmt = `'Loan Summary'!B${summaryRows["firstPmtDate"]}`;

  let r = 1;

  // Title
  ws.mergeCells(`A${r}:K${r}`);
  ws.getCell(`A${r}`).value = "Amortization Schedule";
  ws.getCell(`A${r}`).font = { ...FONT_BASE, size: 14, bold: true };
  ws.getRow(r).height = 28;
  r += 1;

  // Subtitle with cross-sheet refs
  ws.mergeCells(`A${r}:K${r}`);
  ws.getCell(`A${r}`).value = {
    formula: `"Loan: "&'Loan Summary'!B${summaryRows["loanNumber"]}&"  |  OPB: "&TEXT(${sOPB},"$#,##0")&"  |  Rate: "&TEXT(${sRate},"0.00%")`,
  };
  ws.getCell(`A${r}`).font = { ...FONT_BASE, size: 10, italic: true };
  r += 2;

  // Column headers
  const headers = [
    "#", "Pmt Date", "Beg Balance", "Interest", "Escrow",
    "Total Pmt", "Principal", "End Balance", "Cumul Int", "Days", "Per Diem",
  ];
  const headerRow = r;
  headers.forEach((h, i) => {
    ws.getCell(cell(i + 1, r)).value = h;
  });
  applyHeaderRow(ws, r, headers.length);
  r++;

  const firstDataRow = r;

  // Schedule rows
  for (let m = 0; m < scheduleRows; m++) {
    const cr = r + m;
    const rowNum = m + 1;
    const isFirst = m === 0;

    // A: #
    ws.getCell(`A${cr}`).value = rowNum;
    ws.getCell(`A${cr}`).font = FONT_BASE;
    ws.getCell(`A${cr}`).alignment = { horizontal: "center" };

    // B: Payment Date
    const pmtDateCell = ws.getCell(`B${cr}`);
    if (isFirst) {
      // If first_payment_date is set, use it; otherwise compute from origination + 1 month
      pmtDateCell.value = {
        formula: `IF(${sFirstPmt}<>"",${sFirstPmt},DATE(YEAR(${sOrigDate}),MONTH(${sOrigDate})+1,${sPmtDay}))`,
      };
    } else {
      pmtDateCell.value = {
        formula: `DATE(YEAR(B${cr - 1}),MONTH(B${cr - 1})+1,DAY(B${cr - 1}))`,
      };
    }
    pmtDateCell.numFmt = FMT.date;
    applyCrossSheetCell(pmtDateCell);

    // C: Beg Balance
    const begBalCell = ws.getCell(`C${cr}`);
    if (isFirst) {
      begBalCell.value = { formula: sOPB };
      applyCrossSheetCell(begBalCell);
    } else {
      begBalCell.value = { formula: `H${cr - 1}` };
      applyFormulaCell(begBalCell);
    }
    begBalCell.numFmt = FMT.currency;

    // D: Interest = BegBal * NoteRate / 12
    const intCell = ws.getCell(`D${cr}`);
    intCell.value = { formula: `C${cr}*${sRate}/12` };
    applyFormulaCell(intCell);
    intCell.numFmt = FMT.currency;

    // E: Escrow
    const escCell = ws.getCell(`E${cr}`);
    escCell.value = { formula: sEscrow };
    applyCrossSheetCell(escCell);
    escCell.numFmt = FMT.currency;

    // F: Total Pmt = Interest + Escrow (for IO), or could include principal for P&I
    const totPmtCell = ws.getCell(`F${cr}`);
    totPmtCell.value = { formula: `D${cr}+E${cr}+G${cr}` };
    applyFormulaCell(totPmtCell);
    totPmtCell.numFmt = FMT.currency;

    // G: Principal — for IO loans, balloon at maturity; for P&I = scheduled - interest
    const prinCell = ws.getCell(`G${cr}`);
    if (loan.payment_structure === "principal_and_interest" && loan.monthly_payment) {
      // P&I: Principal = max(0, MonthlyPmt - Interest)
      const sMonthly = `'Loan Summary'!B${summaryRows["opb"]}`;
      prinCell.value = {
        formula: `IF(B${cr}>=${sMatDate},C${cr},MAX(0,'Loan Summary'!E${summaryRows["monthlyPlusEscrow"]}-E${cr}-D${cr}))`,
      };
    } else {
      // IO: Balloon at maturity
      prinCell.value = {
        formula: `IF(B${cr}>=${sMatDate},C${cr},0)`,
      };
    }
    applyFormulaCell(prinCell);
    prinCell.numFmt = FMT.currency;

    // H: End Balance = Beg - Principal
    const endBalCell = ws.getCell(`H${cr}`);
    endBalCell.value = { formula: `MAX(0,C${cr}-G${cr})` };
    applyFormulaCell(endBalCell);
    endBalCell.numFmt = FMT.currency;

    // I: Cumulative Interest
    const cumIntCell = ws.getCell(`I${cr}`);
    if (isFirst) {
      cumIntCell.value = { formula: `D${cr}` };
    } else {
      cumIntCell.value = { formula: `I${cr - 1}+D${cr}` };
    }
    applyFormulaCell(cumIntCell);
    cumIntCell.numFmt = FMT.currency;

    // J: Days (between payments)
    const daysCell = ws.getCell(`J${cr}`);
    if (isFirst) {
      daysCell.value = { formula: `B${cr}-${sOrigDate}` };
    } else {
      daysCell.value = { formula: `B${cr}-B${cr - 1}` };
    }
    applyFormulaCell(daysCell);
    daysCell.numFmt = FMT.integer;

    // K: Per Diem = BegBal * NoteRate / 360
    const pdCell = ws.getCell(`K${cr}`);
    pdCell.value = { formula: `C${cr}*${sRate}/360` };
    applyFormulaCell(pdCell);
    pdCell.numFmt = FMT.currency;

    // Alternating stripes
    if (rowNum % 2 === 0) {
      applyStripe(ws, cr, headers.length);
    }

    // Thin border
    for (let c = 1; c <= headers.length; c++) {
      ws.getCell(cell(c, cr)).border = BORDER_THIN;
    }
  }

  const lastDataRow = r + scheduleRows - 1;

  // Totals row
  const totalsRow = lastDataRow + 1;
  ws.getCell(`A${totalsRow}`).value = "TOTALS";
  ws.getCell(`A${totalsRow}`).font = { ...FONT_BASE, bold: true };

  const sumCols = [
    { col: "D", label: "Interest" },
    { col: "E", label: "Escrow" },
    { col: "F", label: "Total Pmt" },
    { col: "G", label: "Principal" },
  ];
  for (const sc of sumCols) {
    const tCell = ws.getCell(`${sc.col}${totalsRow}`);
    tCell.value = { formula: `SUM(${sc.col}${firstDataRow}:${sc.col}${lastDataRow})` };
    tCell.font = { ...FONT_BASE, bold: true };
    tCell.numFmt = FMT.currency;
    tCell.border = BORDER_DOUBLE_TOP;
  }

  // Cumulative interest total
  ws.getCell(`I${totalsRow}`).value = { formula: `I${lastDataRow}` };
  ws.getCell(`I${totalsRow}`).font = { ...FONT_BASE, bold: true };
  ws.getCell(`I${totalsRow}`).numFmt = FMT.currency;
  ws.getCell(`I${totalsRow}`).border = BORDER_DOUBLE_TOP;

  // Freeze panes below header
  ws.views = [{ state: "frozen", ySplit: headerRow, xSplit: 0 }];

  // Store references for Payment Tracker
  summaryRows["amort_firstDataRow"] = firstDataRow;
  summaryRows["amort_lastDataRow"] = lastDataRow;
  summaryRows["amort_scheduleRows"] = scheduleRows;
}

// ── Tab 3: Payment Tracker ─────────────────────────────────────────────

function buildPaymentTracker(
  wb: ExcelJS.Workbook,
  loan: LoanData,
  payments: PaymentRecord[],
  summaryRows: Record<string, number>
) {
  const ws = wb.addWorksheet("Payment Tracker", {
    properties: { tabColor: { argb: "FF22A861" } },
  });
  setupLandscape(ws);

  const scheduleRows = summaryRows["amort_scheduleRows"] ?? 24;
  const amortFirstRow = summaryRows["amort_firstDataRow"] ?? 6;

  ws.columns = [
    { width: 6 },  // A: #
    { width: 14 }, // B: Due Date
    { width: 14 }, // C: Expected
    { width: 14 }, // D: Actual Pmt
    { width: 14 }, // E: Variance
    { width: 14 }, // F: Date Recd
    { width: 10 }, // G: Days Late
    { width: 10 }, // H: In Grace?
    { width: 12 }, // I: Late Fee
    { width: 12 }, // J: Status
    { width: 16 }, // K: Running Bal
  ];

  const sGraceDays = `'Loan Summary'!B${summaryRows["graceDays"]}`;
  const sLateFeeCalc = `'Loan Summary'!E${summaryRows["lateFeeCalc"]}`;

  let r = 1;

  // Title
  ws.mergeCells(`A${r}:K${r}`);
  ws.getCell(`A${r}`).value = "Payment Tracker";
  ws.getCell(`A${r}`).font = { ...FONT_BASE, size: 14, bold: true };
  ws.getRow(r).height = 28;
  r += 1;

  ws.mergeCells(`A${r}:K${r}`);
  ws.getCell(`A${r}`).value = {
    formula: `"Loan: "&'Loan Summary'!B${summaryRows["loanNumber"]}&"  |  Grace Period: "&'Loan Summary'!B${summaryRows["graceDays"]}&" days"`,
  };
  ws.getCell(`A${r}`).font = { ...FONT_BASE, size: 10, italic: true };
  r += 2;

  // Headers
  const headers = [
    "#", "Due Date", "Expected", "Actual Pmt", "Variance",
    "Date Recd", "Days Late", "In Grace?", "Late Fee", "Status", "Running Bal",
  ];
  const headerRow = r;
  headers.forEach((h, i) => {
    ws.getCell(cell(i + 1, r)).value = h;
  });
  applyHeaderRow(ws, r, headers.length);
  r++;

  const firstDataRow = r;

  // Build payment lookup map (by index)
  const pmtMap = new Map<number, PaymentRecord>();
  // Match payments to schedule rows by order
  const filteredPayments = payments.filter(
    (p) => p.entry_type === "payment" || p.entry_type == null
  );
  filteredPayments.forEach((p, i) => pmtMap.set(i, p));

  for (let m = 0; m < scheduleRows; m++) {
    const cr = r + m;
    const amortRow = amortFirstRow + m;
    const pmt = pmtMap.get(m);

    // A: #
    ws.getCell(`A${cr}`).value = m + 1;
    ws.getCell(`A${cr}`).font = FONT_BASE;
    ws.getCell(`A${cr}`).alignment = { horizontal: "center" };

    // B: Due Date = cross-ref to Amortization Schedule
    const dueDateCell = ws.getCell(`B${cr}`);
    dueDateCell.value = { formula: `'Amortization Schedule'!B${amortRow}` };
    dueDateCell.numFmt = FMT.date;
    applyCrossSheetCell(dueDateCell);

    // C: Expected = cross-ref to Amortization Schedule Total Pmt
    const expectedCell = ws.getCell(`C${cr}`);
    expectedCell.value = { formula: `'Amortization Schedule'!F${amortRow}` };
    expectedCell.numFmt = FMT.currency;
    applyCrossSheetCell(expectedCell);

    // D: Actual Pmt — input cell, pre-populated if we have data
    const actualCell = ws.getCell(`D${cr}`);
    actualCell.value = pmt?.amount_paid ?? "";
    if (pmt?.amount_paid != null) actualCell.numFmt = FMT.currency;
    applyInputCell(actualCell);

    // E: Variance = Actual - Expected (if Actual is filled)
    const varCell = ws.getCell(`E${cr}`);
    varCell.value = { formula: `IF(D${cr}="","",D${cr}-C${cr})` };
    varCell.numFmt = FMT.currency;
    applyFormulaCell(varCell);

    // F: Date Received — input cell, pre-populated
    const dateRecCell = ws.getCell(`F${cr}`);
    if (pmt?.date) {
      const serial = dateSerial(pmt.date);
      dateRecCell.value = serial ?? "";
    } else {
      dateRecCell.value = "";
    }
    dateRecCell.numFmt = FMT.date;
    applyInputCell(dateRecCell);

    // G: Days Late = MAX(0, DateRecd - DueDate)
    const daysLateCell = ws.getCell(`G${cr}`);
    daysLateCell.value = {
      formula: `IF(F${cr}="","",MAX(0,F${cr}-B${cr}))`,
    };
    daysLateCell.numFmt = FMT.integer;
    applyFormulaCell(daysLateCell);

    // H: In Grace? = IF(DaysLate <= GraceDays, "Yes", "No")
    const graceCell = ws.getCell(`H${cr}`);
    graceCell.value = {
      formula: `IF(G${cr}="","",IF(G${cr}<=${sGraceDays},"Yes","No"))`,
    };
    applyFormulaCell(graceCell);

    // I: Late Fee
    const lateFeeCell = ws.getCell(`I${cr}`);
    lateFeeCell.value = {
      formula: `IF(OR(G${cr}="",H${cr}="Yes"),0,${sLateFeeCalc})`,
    };
    lateFeeCell.numFmt = FMT.currency;
    applyFormulaCell(lateFeeCell);

    // J: Status
    const statusCell = ws.getCell(`J${cr}`);
    statusCell.value = {
      formula: `IF(D${cr}="","Pending",IF(D${cr}>=C${cr},IF(F${cr}="","Paid",IF(H${cr}="Yes","Paid-Grace","Paid-Late")),"Short Pay"))`,
    };
    applyFormulaCell(statusCell);

    // K: Running Balance — accumulates unpaid amounts + late fees
    const runBalCell = ws.getCell(`K${cr}`);
    if (m === 0) {
      runBalCell.value = {
        formula: `IF(D${cr}="",C${cr},MAX(0,C${cr}-D${cr}))+I${cr}`,
      };
    } else {
      runBalCell.value = {
        formula: `K${cr - 1}+IF(D${cr}="",C${cr},MAX(0,C${cr}-D${cr}))+I${cr}`,
      };
    }
    runBalCell.numFmt = FMT.currency;
    applyFormulaCell(runBalCell);

    // Alternating stripes
    if ((m + 1) % 2 === 0) {
      applyStripe(ws, cr, headers.length);
    }

    // Thin borders
    for (let c = 1; c <= headers.length; c++) {
      ws.getCell(cell(c, cr)).border = BORDER_THIN;
    }
  }

  const lastDataRow = r + scheduleRows - 1;

  // Summary section
  const sumStart = lastDataRow + 2;
  ws.mergeCells(`A${sumStart}:B${sumStart}`);
  ws.getCell(`A${sumStart}`).value = "SUMMARY";
  ws.getCell(`A${sumStart}`).font = FONT_SECTION;
  ws.getCell(`A${sumStart}`).border = BORDER_SECTION;
  ws.getCell(`B${sumStart}`).border = BORDER_SECTION;

  const summaryItems = [
    { label: "Total Expected", formula: `SUM(C${firstDataRow}:C${lastDataRow})`, fmt: FMT.currency },
    { label: "Total Received", formula: `SUM(D${firstDataRow}:D${lastDataRow})`, fmt: FMT.currency },
    { label: "Total Late Fees", formula: `SUM(I${firstDataRow}:I${lastDataRow})`, fmt: FMT.currency },
    { label: "Count On Time", formula: `COUNTIF(J${firstDataRow}:J${lastDataRow},"Paid")+COUNTIF(J${firstDataRow}:J${lastDataRow},"Paid-Grace")`, fmt: FMT.integer },
    { label: "Count Late", formula: `COUNTIF(J${firstDataRow}:J${lastDataRow},"Paid-Late")`, fmt: FMT.integer },
    { label: "Count Short Pay", formula: `COUNTIF(J${firstDataRow}:J${lastDataRow},"Short Pay")`, fmt: FMT.integer },
    { label: "Count Pending", formula: `COUNTIF(J${firstDataRow}:J${lastDataRow},"Pending")`, fmt: FMT.integer },
  ];

  let sr = sumStart + 1;
  for (const item of summaryItems) {
    ws.getCell(`A${sr}`).value = item.label;
    ws.getCell(`A${sr}`).font = { ...FONT_BASE, bold: true };
    const valCell = ws.getCell(`B${sr}`);
    valCell.value = { formula: item.formula };
    valCell.numFmt = item.fmt;
    valCell.font = FONT_FORMULA;
    valCell.border = BORDER_THIN;
    sr++;
  }

  // Freeze panes
  ws.views = [{ state: "frozen", ySplit: headerRow, xSplit: 0 }];
}

// ── Tab 4: Payoff Quote ────────────────────────────────────────────────

function buildPayoffQuote(
  wb: ExcelJS.Workbook,
  loan: LoanData,
  summaryRows: Record<string, number>
) {
  const ws = wb.addWorksheet("Payoff Quote", {
    properties: { tabColor: { argb: "FFE5930E" } },
  });
  setupLandscape(ws);

  ws.columns = [
    { width: 32 }, // A: Label
    { width: 24 }, // B: Value
  ];

  const sOPB = `'Loan Summary'!B${summaryRows["opb"]}`;
  const sNoteRate = `'Loan Summary'!B${summaryRows["noteRate"]}`;
  const sDefaultRate = `'Loan Summary'!B${summaryRows["defaultRate"]}`;

  let r = 1;

  // Title
  ws.mergeCells(`A${r}:B${r}`);
  ws.getCell(`A${r}`).value = "Payoff Quote Calculator";
  ws.getCell(`A${r}`).font = { ...FONT_BASE, size: 14, bold: true };
  ws.getRow(r).height = 28;
  r += 2;

  // ── PAYOFF INPUTS section ──
  ws.mergeCells(`A${r}:B${r}`);
  ws.getCell(`A${r}`).value = "PAYOFF INPUTS";
  ws.getCell(`A${r}`).font = FONT_SECTION;
  ws.getCell(`A${r}`).border = BORDER_SECTION;
  ws.getCell(`B${r}`).border = BORDER_SECTION;
  r++;

  const payoffRows: Record<string, number> = {};

  function writePayoffInput(label: string, value: any, fmt: string, key: string) {
    ws.getCell(`A${r}`).value = label;
    ws.getCell(`A${r}`).font = FONT_BASE;
    ws.getCell(`A${r}`).border = BORDER_THIN;
    const valCell = ws.getCell(`B${r}`);
    valCell.value = value;
    applyInputCell(valCell);
    valCell.numFmt = fmt;
    valCell.border = BORDER_THIN;
    payoffRows[key] = r;
    r++;
  }

  // Today as serial
  const todaySerial = dateSerial(new Date().toISOString().slice(0, 10));
  const isDefault = loan.servicing_status === "in_default" ||
    loan.servicing_status === "default";

  writePayoffInput("Payoff Date", todaySerial ?? "", FMT.date, "payoffDate");
  writePayoffInput("Last Payment Date", todaySerial ?? "", FMT.date, "lastPmtDate");
  writePayoffInput("Outstanding Late Fees", 0, FMT.currency, "outLateFees");
  writePayoffInput("Other Fees/Charges", 0, FMT.currency, "otherFees");
  writePayoffInput("Is Loan in Default?", isDefault ? "Yes" : "No", "@", "isDefault");

  r += 1;

  // ── PAYOFF CALCULATION section ──
  ws.mergeCells(`A${r}:B${r}`);
  ws.getCell(`A${r}`).value = "PAYOFF CALCULATION";
  ws.getCell(`A${r}`).font = FONT_SECTION;
  ws.getCell(`A${r}`).border = BORDER_SECTION;
  ws.getCell(`B${r}`).border = BORDER_SECTION;
  r++;

  const calcRows: Record<string, number> = {};

  function writePayoffCalc(label: string, formula: string, fmt: string, key: string) {
    ws.getCell(`A${r}`).value = label;
    ws.getCell(`A${r}`).font = FONT_BASE;
    ws.getCell(`A${r}`).border = BORDER_THIN;
    const valCell = ws.getCell(`B${r}`);
    valCell.value = { formula };
    applyFormulaCell(valCell);
    valCell.numFmt = fmt;
    valCell.border = BORDER_THIN;
    calcRows[key] = r;
    r++;
  }

  const pPayoffDate = `B${payoffRows["payoffDate"]}`;
  const pLastPmt = `B${payoffRows["lastPmtDate"]}`;
  const pOutLateFees = `B${payoffRows["outLateFees"]}`;
  const pOtherFees = `B${payoffRows["otherFees"]}`;
  const pIsDefault = `B${payoffRows["isDefault"]}`;

  writePayoffCalc(
    "Outstanding Principal",
    sOPB,
    FMT.currency,
    "principal"
  );
  writePayoffCalc(
    "Applicable Rate",
    `IF(${pIsDefault}="Yes",${sDefaultRate},${sNoteRate})`,
    FMT.pct,
    "applicableRate"
  );
  writePayoffCalc(
    "Days of Accrued Interest",
    `MAX(0,${pPayoffDate}-${pLastPmt})`,
    FMT.integer,
    "daysAccrued"
  );
  writePayoffCalc(
    "Per Diem at Applicable Rate",
    `B${calcRows["principal"]}*B${calcRows["applicableRate"]}/360`,
    FMT.currency,
    "perDiem"
  );
  writePayoffCalc(
    "Accrued Interest",
    `B${calcRows["perDiem"]}*B${calcRows["daysAccrued"]}`,
    FMT.currency,
    "accruedInterest"
  );
  writePayoffCalc(
    "Outstanding Late Fees",
    pOutLateFees,
    FMT.currency,
    "lateFees"
  );
  writePayoffCalc(
    "Other Fees",
    pOtherFees,
    FMT.currency,
    "otherFeesCalc"
  );

  // Total Payoff — bold accent row
  r += 1;
  ws.getCell(`A${r}`).value = "TOTAL PAYOFF AMOUNT";
  ws.getCell(`A${r}`).font = { ...FONT_BASE, size: 13, bold: true };
  ws.getCell(`A${r}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: COLORS.accentOrange },
  };
  ws.getCell(`A${r}`).font = { ...FONT_BASE, size: 13, bold: true, color: { argb: COLORS.headerFont } };
  ws.getCell(`A${r}`).border = {
    top: { style: "double", color: { argb: COLORS.sectionLabel } },
    bottom: { style: "double", color: { argb: COLORS.sectionLabel } },
  };

  const totalCell = ws.getCell(`B${r}`);
  totalCell.value = {
    formula: `B${calcRows["principal"]}+B${calcRows["accruedInterest"]}+B${calcRows["lateFees"]}+B${calcRows["otherFeesCalc"]}`,
  };
  totalCell.font = { ...FONT_BASE, size: 13, bold: true, color: { argb: COLORS.headerFont } };
  totalCell.numFmt = FMT.currency;
  totalCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: COLORS.accentOrange },
  };
  totalCell.border = {
    top: { style: "double", color: { argb: COLORS.sectionLabel } },
    bottom: { style: "double", color: { argb: COLORS.sectionLabel } },
  };
  ws.getRow(r).height = 26;
  r += 2;

  // Good-through info
  ws.getCell(`A${r}`).value = "Good Through Date";
  ws.getCell(`A${r}`).font = { ...FONT_BASE, italic: true };
  ws.getCell(`B${r}`).value = { formula: pPayoffDate };
  ws.getCell(`B${r}`).numFmt = FMT.date;
  applyFormulaCell(ws.getCell(`B${r}`));
  r++;

  ws.getCell(`A${r}`).value = "Per Diem After Good-Through";
  ws.getCell(`A${r}`).font = { ...FONT_BASE, italic: true };
  ws.getCell(`B${r}`).value = { formula: `B${calcRows["perDiem"]}` };
  ws.getCell(`B${r}`).numFmt = FMT.currency;
  applyFormulaCell(ws.getCell(`B${r}`));
}

// ── Tab 5: Stress Test ─────────────────────────────────────────────────

function buildStressTest(
  wb: ExcelJS.Workbook,
  loan: LoanData,
  summaryRows: Record<string, number>
) {
  const ws = wb.addWorksheet("Stress Test", {
    properties: { tabColor: { argb: "FFE5453D" } },
  });
  setupLandscape(ws);

  ws.columns = [
    { width: 26 }, // A: Metric
    { width: 18 }, // B: Base Case
    { width: 18 }, // C: Scenario 1
    { width: 18 }, // D: Scenario 2
    { width: 18 }, // E: Scenario 3
    { width: 18 }, // F: Scenario 4
  ];

  const sOPB = `'Loan Summary'!B${summaryRows["opb"]}`;
  const sRate = `'Loan Summary'!B${summaryRows["noteRate"]}`;
  const sTerm = `'Loan Summary'!B${summaryRows["termMonths"]}`;

  let r = 1;

  // Title
  ws.mergeCells(`A${r}:F${r}`);
  ws.getCell(`A${r}`).value = "Stress Test — Rate Sensitivity Analysis";
  ws.getCell(`A${r}`).font = { ...FONT_BASE, size: 14, bold: true };
  ws.getRow(r).height = 28;
  r += 2;

  // Header row
  const scenarioHeaders = [
    "Metric", "Base Case", "Scenario 1", "Scenario 2", "Scenario 3", "Scenario 4",
  ];
  scenarioHeaders.forEach((h, i) => {
    ws.getCell(cell(i + 1, r)).value = h;
  });
  applyHeaderRow(ws, r, scenarioHeaders.length);
  r++;

  // ── INPUT ROWS ──
  ws.mergeCells(`A${r}:F${r}`);
  ws.getCell(`A${r}`).value = "INPUTS";
  ws.getCell(`A${r}`).font = FONT_SECTION;
  ws.getCell(`A${r}`).border = BORDER_SECTION;
  r++;

  const stressRows: Record<string, number> = {};

  // Note Rate row
  stressRows["rate"] = r;
  ws.getCell(`A${r}`).value = "Note Rate";
  ws.getCell(`A${r}`).font = FONT_BASE;

  // Base case = reference to Loan Summary
  const baseRateCell = ws.getCell(`B${r}`);
  baseRateCell.value = { formula: sRate };
  baseRateCell.numFmt = FMT.pct;
  applyCrossSheetCell(baseRateCell);

  // Scenario inputs (editable, defaulting to +1%, +2%, +3%, -2%)
  const rateOffsets = [0.01, 0.02, 0.03, -0.02];
  const rateCols = ["C", "D", "E", "F"];
  for (let i = 0; i < 4; i++) {
    const sc = ws.getCell(`${rateCols[i]}${r}`);
    sc.value = { formula: `B${r}+${rateOffsets[i]}` };
    sc.numFmt = FMT.pct;
    applyInputCell(sc);
  }
  r++;

  // Principal Balance row
  stressRows["principal"] = r;
  ws.getCell(`A${r}`).value = "Principal Balance";
  ws.getCell(`A${r}`).font = FONT_BASE;

  for (let c = 2; c <= 6; c++) {
    const pCell = ws.getCell(cell(c, r));
    pCell.value = { formula: sOPB };
    pCell.numFmt = FMT.currency;
    applyCrossSheetCell(pCell);
  }
  r++;

  // Term row
  stressRows["term"] = r;
  ws.getCell(`A${r}`).value = "Term (Months)";
  ws.getCell(`A${r}`).font = FONT_BASE;

  for (let c = 2; c <= 6; c++) {
    const tCell = ws.getCell(cell(c, r));
    tCell.value = { formula: sTerm };
    tCell.numFmt = FMT.integer;
    applyCrossSheetCell(tCell);
  }
  r += 1;

  // ── CALCULATED METRICS ──
  ws.mergeCells(`A${r}:F${r}`);
  ws.getCell(`A${r}`).value = "CALCULATED METRICS";
  ws.getCell(`A${r}`).font = FONT_SECTION;
  ws.getCell(`A${r}`).border = BORDER_SECTION;
  r++;

  const rateRow = stressRows["rate"];
  const prinRow = stressRows["principal"];
  const termRow = stressRows["term"];

  // Monthly IO Payment
  stressRows["monthlyIO"] = r;
  ws.getCell(`A${r}`).value = "Monthly IO Payment";
  ws.getCell(`A${r}`).font = FONT_BASE;
  for (let c = 2; c <= 6; c++) {
    const cl = colLetter(c);
    const mCell = ws.getCell(cell(c, r));
    mCell.value = { formula: `${cl}${prinRow}*${cl}${rateRow}/12` };
    mCell.numFmt = FMT.currency;
    applyFormulaCell(mCell);
  }
  r++;

  // Annual Debt Service
  stressRows["annualDS"] = r;
  ws.getCell(`A${r}`).value = "Annual Debt Service";
  ws.getCell(`A${r}`).font = FONT_BASE;
  for (let c = 2; c <= 6; c++) {
    const cl = colLetter(c);
    const aCell = ws.getCell(cell(c, r));
    aCell.value = { formula: `${cl}${stressRows["monthlyIO"]}*12` };
    aCell.numFmt = FMT.currency;
    applyFormulaCell(aCell);
  }
  r++;

  // Total Interest Full Term
  stressRows["totalInt"] = r;
  ws.getCell(`A${r}`).value = "Total Interest Full Term";
  ws.getCell(`A${r}`).font = FONT_BASE;
  for (let c = 2; c <= 6; c++) {
    const cl = colLetter(c);
    const tCell = ws.getCell(cell(c, r));
    tCell.value = { formula: `${cl}${stressRows["monthlyIO"]}*${cl}${termRow}` };
    tCell.numFmt = FMT.currency;
    applyFormulaCell(tCell);
  }
  r++;

  // Daily Rate Act/360
  stressRows["dailyRate"] = r;
  ws.getCell(`A${r}`).value = "Daily Rate (Act/360)";
  ws.getCell(`A${r}`).font = FONT_BASE;
  for (let c = 2; c <= 6; c++) {
    const cl = colLetter(c);
    const dCell = ws.getCell(cell(c, r));
    dCell.value = { formula: `${cl}${rateRow}/360` };
    dCell.numFmt = FMT.pctDaily;
    applyFormulaCell(dCell);
  }
  r++;

  // Per Diem Interest
  stressRows["perDiem"] = r;
  ws.getCell(`A${r}`).value = "Per Diem Interest";
  ws.getCell(`A${r}`).font = FONT_BASE;
  for (let c = 2; c <= 6; c++) {
    const cl = colLetter(c);
    const pdCell = ws.getCell(cell(c, r));
    pdCell.value = { formula: `${cl}${prinRow}*${cl}${stressRows["dailyRate"]}` };
    pdCell.numFmt = FMT.currency;
    applyFormulaCell(pdCell);
  }
  r += 1;

  // ── VARIANCE FROM BASE CASE ──
  ws.mergeCells(`A${r}:F${r}`);
  ws.getCell(`A${r}`).value = "VARIANCE FROM BASE CASE";
  ws.getCell(`A${r}`).font = FONT_SECTION;
  ws.getCell(`A${r}`).border = BORDER_SECTION;
  r++;

  const varMetrics = [
    { label: "Monthly Payment Δ", refRow: stressRows["monthlyIO"] },
    { label: "Annual DS Δ", refRow: stressRows["annualDS"] },
    { label: "Total Interest Δ", refRow: stressRows["totalInt"] },
  ];

  for (const vm of varMetrics) {
    ws.getCell(`A${r}`).value = vm.label;
    ws.getCell(`A${r}`).font = FONT_BASE;

    // Base case = 0
    ws.getCell(`B${r}`).value = 0;
    ws.getCell(`B${r}`).numFmt = FMT.currency;
    ws.getCell(`B${r}`).font = FONT_BASE;

    // Scenarios = scenario - base
    for (let c = 3; c <= 6; c++) {
      const cl = colLetter(c);
      const vCell = ws.getCell(cell(c, r));
      vCell.value = { formula: `${cl}${vm.refRow}-B${vm.refRow}` };
      vCell.numFmt = FMT.currency;
      applyFormulaCell(vCell);
    }
    r++;
  }
}
