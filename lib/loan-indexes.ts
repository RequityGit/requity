/**
 * Fetches current loan market indexes from public government APIs.
 *
 * Sources:
 *  - 5-Year & 10-Year Treasury: US Treasury Dept XML feed (no key needed)
 *  - 30-Day SOFR Average: NY Fed API (no key needed)
 *  - Prime Rate: FRED API (requires FRED_API_KEY env var)
 *
 * Optional: Set FRED_API_KEY in .env.local for Prime Rate data.
 * Free key at https://fred.stlouisfed.org/docs/api/api_key.html
 */

const CACHE_SECONDS = 3600; // 1 hour

// In-memory cache so we can return stale data when APIs fail
let lastGoodResult = null;

async function fetchTreasuryYields() {
  try {
    const url =
      'https://data.treasury.gov/feed.svc/DailyTreasuryYieldCurveRateData?' +
      '$orderby=NEW_DATE%20desc&$top=5&$format=json';

    const res = await fetch(url, { next: { revalidate: CACHE_SECONDS } });
    if (!res.ok) return {};

    const data = await res.json();
    const results = data?.d?.results;
    if (!results || results.length === 0) return {};

    // Find the first entry with valid data
    for (const entry of results) {
      const fiveYr = entry.BC_5YEAR != null ? parseFloat(entry.BC_5YEAR) : null;
      const tenYr = entry.BC_10YEAR != null ? parseFloat(entry.BC_10YEAR) : null;

      if (fiveYr && tenYr && !isNaN(fiveYr) && !isNaN(tenYr)) {
        // Parse the OData date format: /Date(1234567890000)/
        let date = null;
        const dateMatch = entry.NEW_DATE?.match(/\/Date\((\d+)\)\//);
        if (dateMatch) {
          date = new Date(parseInt(dateMatch[1])).toISOString().split('T')[0];
        }

        return {
          treasury5yr: { value: fiveYr, date },
          treasury10yr: { value: tenYr, date },
        };
      }
    }

    return {};
  } catch {
    return {};
  }
}

async function fetchSOFR() {
  try {
    const url = 'https://markets.newyorkfed.org/api/rates/secured/sofr/last/1.json';
    const res = await fetch(url, { next: { revalidate: CACHE_SECONDS } });
    if (!res.ok) return null;

    const data = await res.json();
    const rate = data?.refRates?.[0];
    if (!rate || rate.percentRate == null) return null;

    return {
      value: parseFloat(rate.percentRate),
      date: rate.effectiveDate || null,
    };
  } catch {
    return null;
  }
}

async function fetchFromFRED(seriesId) {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) return null;

  try {
    const url =
      `https://api.stlouisfed.org/fred/series/observations?` +
      `series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=5`;

    const res = await fetch(url, { next: { revalidate: CACHE_SECONDS } });
    if (!res.ok) return null;

    const data = await res.json();
    const obs = data?.observations?.find((o) => o.value !== '.');
    if (!obs) return null;

    return {
      value: parseFloat(obs.value),
      date: obs.date || null,
    };
  } catch {
    return null;
  }
}

export async function getLoanIndexes() {
  const hasFredKey = !!process.env.FRED_API_KEY;
  let result;

  if (hasFredKey) {
    // Use FRED for all 4 rates (most reliable)
    const [treasury5yr, treasury10yr, sofr30day, prime] = await Promise.all([
      fetchFromFRED('DGS5'),
      fetchFromFRED('DGS10'),
      fetchFromFRED('SOFR30DAYAVG'),
      fetchFromFRED('DPRIME'),
    ]);

    result = { treasury5yr, treasury10yr, sofr30day, prime };
  } else {
    // Fallback: public APIs (no key needed for treasury + SOFR)
    const [treasury, sofr] = await Promise.all([
      fetchTreasuryYields(),
      fetchSOFR(),
    ]);

    result = {
      treasury5yr: treasury.treasury5yr || null,
      treasury10yr: treasury.treasury10yr || null,
      sofr30day: sofr,
      prime: null, // Requires FRED_API_KEY
    };
  }

  // If we got valid data, cache it; otherwise return last known good data
  const hasAny = Object.values(result).some((v) => v?.value != null);
  if (hasAny) {
    lastGoodResult = result;
    return result;
  }

  return lastGoodResult || result;
}
