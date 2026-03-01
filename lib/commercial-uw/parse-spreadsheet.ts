import * as XLSX from "xlsx";

export interface ParsedSpreadsheet {
  headers: string[];
  rows: Record<string, string>[];
  headerRowIndex: number;
}

/**
 * Known header keywords used for header row detection.
 * If a row contains 2+ of these keywords (case-insensitive),
 * it's almost certainly the header row.
 */
const HEADER_KEYWORDS = [
  "unit", "tenant", "rent", "status", "lease", "move-in", "move-out",
  "sqft", "square feet", "beds", "type", "income", "vacancy", "charges",
  "resident", "occupancy", "space", "site", "sf", "area",
  // T12/financial keywords
  "tax", "insurance", "utilities", "repairs", "maintenance", "payroll",
  "management", "revenue", "expense", "amount", "total",
];

/**
 * Normalize a string for fuzzy comparison: lowercase, trim,
 * replace hyphens/underscores with spaces, collapse whitespace.
 */
function normalizeForMatch(s: string): string {
  return s.toLowerCase().trim().replace(/[-_]/g, " ").replace(/\s+/g, " ");
}

/**
 * Detect the header row index from raw spreadsheet data.
 * Scans the first 30 rows and uses heuristics:
 * 1. Row must have at least 3 non-empty cells
 * 2. Cell values should look like column labels (short strings, not sentences)
 * 3. Row should have significantly more populated cells than rows above
 * 4. Bonus: 2+ known header keywords → almost certainly the header
 */
function detectHeaderRow(raw: string[][]): number {
  const maxScan = Math.min(raw.length, 30);
  let maxPopulatedAbove = 0;

  for (let i = 0; i < maxScan; i++) {
    const row = raw[i];
    if (!row) continue;

    const cellValues = row.map((c) => String(c).trim()).filter(Boolean);
    const nonEmptyCells = cellValues.length;

    if (nonEmptyCells < 3) {
      maxPopulatedAbove = Math.max(maxPopulatedAbove, nonEmptyCells);
      continue;
    }

    // Check if values look like column labels (short, no newlines)
    const looksLikeLabels = cellValues.every(
      (val) => val.length <= 60 && !val.includes("\n")
    );
    if (!looksLikeLabels) {
      maxPopulatedAbove = Math.max(maxPopulatedAbove, nonEmptyCells);
      continue;
    }

    // Count keyword matches
    const keywordCount = cellValues.filter((val) => {
      const lower = val.toLowerCase();
      return HEADER_KEYWORDS.some((kw) => lower.includes(kw));
    }).length;

    // Strong signal: 2+ keyword matches → header row
    if (keywordCount >= 2) return i;

    // Moderate signal: significantly more populated cells than rows above
    if (nonEmptyCells > maxPopulatedAbove + 1) return i;

    maxPopulatedAbove = Math.max(maxPopulatedAbove, nonEmptyCells);
  }

  // Fallback: use row 0
  return 0;
}

/**
 * Parse a CSV/XLSX/XLS file into headers + row objects.
 * Dynamically detects the header row by scanning for metadata/title rows.
 */
export async function parseSpreadsheet(file: File): Promise<ParsedSpreadsheet> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("No sheets found in file");

  const sheet = workbook.Sheets[sheetName];
  // Get raw JSON — header: 1 returns array-of-arrays
  const raw: string[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    blankrows: false,
  });

  if (raw.length < 2) throw new Error("File must have at least a header row and one data row");

  // Detect the actual header row (may not be row 0 if file has metadata)
  const headerRowIdx = detectHeaderRow(raw);
  const rawHeaders = raw[headerRowIdx].map((h) => String(h).trim());

  // Track which original column indices have valid (non-empty) headers
  const validIndices: number[] = [];
  const seen = new Map<string, number>();
  const headers: string[] = [];

  for (let colIdx = 0; colIdx < rawHeaders.length; colIdx++) {
    const h = rawHeaders[colIdx];
    if (!h) continue; // Skip empty column headers
    validIndices.push(colIdx);
    const count = seen.get(h) ?? 0;
    seen.set(h, count + 1);
    headers.push(count > 0 ? `${h} (${count + 1})` : h);
  }

  const rows: Record<string, string>[] = [];

  for (let i = headerRowIdx + 1; i < raw.length; i++) {
    const row: Record<string, string> = {};
    let populatedCount = 0;
    headers.forEach((header, idx) => {
      const colIdx = validIndices[idx];
      const val = String(raw[i]?.[colIdx] ?? "").trim();
      row[header] = val;
      if (val) populatedCount++;
    });
    // Skip rows with too few populated cells (likely grouping/sub-header rows
    // like property name separators that only have 1-2 cells populated)
    const isGroupingRow = headers.length >= 5 && populatedCount <= 2;
    if (populatedCount > 0 && !isGroupingRow) rows.push(row);
  }

  return { headers, rows, headerRowIndex: headerRowIdx };
}

/**
 * Parse a numeric value from a string, stripping $, commas, % signs.
 */
export function parseNumber(value: string): number {
  if (!value) return 0;
  const cleaned = String(value).replace(/[$,%]/g, "").replace(/,/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Case-insensitive fuzzy match: checks if the header matches any alias.
 * Normalizes hyphens and underscores to spaces for comparison.
 */
export function fuzzyMatch(header: string, aliases: string[]): boolean {
  const h = normalizeForMatch(header);
  return aliases.some((alias) => {
    const a = normalizeForMatch(alias);
    return h === a || h.includes(a) || a.includes(h);
  });
}

/**
 * Auto-map spreadsheet headers to target fields based on known aliases.
 * Returns a mapping of targetField -> spreadsheet header name.
 */
export function autoMapColumns(
  headers: string[],
  fieldAliases: Record<string, string[]>
): Record<string, string> {
  const mapping: Record<string, string> = {};

  for (const [field, aliases] of Object.entries(fieldAliases)) {
    for (const header of headers) {
      if (fuzzyMatch(header, aliases)) {
        mapping[field] = header;
        break;
      }
    }
  }

  return mapping;
}

// Rent Roll field aliases for auto-mapping
export const RENT_ROLL_ALIASES: Record<string, string[]> = {
  unit_number: ["unit", "unit #", "unit number", "unit no", "apt", "suite", "space", "unit/suite", "site", "site #", "lot", "lot #"],
  tenant_name: ["tenant", "tenant name", "lessee", "occupant", "name", "resident", "resident name"],
  sf: ["sf", "sq ft", "sqft", "square feet", "area", "size", "rsf"],
  beds_type: ["beds", "bed", "type", "unit type", "bed/bath", "br", "br/ba"],
  current_monthly_rent: ["rent", "monthly rent", "current rent", "base rent", "contract rent", "monthly", "in-place rent", "rent amount", "lot rent income", "lot rent", "scheduled rent"],
  cam_nnn: ["cam", "nnn", "cam/nnn", "triple net", "reimbursements", "additional rent"],
  other_income: ["other", "other income", "misc", "miscellaneous", "poh income"],
  lease_start: ["lease start", "start date", "commencement", "move in", "move-in", "start", "lease begin"],
  lease_end: ["lease end", "end date", "expiration", "move out", "move-out", "expiry", "lease expiration"],
  is_vacant: ["vacant", "vacancy", "occupied", "status", "occupancy"],
  market_rent: ["market rent", "market", "mkt rent", "mkt"],
  lease_type: ["lease type", "lease", "gross/net"],
};

// T12 expense field aliases for auto-mapping
export const T12_ALIASES: Record<string, string[]> = {
  taxes: ["tax", "taxes", "real estate tax", "property tax", "re tax"],
  insurance: ["insurance", "ins", "property insurance"],
  utilities: ["utilities", "utility", "electric", "water", "gas"],
  repairs: ["repairs", "maintenance", "r&m", "repairs & maintenance", "repair"],
  contract_services: ["contract", "contract services", "contracted", "professional fees"],
  payroll: ["payroll", "salaries", "wages", "personnel"],
  marketing: ["marketing", "advertising", "leasing"],
  ga: ["g&a", "general", "administrative", "general & admin", "office"],
  replacement_reserve: ["reserve", "reserves", "replacement", "capex", "capital"],
  mgmt_fee: ["management", "management fee", "mgmt", "mgmt fee", "property management"],
  gpi: ["gpi", "gross potential", "gross income", "total income", "revenue", "gross potential income"],
  vacancy_pct: ["vacancy", "vacancy %", "physical vacancy"],
  bad_debt_pct: ["bad debt", "bad debt %", "collections loss"],
};
