import * as XLSX from "xlsx";

export interface ParsedSpreadsheet {
  headers: string[];
  rows: Record<string, string>[];
}

/**
 * Parse a CSV/XLSX/XLS file into headers + row objects.
 * Reads the first sheet, extracts headers from row 1.
 */
export async function parseSpreadsheet(file: File): Promise<ParsedSpreadsheet> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("No sheets found in file");

  const sheet = workbook.Sheets[sheetName];
  // Get raw JSON with header row
  const raw: string[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    blankrows: false,
  });

  if (raw.length < 2) throw new Error("File must have at least a header row and one data row");

  const rawHeaders = raw[0].map((h) => String(h).trim());

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

  for (let i = 1; i < raw.length; i++) {
    const row: Record<string, string> = {};
    let hasData = false;
    headers.forEach((header, idx) => {
      const colIdx = validIndices[idx];
      const val = String(raw[i][colIdx] ?? "").trim();
      row[header] = val;
      if (val) hasData = true;
    });
    if (hasData) rows.push(row);
  }

  return { headers, rows };
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
 */
export function fuzzyMatch(header: string, aliases: string[]): boolean {
  const h = header.toLowerCase().trim();
  return aliases.some((alias) => {
    const a = alias.toLowerCase().trim();
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
  unit_number: ["unit", "unit #", "unit number", "unit no", "apt", "suite", "space", "unit/suite"],
  tenant_name: ["tenant", "tenant name", "lessee", "occupant", "name", "resident"],
  sf: ["sf", "sq ft", "sqft", "square feet", "area", "size", "rsf"],
  beds_type: ["beds", "bed", "type", "unit type", "bed/bath", "br", "br/ba"],
  current_monthly_rent: ["rent", "monthly rent", "current rent", "base rent", "contract rent", "monthly", "in-place rent"],
  cam_nnn: ["cam", "nnn", "cam/nnn", "triple net", "reimbursements", "additional rent"],
  other_income: ["other", "other income", "misc", "miscellaneous"],
  lease_start: ["lease start", "start date", "commencement", "move in", "start"],
  lease_end: ["lease end", "end date", "expiration", "move out", "expiry"],
  is_vacant: ["vacant", "vacancy", "occupied", "status"],
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
