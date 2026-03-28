// Supabase Edge Function: realie-property-lookup
// Receives a property_id, reads address from the properties table,
// calls the RealIE API, writes enriched data back to properties and
// unified_deals.property_data, and returns normalized results.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ---------------------------------------------------------------------------
// RealIE API types
// ---------------------------------------------------------------------------

interface RealieProperty {
  // Address & Parcel
  parcelId?: string;
  address?: string;
  addressFull?: string;
  fullAddress?: string;
  streetName?: string;
  streetNumber?: string;
  unitNumber?: string;
  county?: string;
  city?: string;
  zipCode?: string;
  state?: string;
  // Physical
  buildingArea?: number;
  basementType?: string;
  wallType?: string;
  fireplaceCount?: number;
  fireplace?: boolean | null;
  floorType?: string;
  foundationType?: string;
  garageCount?: number;
  garage?: boolean;
  garageType?: string;
  buildingCount?: number;
  stories?: number;
  totalBathrooms?: number;
  totalBedrooms?: number;
  pool?: boolean;
  poolCode?: string;
  roofType?: string;
  roofStyle?: string;
  constructionType?: string;
  yearBuilt?: number;
  residential?: boolean;
  // Ownership
  ownerName?: string;
  ownerAddressLine1?: string;
  ownerAddressFull?: string;
  ownerCity?: string;
  ownerState?: string;
  ownerZipCode?: string;
  ownerResCount?: number;
  ownerComCount?: number;
  ownerParcelCount?: number;
  // Land & Zoning
  legalDesc?: string;
  subdivision?: string;
  zoningCode?: string;
  secTwnRng?: string;
  blockNum?: string;
  lotNum?: string;
  jurisdiction?: string;
  acres?: number;
  depthSize?: number;
  frontage?: number;
  landArea?: number;
  // AVM & Tax
  totalAssessedValue?: number;
  assessedYear?: number;
  taxValue?: number;
  taxYear?: number;
  totalBuildingValue?: number;
  totalLandValue?: number;
  totalMarketValue?: number;
  marketValueYear?: number;
  useCode?: string;
  modelValue?: number;
  modelValueMin?: number;
  modelValueMax?: number;
  assessments?: Array<{
    assessedYear?: number;
    totalAssessedValue?: number;
    totalBuildingValue?: number;
    totalLandValue?: number;
    totalMarketValue?: number;
    taxValue?: number;
    taxYear?: number;
  }>;
  // Transfer
  recordingDate?: string;
  transferDate?: string;
  transferDateObject?: string;
  transferPrice?: number;
  buyerIDCode?: string;
  transferDocType?: string;
  transfers?: Array<{
    transferDate?: string;
    transferPrice?: number;
    grantee?: string;
    grantor?: string;
    recordingDate?: string;
  }>;
  // Mortgage & Lien
  totalLienCount?: number;
  totalLienBalance?: number;
  totalFinancingHistCount?: number;
  LTVCurrentEstCombined?: number;
  LTVCurrentEstRange?: number;
  equityCurrentEstBal?: number;
  equityCurrentEstRange?: number;
  LTVPurchase?: number;
  lenderName?: string;
  forecloseCode?: string;
  forecloseRecordDate?: string;
  forecloseFileDate?: string;
  forecloseCaseNum?: string;
  auctionDate?: string;
  // Location
  fipsState?: string;
  fipsCounty?: string;
  siteCensusTract?: string;
  neighborhood?: string;
  longitude?: number;
  latitude?: number;
  siteId?: string;
}

// ---------------------------------------------------------------------------
// State abbreviation lookup
// ---------------------------------------------------------------------------

const STATE_ABBREVIATIONS: Record<string, string> = {
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  florida: "FL",
  georgia: "GA",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY",
  "district of columbia": "DC",
  "american samoa": "AS",
  guam: "GU",
  "northern mariana islands": "MP",
  "puerto rico": "PR",
  "u.s. virgin islands": "VI",
  "virgin islands": "VI",
};

function stateToAbbreviation(stateName: string): string {
  return STATE_ABBREVIATIONS[stateName.toLowerCase()] ?? stateName;
}

// ---------------------------------------------------------------------------
// Street address normalization for RealIE exact matching
// RealIE stores full street names (e.g. "Mount Pleasant Road" not "Mt Pleasant Rd")
// Their API does exact matching — abbreviations cause 404s
// ---------------------------------------------------------------------------

const STREET_SUFFIX_MAP: Record<string, string> = {
  "Rd": "Road", "Rd.": "Road",
  "St": "Street", "St.": "Street",
  "Dr": "Drive", "Dr.": "Drive",
  "Ave": "Avenue", "Ave.": "Avenue",
  "Blvd": "Boulevard", "Blvd.": "Boulevard",
  "Ln": "Lane", "Ln.": "Lane",
  "Ct": "Court", "Ct.": "Court",
  "Pl": "Place", "Pl.": "Place",
  "Cir": "Circle", "Cir.": "Circle",
  "Pkwy": "Parkway", "Hwy": "Highway",
  "Trl": "Trail", "Trce": "Trace",
  "Xing": "Crossing", "Holw": "Hollow",
  "Cv": "Cove", "Pt": "Point",
  "Brg": "Bridge", "Aly": "Alley",
  "Ter": "Terrace",
};

const DIRECTIONAL_MAP: Record<string, string> = {
  "N": "North", "S": "South", "E": "East", "W": "West",
  "NE": "Northeast", "NW": "Northwest",
  "SE": "Southeast", "SW": "Southwest",
};

const NAME_PREFIX_MAP: Record<string, string> = {
  "Mt": "Mount", "Mt.": "Mount",
  "Ft": "Fort", "Ft.": "Fort",
};

function expandStreetAddress(street: string): string {
  const words = street.split(/\s+/);
  if (words.length < 2) return street;

  // Expand last word if it's a known street suffix (Rd → Road, St → Street, etc.)
  const lastWord = words[words.length - 1];
  const cleanLast = lastWord.replace(/\.$/, "");
  if (STREET_SUFFIX_MAP[lastWord]) {
    words[words.length - 1] = STREET_SUFFIX_MAP[lastWord];
  } else if (STREET_SUFFIX_MAP[cleanLast]) {
    words[words.length - 1] = STREET_SUFFIX_MAP[cleanLast];
  }

  // Expand first word if it's a directional (N → North, etc.)
  if (DIRECTIONAL_MAP[words[0]]) {
    words[0] = DIRECTIONAL_MAP[words[0]];
  }

  // Expand name prefixes: Mt → Mount, Ft → Fort
  // Do NOT expand "St" as "Saint" here — it conflicts with "Street" suffix handling
  for (let i = 0; i < words.length - 1; i++) {
    const clean = words[i].replace(/\.$/, "");
    if (NAME_PREFIX_MAP[clean]) {
      words[i] = NAME_PREFIX_MAP[clean];
    }
  }

  return words.join(" ");
}

// ---------------------------------------------------------------------------
// Address parsing
// ---------------------------------------------------------------------------

interface ParsedAddress {
  street: string;
  city: string | null;
  state: string;
  zip: string | null;
  county: string | null;
  unit: string | null;
}

function parseAddress(
  addressLine1: string,
  city: string | null,
  state: string | null,
  zip: string | null,
  county: string | null
): ParsedAddress {
  let street = addressLine1?.trim() || "";
  let parsedCity = city?.trim() || null;
  let parsedState = state?.trim() || null;
  let parsedZip = zip?.trim() || null;
  const parsedCounty = county?.trim() || null;
  let unit: string | null = null;

  // Step 1: If address_line1 contains commas, it likely has city/state/zip embedded
  const fullAddressPattern =
    /^(.+?),\s*(.+?),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)?$/i;
  const match = street.match(fullAddressPattern);
  if (match) {
    street = match[1].trim();
    if (!parsedCity) parsedCity = match[2].trim();
    if (!parsedState) parsedState = match[3].trim();
    if (!parsedZip && match[4]) parsedZip = match[4].trim();
  }

  // Step 2: Extract unit number from street if present
  const unitPattern = /\s+(APT|UNIT|STE|SUITE|#)\s*(\S+)$/i;
  const unitMatch = street.match(unitPattern);
  if (unitMatch) {
    unit = unitMatch[2];
    street = street.replace(unitPattern, "").trim();
  }

  // Step 3: Convert full state names to 2-letter abbreviations
  if (parsedState && parsedState.length > 2) {
    parsedState = stateToAbbreviation(parsedState);
  }

  // Step 4: Ensure state is uppercase
  if (parsedState) {
    parsedState = parsedState.toUpperCase();
  }

  return {
    street,
    city: parsedCity,
    state: parsedState!,
    zip: parsedZip,
    county: parsedCounty,
    unit,
  };
}

// ---------------------------------------------------------------------------
// Strip " County" suffix from a county name
// ---------------------------------------------------------------------------

function stripCountySuffix(county: string): string {
  return county.replace(/\s+County$/i, "").trim();
}

// ---------------------------------------------------------------------------
// Normalize RealIE response to field_configuration keys
// ---------------------------------------------------------------------------

function normalizeRealie(raw: RealieProperty): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  function set(key: string, val: unknown) {
    if (val !== undefined && val !== null && val !== "") {
      result[key] = val;
    }
  }

  // Fields that map to field_configurations keys (module=property)
  set("parcel_id", raw.parcelId);
  set("zoning", raw.zoningCode);
  set("year_built", raw.yearBuilt);
  set("lot_size_acres", raw.acres);
  set("building_count", raw.buildingCount);
  set("total_sf", raw.buildingArea);
  set("property_county", raw.county);

  // Land details
  set("legal_description", raw.legalDesc);
  set("subdivision", raw.subdivision);
  set("lot_number", raw.lotNum);
  set("block_number", raw.blockNum);
  set("frontage", raw.frontage);
  set("depth", raw.depthSize);
  set("land_area_sqft", raw.landArea);
  set("jurisdiction", raw.jurisdiction);

  // Structural details
  set("construction_type", raw.constructionType);
  set("roof_type", raw.roofType);
  set("roof_style", raw.roofStyle);
  set("foundation_type", raw.foundationType);
  set("wall_type", raw.wallType);
  set("floor_type", raw.floorType);
  set("garage_type", raw.garageType);
  set("garage_count", raw.garageCount);
  set("bedrooms", raw.totalBedrooms);
  set("bathrooms", raw.totalBathrooms);
  set("has_pool", raw.pool ?? false);
  set("has_fireplace", raw.fireplace ?? false);
  set("stories", raw.stories);

  // Classification
  set("use_code", raw.useCode);

  // Valuation
  set("assessed_value", raw.totalAssessedValue);
  set("assessed_year", raw.assessedYear);
  set("market_value", raw.totalMarketValue);
  set("building_value", raw.totalBuildingValue);
  set("land_value", raw.totalLandValue);
  set("avm_value", raw.modelValue);
  set("avm_low", raw.modelValueMin);
  set("avm_high", raw.modelValueMax);
  set("annual_taxes", raw.taxValue);
  set("tax_year", raw.taxYear);

  // Ownership
  set("owner_name", raw.ownerName);
  set("owner_address", raw.ownerAddressFull ?? raw.ownerAddressLine1);

  // Mortgage & Lien
  set("lien_count", raw.totalLienCount);
  set("lien_balance", raw.totalLienBalance);
  set("ltv_estimate", raw.LTVCurrentEstCombined);
  set("equity_estimate", raw.equityCurrentEstBal);
  set("current_lender", raw.lenderName);

  // Transfer / Sale history
  set("last_sale_price", raw.transferPrice);
  set("last_sale_date", raw.transferDate);
  if (raw.transfers && raw.transfers.length > 0) {
    set("sale_history", raw.transfers);
  }

  // Assessment history
  if (raw.assessments && raw.assessments.length > 0) {
    set("assessment_history", raw.assessments);
  }

  // Location
  set("latitude", raw.latitude);
  set("longitude", raw.longitude);
  set("neighborhood", raw.neighborhood);

  // Census / FIPS
  set("census_tract", raw.siteCensusTract);
  set("fips_state_code", raw.fipsState);
  set("fips_county_code", raw.fipsCounty);

  return result;
}

// ---------------------------------------------------------------------------
// FEMA Flood Zone lookup via the National Flood Hazard Layer ArcGIS REST API
// ---------------------------------------------------------------------------

const FEMA_NFHL_URL =
  "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query";

const SFHA_ZONES = new Set([
  "A", "AE", "AH", "AO", "AR", "A99", "V", "VE",
]);

interface FemaFloodResult {
  is_in_flood_zone: "none" | "minimal" | "high";
  flood_zone_type: string;
}

async function lookupFemaFloodZone(
  lat: number,
  lng: number
): Promise<FemaFloodResult | null> {
  const params = new URLSearchParams({
    geometry: `${lng},${lat}`,
    geometryType: "esriGeometryPoint",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "FLD_ZONE,ZONE_SUBTY,SFHA_TF",
    returnGeometry: "false",
    f: "json",
    inSR: "4326",
  });

  const res = await fetch(`${FEMA_NFHL_URL}?${params.toString()}`, {
    method: "GET",
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) return null;

  const json = await res.json();
  const features = json?.features as
    | Array<{ attributes: Record<string, string> }>
    | undefined;

  if (!features || features.length === 0) return null;

  const zones = features.map((f) => f.attributes.FLD_ZONE).filter(Boolean);
  const uniqueZones = Array.from(new Set(zones));

  if (uniqueZones.length === 0) return null;

  const hasSfha = uniqueZones.some((z) => SFHA_ZONES.has(z));

  let riskLevel: "none" | "minimal" | "high";
  if (hasSfha) riskLevel = "high";
  else if (uniqueZones.length > 0) riskLevel = "minimal";
  else riskLevel = "none";

  return {
    is_in_flood_zone: riskLevel,
    flood_zone_type: uniqueZones.join(", "),
  };
}

// ---------------------------------------------------------------------------
// Census ACS median household income lookup
// ---------------------------------------------------------------------------

const CENSUS_ACS_BASE = "https://api.census.gov/data";
const ACS_YEAR = "2023";
const MHI_VARIABLE = "B19013_001E";

interface CensusIncomeResult {
  median_tract_income: number;
}

function extractTractCode(
  siteCensusTract: string,
  stateFips: string,
  countyFips: string
): string {
  const cleaned = siteCensusTract.replace(/\./g, "");
  const prefix = stateFips.padStart(2, "0") + countyFips.padStart(3, "0");

  let tract = cleaned;
  if (cleaned.startsWith(prefix)) {
    tract = cleaned.slice(prefix.length);
  }

  return tract.slice(0, 6).padEnd(6, "0");
}

async function lookupCensusIncome(
  stateFips: string,
  countyFips: string,
  siteCensusTract: string
): Promise<CensusIncomeResult | null> {
  const stateCode = stateFips.padStart(2, "0");
  let countyCode = countyFips;
  if (countyCode.length > 3) {
    countyCode = countyCode.slice(-3);
  }
  countyCode = countyCode.padStart(3, "0");

  const tractCode = extractTractCode(siteCensusTract, stateCode, countyCode);

  const url =
    `${CENSUS_ACS_BASE}/${ACS_YEAR}/acs/acs5` +
    `?get=${MHI_VARIABLE},NAME` +
    `&for=tract:${tractCode}` +
    `&in=state:${stateCode}+county:${countyCode}`;

  const res = await fetch(url, {
    method: "GET",
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) return null;

  const json = await res.json();

  if (!Array.isArray(json) || json.length < 2) return null;

  const incomeStr = json[1]?.[0];
  if (!incomeStr || incomeStr === "-") return null;

  const income = parseInt(incomeStr, 10);
  if (isNaN(income) || income <= 0) return null;

  return { median_tract_income: income };
}

// ---------------------------------------------------------------------------
// Summary builder
// ---------------------------------------------------------------------------

function buildSummary(data: Record<string, unknown>): string {
  const parts: string[] = [];

  if (data.total_sf) {
    parts.push(`${Number(data.total_sf).toLocaleString()} sqft`);
  }
  if (data.year_built) parts.push(`Built ${data.year_built}`);
  if (data.lot_size_acres) parts.push(`${data.lot_size_acres} acres`);
  if (data.zoning) parts.push(`Zoned ${data.zoning}`);
  if (data.avm_value) {
    parts.push(`AVM $${Number(data.avm_value).toLocaleString()}`);
  } else if (data.market_value) {
    parts.push(`Market $${Number(data.market_value).toLocaleString()}`);
  }
  if (data.owner_name) parts.push(`Owner: ${data.owner_name}`);
  if (data.flood_zone_type) parts.push(`Flood: ${data.flood_zone_type}`);
  if (data.median_tract_income) {
    parts.push(
      `Tract HHI $${Number(data.median_tract_income).toLocaleString()}`
    );
  }

  return parts.length > 0 ? parts.join(" | ") : "Property data retrieved";
}

// ---------------------------------------------------------------------------
// RealIE field mapping to properties table columns
// ---------------------------------------------------------------------------

function buildPropertiesUpdate(
  raw: RealieProperty,
  parsed: ParsedAddress
): Record<string, unknown> {
  const update: Record<string, unknown> = {};

  function setIfPresent(column: string, val: unknown) {
    if (val !== undefined && val !== null && val !== "") {
      update[column] = val;
    }
  }

  // Address fields (correct/update from RealIE or parsed)
  setIfPresent("address_line1", raw.address ?? parsed.street);
  setIfPresent("city", raw.city ?? parsed.city);
  setIfPresent("state", raw.state ?? parsed.state);
  setIfPresent("zip", raw.zipCode ?? parsed.zip);
  setIfPresent("county", raw.county ?? parsed.county);
  setIfPresent("parcel_id", raw.parcelId);

  // Physical characteristics
  setIfPresent("year_built", raw.yearBuilt);
  setIfPresent("lot_size_acres", raw.acres);
  setIfPresent("gross_building_area_sqft", raw.buildingArea);
  setIfPresent(
    "number_of_stories",
    raw.stories != null ? Math.round(raw.stories) : null
  );
  setIfPresent("number_of_buildings", raw.buildingCount);
  setIfPresent("zoning", raw.zoningCode);

  return update;
}

// ---------------------------------------------------------------------------
// Extended JSONB data for unified_deals.property_data
// ---------------------------------------------------------------------------

function buildExtendedPropertyData(
  raw: RealieProperty,
  normalized: Record<string, unknown>
): Record<string, unknown> {
  const data: Record<string, unknown> = {
    realie_last_synced: new Date().toISOString(),
  };

  function set(key: string, val: unknown) {
    if (val !== undefined && val !== null && val !== "") {
      data[key] = val;
    }
  }

  // All normalized fields go into property_data
  for (const [key, val] of Object.entries(normalized)) {
    set(key, val);
  }

  // Additional fields not in normalized output
  set("bedrooms", raw.totalBedrooms);
  set("bathrooms", raw.totalBathrooms);
  set("has_pool", raw.pool);
  set("has_garage", raw.garage);
  set("garage_count", raw.garageCount);
  set("fireplace_count", raw.fireplaceCount);
  set("construction_type", raw.constructionType);
  set("roof_type", raw.roofType);
  set("basement_type", raw.basementType);
  set("owner_name", raw.ownerName);

  // AVM data
  set("model_value", raw.modelValue);
  set("model_value_min", raw.modelValueMin);
  set("model_value_max", raw.modelValueMax);
  set("total_assessed_value", raw.totalAssessedValue);
  set("assessed_year", raw.assessedYear);
  set("tax_value", raw.taxValue);
  set("tax_year", raw.taxYear);
  set("total_market_value", raw.totalMarketValue);

  // Transfer data
  set("last_transfer_date", raw.transferDate);
  set("last_transfer_price", raw.transferPrice);

  // Mortgage data
  set("total_lien_count", raw.totalLienCount);
  set("total_lien_balance", raw.totalLienBalance);
  set("ltv_current", raw.LTVCurrentEstCombined);
  set("equity_estimate", raw.equityCurrentEstBal);
  set("lender_name", raw.lenderName);

  // Location
  set("latitude", raw.latitude);
  set("longitude", raw.longitude);
  set("neighborhood", raw.neighborhood);
  set("legal_description", raw.legalDesc);
  set("subdivision", raw.subdivision);

  return data;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

const REALIE_BASE_URL =
  "https://app.realie.ai/api/public/property/address/";

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const REALIE_API_KEY = Deno.env.get("REALIE_API_KEY") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!REALIE_API_KEY) {
      return new Response(
        JSON.stringify({
          error:
            "Property data service not configured (missing REALIE_API_KEY)",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Admin client for DB reads/writes
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Parse request body
    let body: {
      property_id?: string;
      address_override?: {
        address_line1?: string;
        city?: string;
        state?: string;
        zip?: string;
        county?: string;
      };
    };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.property_id) {
      return new Response(
        JSON.stringify({ error: "property_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch property record
    const { data: property, error: fetchError } = await admin
      .from("properties")
      .select(
        "id, address_line1, address_line2, city, state, zip, county, parcel_id"
      )
      .eq("id", body.property_id)
      .single();

    if (fetchError || !property) {
      return new Response(
        JSON.stringify({
          error: `Property not found: ${fetchError?.message ?? "no record"}`,
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use address_override if provided, otherwise use property record
    const addrSource = body.address_override ?? property;
    const rawAddress =
      (addrSource as Record<string, string | null>).address_line1 ?? "";
    const rawCity =
      (addrSource as Record<string, string | null>).city ?? null;
    const rawState =
      (addrSource as Record<string, string | null>).state ?? null;
    const rawZip =
      (addrSource as Record<string, string | null>).zip ?? null;
    const rawCounty =
      (addrSource as Record<string, string | null>).county ?? null;

    // Parse address
    const parsed = parseAddress(rawAddress, rawCity, rawState, rawZip, rawCounty);

    // Expand abbreviations for RealIE exact matching
    const expandedStreet = expandStreetAddress(parsed.street);

    if (!parsed.street || !parsed.state) {
      return new Response(
        JSON.stringify({
          error:
            "Missing required fields: need at least address_line1 and state to look up property",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // -----------------------------------------------------------------------
    // Try address lookup with multiple strategies, fall back to parcel ID
    // -----------------------------------------------------------------------

    const REALIE_PARCEL_URL =
      "https://app.realie.ai/api/public/property/parcelId/";

    async function callRealie(url: string, apiKey: string): Promise<Response> {
      let resp = await fetch(url, {
        method: "GET",
        headers: { Authorization: apiKey },
        signal: AbortSignal.timeout(12000),
      });

      // Retry with Bearer prefix if 400/401
      if (
        (resp.status === 400 || resp.status === 401) &&
        !apiKey.startsWith("Bearer ")
      ) {
        resp = await fetch(url, {
          method: "GET",
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(12000),
        });
      }

      return resp;
    }

    // Strategy 1: Expanded address with city + county (if both available)
    const params1 = new URLSearchParams({
      address: expandedStreet,
      state: parsed.state,
    });
    if (parsed.city && parsed.county) {
      params1.set("city", parsed.city);
      params1.set("county", stripCountySuffix(parsed.county));
    }
    if (parsed.unit) {
      params1.set("unitNumberStripped", parsed.unit);
    }

    let realieUrl = `${REALIE_BASE_URL}?${params1.toString()}`;
    console.log(
      `[realie-property-lookup] Strategy 1 (expanded+full): ${realieUrl}`
    );
    let response = await callRealie(realieUrl, REALIE_API_KEY);

    // Strategy 2: Original (non-expanded) address — in case RealIE has the abbreviated form
    if (response.status === 404 && expandedStreet !== parsed.street) {
      const params2 = new URLSearchParams({
        address: parsed.street,
        state: parsed.state,
      });
      if (parsed.city && parsed.county) {
        params2.set("city", parsed.city);
        params2.set("county", stripCountySuffix(parsed.county));
      }
      if (parsed.unit) {
        params2.set("unitNumberStripped", parsed.unit);
      }

      realieUrl = `${REALIE_BASE_URL}?${params2.toString()}`;
      console.log(
        `[realie-property-lookup] Strategy 2 (original+full): ${realieUrl}`
      );
      response = await callRealie(realieUrl, REALIE_API_KEY);
    }

    // Strategy 3: Expanded address WITHOUT city/county — sometimes fewer params = better match
    if (response.status === 404) {
      const params3 = new URLSearchParams({
        address: expandedStreet,
        state: parsed.state,
      });
      if (parsed.unit) {
        params3.set("unitNumberStripped", parsed.unit);
      }

      realieUrl = `${REALIE_BASE_URL}?${params3.toString()}`;
      console.log(
        `[realie-property-lookup] Strategy 3 (expanded+minimal): ${realieUrl}`
      );
      response = await callRealie(realieUrl, REALIE_API_KEY);
    }

    // Strategy 4: Parcel ID lookup (if parcel_id available in the property record)
    if (
      response.status === 404 &&
      property.parcel_id &&
      parsed.county &&
      parsed.state
    ) {
      const parcelParams = new URLSearchParams({
        state: parsed.state,
        county: stripCountySuffix(parsed.county),
        parcelId: property.parcel_id,
      });

      const parcelUrl = `${REALIE_PARCEL_URL}?${parcelParams.toString()}`;
      console.log(
        `[realie-property-lookup] Strategy 4 (parcel ID): ${parcelUrl}`
      );
      response = await callRealie(parcelUrl, REALIE_API_KEY);
    }

    // Handle 429 rate limit with retry
    if (response.status === 429) {
      console.log("[realie-property-lookup] Rate limited, retrying after 2s");
      await new Promise((r) => setTimeout(r, 2000));
      response = await callRealie(realieUrl, REALIE_API_KEY);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: "RealIE rate limit exceeded. Try again in a minute.",
            realie_status: 429,
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Log final result
    console.log(
      `[realie-property-lookup] Final response status: ${response.status}`
    );

    // Handle error responses
    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error(
        "[RealIE] Error:",
        response.status,
        errText?.slice(0, 500)
      );

      const errorMessages: Record<number, string> = {
        400: "RealIE could not parse this address. Check the street address format.",
        401: "RealIE API authentication failed. Check API key.",
        403: "RealIE API authentication failed. Check API key.",
        404: `Property not found in RealIE. Tried "${expandedStreet}, ${parsed.city ?? ""}, ${parsed.state}". The address may need to match county tax records exactly. You can enter property details manually.`,
      };

      const errorMsg =
        errorMessages[response.status] ??
        "RealIE service error. Try again later.";

      return new Response(
        JSON.stringify({
          error: errorMsg,
          realie_status: response.status,
          detail: errText?.slice(0, 500) || undefined,
        }),
        {
          status: response.status >= 500 ? 502 : response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse response
    const rawText = await response.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error("[RealIE] Non-JSON response:", rawText.slice(0, 500));
      return new Response(
        JSON.stringify({
          error: "RealIE returned an invalid response",
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const realieProperty: RealieProperty = (data.property ??
      (data.data as unknown[])?.[0] ??
      data) as RealieProperty;

    if (
      !realieProperty ||
      (!realieProperty.parcelId &&
        !realieProperty.yearBuilt &&
        !realieProperty.buildingArea)
    ) {
      return new Response(
        JSON.stringify({
          error: "No property data found for this address",
          realie_status: 404,
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize for frontend consumption
    const normalized = normalizeRealie(realieProperty);

    // FEMA flood zone lookup
    const lat = realieProperty.latitude;
    const lng = realieProperty.longitude;
    if (lat && lng) {
      try {
        const flood = await lookupFemaFloodZone(lat, lng);
        if (flood) {
          normalized.is_in_flood_zone = flood.is_in_flood_zone;
          normalized.flood_zone_type = flood.flood_zone_type;
        }
      } catch (err) {
        console.warn("FEMA flood zone lookup failed (non-blocking):", err);
      }
    }

    // Census income lookup
    const censusTract = realieProperty.siteCensusTract;
    const stateFips = realieProperty.fipsState;
    const countyFips = realieProperty.fipsCounty;
    if (censusTract && stateFips && countyFips) {
      try {
        const census = await lookupCensusIncome(
          stateFips,
          countyFips,
          censusTract
        );
        if (census) {
          normalized.median_tract_income = census.median_tract_income;
        }
      } catch (err) {
        console.warn("Census income lookup failed (non-blocking):", err);
      }
    }

    // ── DB Writes ──

    // 1. Update properties table (COALESCE: only set non-null values)
    const propertiesUpdate = buildPropertiesUpdate(realieProperty, parsed);
    if (Object.keys(propertiesUpdate).length > 0) {
      const { error: updateErr } = await admin
        .from("properties")
        .update(propertiesUpdate)
        .eq("id", body.property_id);

      if (updateErr) {
        console.error("[RealIE] Properties update error:", updateErr);
      }
    }

    // 2. Update unified_deals.property_data for all deals linked to this property
    const extendedData = buildExtendedPropertyData(
      realieProperty,
      normalized
    );

    // Store raw response for debugging
    extendedData.realie_raw = realieProperty;

    // Find all deals linked to this property
    const { data: linkedDeals } = await admin
      .from("unified_deals")
      .select("id, property_data")
      .eq("property_id", body.property_id);

    if (linkedDeals && linkedDeals.length > 0) {
      for (const deal of linkedDeals) {
        const existingData =
          (deal.property_data as Record<string, unknown>) ?? {};
        const mergedData = { ...existingData, ...extendedData };

        const { error: dealUpdateErr } = await admin
          .from("unified_deals")
          .update({ property_data: mergedData })
          .eq("id", deal.id);

        if (dealUpdateErr) {
          console.error(
            `[RealIE] Deal ${deal.id} property_data update error:`,
            dealUpdateErr
          );
        }
      }
    }

    const summary = buildSummary(normalized);

    return new Response(
      JSON.stringify({
        success: true,
        enriched: normalized,
        summary,
        field_count: Object.keys(normalized).length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[RealIE] Unexpected error:", err);
    return new Response(
      JSON.stringify({
        error: "Failed to look up property data",
        detail: err instanceof Error ? err.message : undefined,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
