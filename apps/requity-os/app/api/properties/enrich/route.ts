import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";

const REALIE_API_KEY = process.env.REALIE_API_KEY ?? "";
const REALIE_BASE_URL = "https://app.realie.ai/api/public/property/address/";

// Matches actual Realie API response field names
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

function normalizeRealie(raw: RealieProperty): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  function set(key: string, val: unknown) {
    if (val !== undefined && val !== null && val !== "") {
      result[key] = val;
    }
  }

  // Fields that map to `properties` table columns
  set("parcel_id", raw.parcelId);
  set("zoning", raw.zoningCode);
  set("year_built", raw.yearBuilt);
  set("gross_building_area_sqft", raw.buildingArea);
  set("lot_size_acres", raw.acres);
  set("number_of_stories", raw.stories);
  set("number_of_buildings", raw.buildingCount);
  set("county", raw.county);

  // Fields that map to field_configurations keys
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
  /** "none" = no flood zone, "minimal" = Zone X/B/C/D, "high" = SFHA */
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
// Census ACS median household income lookup via Census Bureau API
// Uses B19013_001E (Median Household Income) from the ACS 5-Year Estimates.
// ---------------------------------------------------------------------------

const CENSUS_ACS_BASE = "https://api.census.gov/data";
const ACS_YEAR = "2023";
const MHI_VARIABLE = "B19013_001E";

interface CensusIncomeResult {
  median_tract_income: number;
}

/**
 * Realie returns siteCensusTract as a full GEOID (e.g. "371330025.002005")
 * which is state(2) + county(3) + tract(4-6) + block(4), with a decimal
 * embedded. We need to extract just the 6-digit tract code.
 */
function extractTractCode(
  siteCensusTract: string,
  stateFips: string,
  countyFips: string
): string {
  const cleaned = siteCensusTract.replace(/\./g, "");
  const prefix =
    stateFips.padStart(2, "0") + countyFips.padStart(3, "0");

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

  // Response: [["B19013_001E","NAME","state","county","tract"], ["55000","Census Tract 25, ...",...]]
  if (!Array.isArray(json) || json.length < 2) return null;

  const incomeStr = json[1]?.[0];
  if (!incomeStr || incomeStr === "-") return null;

  const income = parseInt(incomeStr, 10);
  if (isNaN(income) || income <= 0) return null;

  return { median_tract_income: income };
}

function buildSummary(data: Record<string, unknown>): string {
  const parts: string[] = [];

  if (data.gross_building_area_sqft) {
    parts.push(`${Number(data.gross_building_area_sqft).toLocaleString()} sqft`);
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
    parts.push(`Tract HHI $${Number(data.median_tract_income).toLocaleString()}`);
  }

  return parts.length > 0 ? parts.join(" | ") : "Property data retrieved";
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  if (!REALIE_API_KEY) {
    return NextResponse.json(
      { error: "Property data service not configured (missing REALIE_API_KEY)" },
      { status: 500 }
    );
  }

  let body: { address: string; state: string; city?: string; county?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.address || !body.state) {
    return NextResponse.json(
      { error: "Address and state are required" },
      { status: 400 }
    );
  }

  try {
    const params = new URLSearchParams({
      address: body.address.trim(),
      state: body.state.trim().toUpperCase(),
    });
    if (body.city && body.county) {
      params.set("city", body.city.trim());
      params.set("county", body.county.trim());
    }

    const realieUrl = `${REALIE_BASE_URL}?${params.toString()}`;

    const response = await fetch(realieUrl, {
      method: "GET",
      headers: {
        Authorization: REALIE_API_KEY,
      },
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("Realie API error:", response.status, errText);

      if (response.status === 404) {
        return NextResponse.json(
          { error: "Property not found at this address" },
          { status: 404 }
        );
      }
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { error: "Property data service authentication failed" },
          { status: 502 }
        );
      }
      return NextResponse.json(
        { error: "Property data service error" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const property: RealieProperty = data.property ?? data.data?.[0] ?? data;

    if (!property || (!property.parcelId && !property.yearBuilt && !property.buildingArea)) {
      return NextResponse.json(
        { error: "No property data found for this address" },
        { status: 404 }
      );
    }

    const normalized = normalizeRealie(property);

    // Attempt FEMA flood zone lookup if we have coordinates
    const lat = normalized.latitude as number | undefined;
    const lng = normalized.longitude as number | undefined;
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

    // Census ACS median family income lookup using FIPS codes from Realie
    const censusTract = property.siteCensusTract;
    const stateFips = property.fipsState;
    const countyFips = property.fipsCounty;
    if (censusTract && stateFips && countyFips) {
      try {
        const census = await lookupCensusIncome(stateFips, countyFips, censusTract);
        if (census) {
          normalized.median_tract_income = census.median_tract_income;
        }
      } catch (err) {
        console.warn("Census income lookup failed (non-blocking):", err);
      }
    }

    const summary = buildSummary(normalized);

    return NextResponse.json({
      enriched: normalized,
      summary,
      field_count: Object.keys(normalized).length,
    });
  } catch (err) {
    console.error("Property enrich error:", err);
    return NextResponse.json(
      { error: "Failed to enrich property data" },
      { status: 500 }
    );
  }
}
