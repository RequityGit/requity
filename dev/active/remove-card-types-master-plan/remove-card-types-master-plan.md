# Master Plan: Remove Card Types Once and For All

## Current State (After Formula + Field Migrations)

Already done:
- **Fields**: All field definitions and layout live in Object Manager (`field_configurations` + `page_layout_sections` / `page_layout_fields`). No runtime code reads `uw_fields`, `detail_field_groups`, `property_fields`, etc. from card types.
- **Formulas**: All UW output formulas (LTV, DSCR, etc.) live in `field_configurations` with `field_type = 'formula'`. Key Metrics, Underwriting panel, and kanban card computed metrics all read from field configs.
- **Dead columns removed from type/UI**: `uw_outputs`, `detail_tabs`, `uw_grid`, `uw_model_key`, `category` are no longer on `UnifiedCardType` or in the Card Type Manager.

What **remains** on card types and is still used at runtime:

| Column / concept | Where used | Purpose |
|------------------|------------|--------|
| `id` | `unified_deals.card_type_id` FK, intake `suggested_card_type_id`, `page_layout_sections.card_type_id`, `unified_checklist_templates.card_type_id` | Links deals and related rows to a type |
| `slug` | DealCard, DealDetailPage, DealFilters, PipelineTable, intake APIs, `isCommercial` logic | Short label key (e.g. "DSCR", "Comm Debt"), routing, commercial vs non-commercial |
| `label` | Breadcrumbs, fallback for short label, New Deal selector | Display name |
| `capital_side` | Deal creation (copied to deal), badges, filters | debt vs equity |
| `card_icon` | CardTypeSelector (new deal), optional in list | Icon for type |
| `card_metrics` | DealCard, PipelineTable | Which metrics to show on kanban card and in what order/format |
| `contact_roles` | ContactsTab | Role options for deal contacts (e.g. Borrower, Guarantor) |
| `applicable_asset_classes` | NewDealDialog, NewDealSheet | Which asset class options to show when creating a deal of this type |
| `status` | Pipeline page, quick-create, intake | Only "active" types shown in selectors and filters |
| `sort_order` | Pipeline page, quick-create | Order of types in dropdowns |

Database dependencies:
- **unified_deals.card_type_id** → `unified_card_types(id)`
- **page_layout_sections.card_type_id** (nullable) – layout does not currently filter by it; universal layout.
- **unified_checklist_templates.card_type_id** – checklist templates per type
- **intake_items.suggested_card_type_id** – intake suggestion

---

## Goal

Remove the **Card Types** feature entirely: no Card Type Manager UI, no `unified_card_types` table. Deals still need configuration for display, routing, and behavior; that configuration comes from a simple two-axis model: `asset_class` + `capital_side`.

---

## Driving Everything from Asset Class + Capital Side (Two-Axis Model)

**Simplified approach: Only two structural differentiators are needed.** You do not need card type to decide which fields show.

The app already supports this:

1. **Asset class** = `deal.asset_class` (Residential, Commercial, etc.). This is the primary axis in the Condition Matrix.

2. **Capital side** = `deal.capital_side` (debt | equity). This is the second axis.

3. **Loan product** (DSCR, RTL, Bridge, Perm, Construction, etc.) is **metadata** stored in `deal.uw_data.loan_type`, not a structural differentiator. It doesn't change which fields show or how the deal behaves structurally.

4. **VisibilityContext** is built from `deal.asset_class` + `deal.capital_side`. The Condition Matrix uses these two axes to determine field visibility.

5. **Commercial tab routing** (Pro Forma vs simple UW panel) uses `deal.asset_class === "commercial"` (and optionally `deal.capital_side`).

So for **field visibility and tab behavior**: configure the Condition Matrix on each field using **asset_class** and **capital_side** only. No card type needed. Replace any `isCommercial`-style checks that use `cardType.slug` with `deal.asset_class === "commercial"`.

What **remains** after that is only **display/config** metadata: short label in pipeline/breadcrumbs, icon, which metrics on the kanban card, contact roles. Those can come from a small in-code config keyed by `asset_class` + `capital_side` combination.

---

## Simplified Approach: Two-Axis Configuration (Recommended)

Replace the card types table with a simple config keyed by `asset_class` + `capital_side`. No `deal_type` column needed.

### 1. Define deal config in code

Add to `pipeline-types.ts` (or a small `lib/pipeline/deal-config.ts`):

```ts
export interface DealConfig {
  label: string;
  shortLabel: string;
  card_icon: string;
  card_metrics: CardMetricDef[];
  contact_roles: string[];
}

// Keyed by asset_class + capital_side combination
export const DEAL_CONFIG: Record<string, DealConfig> = {
  "residential:debt": {
    label: "Residential Debt",
    shortLabel: "Res Debt",
    card_icon: "home",
    card_metrics: [...],
    contact_roles: ["borrower", "guarantor"],
  },
  "residential:equity": {
    label: "Residential Equity",
    shortLabel: "Res Equity",
    card_icon: "home",
    card_metrics: [...],
    contact_roles: ["borrower", "investor"],
  },
  "commercial:debt": {
    label: "Commercial Debt",
    shortLabel: "Comm Debt",
    card_icon: "building-2",
    card_metrics: [...],
    contact_roles: ["borrower", "guarantor"],
  },
  "commercial:equity": {
    label: "Commercial Equity",
    shortLabel: "Comm Equity",
    card_icon: "building-2",
    card_metrics: [...],
    contact_roles: ["borrower", "investor"],
  },
};

// Helper to get config from deal
export function getDealConfig(deal: { asset_class: string | null; capital_side: CapitalSide }): DealConfig | null {
  if (!deal.asset_class) return null;
  const key = `${deal.asset_class}:${deal.capital_side}`;
  return DEAL_CONFIG[key] || null;
}

// Helper to get display label
export function getDealLabel(deal: { asset_class: string | null; capital_side: CapitalSide; uw_data?: Record<string, unknown> }): string {
  const config = getDealConfig(deal);
  if (config) return config.label;
  
  // Fallback: derive from fields
  const assetLabel = deal.asset_class === "commercial" ? "Commercial" : "Residential";
  const sideLabel = deal.capital_side === "debt" ? "Debt" : "Equity";
  return `${assetLabel} ${sideLabel}`;
}
```

Populate from current DB (one-time): read the active card types and group by `asset_class` + `capital_side` combination. Loan product (DSCR, RTL, etc.) is just metadata in `uw_data.loan_type`, not part of the config.

### 2. Schema: Remove `card_type_id` FK

- **No new column needed** - deals already have `asset_class` and `capital_side`.
- Make `card_type_id` nullable (for transition period).
- Stop writing `card_type_id` on new deals.
- Eventually drop `card_type_id` column entirely.
- Update Supabase types.

### 3. Replace card type usage with two-axis config

- **Pipeline page**: Stop fetching `unified_card_types`. For each deal, use `getDealConfig(deal)` to get display metadata. Pass config into PipelineView, DealCard, PipelineTable, DealFilters.
- **DealDetailPage**: Use `getDealConfig(deal)` for shortLabel, breadcrumb, isCommercial. Use `deal.asset_class === "commercial"` instead of `cardType.slug` checks.
- **New deal creation**: Replace CardTypeSelector with AssetClassSelector + CapitalSideSelector. On create, set `asset_class` and `capital_side` (no `card_type_id`).
- **Intake**: Map suggested type to `asset_class` + `capital_side` combination. Store as two fields or derive from keywords.
- **ContactsTab**: Use `getDealConfig(deal)?.contact_roles`.
- **Quick-create, stage config, etc.**: Use `getDealConfig()` instead of card type lookups.

### 4. Checklist templates and layout

- **unified_checklist_templates**: Add `asset_class` and `capital_side` columns (or a computed key). Migrate from `card_type_id` by looking up the card type's asset_class/capital_side, then drop `card_type_id`.
- **page_layout_sections.card_type_id**: Layout is universal; can drop the column or ignore it.

### 5. Remove Card Type Manager and table

- Delete Control Center route and UI: `app/(authenticated)/control-center/card-types/` (page, CardTypeManagerView, actions).
- Remove from Control Center nav (the "Card Types" tile and link).
- Intake: stop writing `suggested_card_type_id`; derive `asset_class` + `capital_side` from keywords.
- Migration: drop FKs from `unified_deals`, `unified_checklist_templates`, `page_layout_sections`, intake table; then `DROP TABLE unified_card_types`.

### 6. Types and constants cleanup

- Remove `UnifiedCardType` type entirely.
- Remove `UnifiedDeal.card_type_id` (already nullable, then drop).
- Remove `CARD_TYPE_SHORT_LABELS`; use `getDealConfig(deal)?.shortLabel`.
- `CardMetricDef` stays (used inside `DealConfig`).

---

## Option B: Minimal `deal_configs` Table (No Admin UI) - Alternative

If you prefer a database table over hardcoded config, keep a minimal table keyed by asset_class + capital_side.

- Table: `deal_configs` with columns: `asset_class` (text), `capital_side` (enum), `label`, `short_label`, `card_icon`, `card_metrics` (jsonb), `contact_roles` (array). Composite PK on `(asset_class, capital_side)`.
- Migrate data from `unified_card_types` by grouping by asset_class + capital_side.
- No Card Type Manager; no create/edit/delete in UI. Config changes via migrations.
- App resolves config via `SELECT * FROM deal_configs WHERE asset_class = $1 AND capital_side = $2`.
- Still no `deal_type` column on deals - just use existing `asset_class` + `capital_side`.

---

## Recommended Path (Two-Axis Approach)

1. **Phase 1 – Add deal config helpers**
   - Add `DEAL_CONFIG` constant and `getDealConfig()`, `getDealLabel()` helpers in code (from current card type data, grouped by asset_class + capital_side).
   - Ensure all deals have `asset_class` and `capital_side` populated (they should already).

2. **Phase 2 – Use two-axis config in app (parallel to card_type_id)**
   - Where you have `cardType`, replace with `getDealConfig(deal)` (with fallback from card type join if needed for transition).
   - New deal creation: set `asset_class` and `capital_side` directly; keep writing `card_type_id` for now if column still exists.

3. **Phase 3 – Stop using card_type_id**
   - All reads use `getDealConfig(deal)` based on `deal.asset_class` + `deal.capital_side`.
   - Create flows set only `asset_class` and `capital_side` (no `card_type_id`). Migration: make `card_type_id` nullable and stop writing it.

4. **Phase 4 – Intake and checklists**
   - Intake: derive `asset_class` + `capital_side` from keywords; when creating deal set these two fields.
   - Checklist templates: add `asset_class` and `capital_side` columns and backfill; drop `card_type_id` from checklist templates.

5. **Phase 5 – Remove Card Types feature and table**
   - Delete Control Center card-types route and nav entry.
   - Drop `card_type_id` from `unified_deals`, `suggested_card_type_id` from intake, `card_type_id` from `page_layout_sections` and `unified_checklist_templates`.
   - Drop table `unified_card_types`.
   - Remove `UnifiedCardType` and any remaining references; use `getDealConfig()` everywhere.

---

## Files to Touch (Summary)

| Area | Files |
|------|--------|
| Types / config | `pipeline-types.ts`, optionally `lib/pipeline/deal-config.ts` |
| Pipeline list | `pipeline/page.tsx`, `PipelineView.tsx`, `PipelineKanban.tsx`, `PipelineTable.tsx`, `DealCard.tsx`, `DealFilters.tsx` |
| Deal detail | `pipeline/[id]/page.tsx`, `DealDetailPage.tsx`, `EditableOverview.tsx`, `PropertyTab.tsx`, `ContactsTab.tsx` |
| New deal | `NewDealDialog.tsx`, `NewDealSheet.tsx` (replace CardTypeSelector with AssetClassSelector + CapitalSideSelector) |
| Intake | `app/api/intake/process/route.ts`, `app/api/intake/webhook/route.ts`, `IntakeReviewSheet.tsx`, intake page |
| Quick-create | `quick-create.ts`, `quick-create-button.tsx` |
| Actions | `pipeline/actions.ts` (create deal, ingest email, etc.) |
| Control Center | Remove `control-center/card-types/` and nav entry for Card Types |
| DB | Migrations: make `card_type_id` nullable, then drop it and `unified_card_types` table |

---

## Success Criteria

- No references to `unified_card_types` or Card Type Manager in the app.
- Every deal has `asset_class` and `capital_side` populated; display, filters, and behavior use `getDealConfig(deal)`.
- New deals are created with `asset_class` + `capital_side` directly; no `card_type_id`.
- Intake and checklist templates work with `asset_class` + `capital_side` instead of card type ID.
- Condition Matrix uses only `asset_class` + `capital_side` for field visibility (loan product is just metadata in `uw_data.loan_type`).
- Single source of truth for deal configuration is `DEAL_CONFIG` keyed by `asset_class` + `capital_side` combination.
