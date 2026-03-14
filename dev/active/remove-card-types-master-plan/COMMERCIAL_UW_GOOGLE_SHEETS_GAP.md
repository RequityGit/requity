# Commercial UW ↔ Google Sheets: Gap Assessment

**Date:** 2026-03-14  
**Goal:** Sync commercial underwriting so it can open (and optionally embed) in a Google Sheet.

---

## What Exists Today

| Piece | Status |
|-------|--------|
| **Commercial UW data** | In DB: `deal_commercial_uw`, `deal_commercial_income`, `deal_commercial_expenses`, `deal_commercial_rent_roll`, `deal_commercial_scope_of_work`, `deal_commercial_sources_uses`, `deal_commercial_debt`, `deal_commercial_waterfall`. |
| **Excel export** | `components/commercial-uw/excel-export.ts` – export to .xlsx download (not Google Sheets). |
| **Deal ↔ Google Drive** | `unified_deals` has `google_drive_folder_id`, `google_drive_folder_url`, `google_drive_shared_folder_id`. Edge Function `create-deal-drive-folder` creates deal folders. |
| **"Open in Sheets" in UI** | `UnifiedKPIHeader` in `uw-shared.tsx` accepts optional `sheetUrl` and renders the link; **no caller passes `sheetUrl` yet**, so the link never appears. |
| **UnderwritingTab** | Uses its own toolbar (sync indicator, fullscreen); does not use `UnifiedKPIHeader` or any sheet URL. |
| **Design reference** | `requity-sheets-uw-mockup.jsx` – embed Sheet (chrome-free), tab pills, sync indicator, "Open in Sheets", fullscreen. Assumes `deal.google_sheet_id` and `deal.google_sheet_url`. |
| **Sync pattern elsewhere** | `POST /api/sync-pricing` – Make.com sends Sheet rows, we return JSON (pricing config). One-way: Sheets → app. |

**Missing for “open with a Google Sheet”:**

- No `google_sheet_id` / `google_sheet_url` on deal or commercial UW.
- No flow to create or link a Sheet to a deal.
- No push of commercial UW data to a Sheet (portal → Sheets).
- No wiring of stored sheet ID into the Commercial UW tab (so "Open in Sheets" and optional embed work).

---

## What’s Needed (Phased)

### Phase 1: Link + open (minimal)

- **Schema:** Add to `unified_deals`: `google_sheet_id text`, (optional) `google_sheet_url text`. Migration + regenerate types.
- **UI – link sheet:** On Commercial UW tab (or deal settings): “Link Google Sheet” – user pastes Sheet URL; we parse ID, save to `unified_deals`, revalidate.
- **UI – open:** In Commercial UW tab, build `sheetUrl` from `deal.google_sheet_id` (e.g. `https://docs.google.com/spreadsheets/d/${id}/edit`) and pass it into the header/toolbar so “Open in Sheets” appears and works.
- **Optional:** Embed iframe (as in mockup) when `google_sheet_id` is set; same URL with `?rm=minimal&embedded=true&chrome=false&widget=false`.

**Rough effort:** 1–2 sessions (migration, one action to save sheet URL, wire `sheetUrl` into UnderwritingTab or shared header).

### Phase 2: Push portal → Sheet (sync to Sheets)

- **Template:** Define a “financial model” sheet layout (tabs/ranges for Pro Forma, Rent Roll, Assumptions, etc.) – e.g. match `excel-export.ts` structure so the same data shape maps to ranges.
- **Google APIs:** Use Google Sheets API (same service account or OAuth as Drive). Scopes: `drive`, `drive.file`, `spreadsheets` (read/write).
- **Sync action:** “Sync to Sheet” (or auto on save): read from `deal_commercial_uw` + child tables, map to sheet ranges, call `spreadsheets.values.update` (batch). Create sheet from template if `google_sheet_id` is null (Drive/Sheets API create from template or copy).
- **Where it runs:** Next.js API route or Edge Function (prefer same place as `create-deal-drive-folder` if using same creds).

**Rough effort:** 2–3 sessions (template, mapping, API integration, error handling, “last synced” state if desired).

### Phase 3: Two-way sync (Sheet → portal)

- **Read Sheet:** Periodically or on “Pull from Sheet”: read same ranges, parse values, validate, then upsert `deal_commercial_*` tables.
- **Conflict:** Simple strategy: last-write-wins or “Sheet wins” / “Portal wins” with timestamp; optional “last synced” per source.
- **Security:** Ensure only the deal’s sheet is writable/readable by our backend; validate sheet ID is the one we stored for that deal.

**Rough effort:** 2–4 sessions (read mapping, validation, conflict policy, UI for pull/sync status).

---

## How Far Away?

- **“Open with a Google Sheet” (link + open in new tab, optional embed):** about **1–2 sessions** after adding the column and “Link Sheet” + wiring `sheetUrl`. No sync yet; user edits the sheet manually or we add sync later.
- **“Sync to Sheet” so the sheet is populated from portal:** about **2–3 more sessions** (template + Sheets API push). So **~3–5 sessions** total for link + open + one-way sync.
- **Two-way sync:** add **~2–4 sessions** on top.

**Blockers / dependencies:**

- Google Sheets API enabled for the project and credentials (service account or OAuth) that can create/update spreadsheets. Drive is already used; adding Sheets is the main new dependency.
- Decision: create sheet from template automatically vs. user always pastes an existing sheet. The former needs a template (copy or create-from-structure); the latter only needs “paste URL → store ID → open.”

---

## Suggested Next Step

1. Add `google_sheet_id` (and optionally `google_sheet_url`) to `unified_deals`, plus a “Link Google Sheet” flow and wire `sheetUrl` into the Commercial UW tab so “Open in Sheets” works.  
2. Then add “Sync to Sheet” (push commercial UW data to that sheet) using a defined layout and the Sheets API.

This doc can live in `dev/active/` next to the card-types work and be moved to `dev/completed/` when the feature is done.
