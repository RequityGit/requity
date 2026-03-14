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

Remove the **Card Types** feature entirely: no Card Type Manager UI, no `unified_card_types` table. Deals still need a “type” (e.g. DSCR vs Comm Debt) for display, routing, and behavior; that type must come from a fixed, minimal source (code or a tiny table with no admin UI).

---

## Driving Everything from Property Type + Deal Type (Conditional Logic)

**Yes – conditional logic can be driven entirely by property type and deal type.** You do not need card type to decide which fields show.

The app already supports this:

1. **Property type** = `deal.asset_class` (normalized to Residential 1–4, Multifamily, MHC, RV/Campground, Commercial). This is the primary axis in the Condition Matrix.

2. **Deal type** = combine:
   - **Capital side**: `deal.capital_side` (debt | equity).
   - **Product/loan type**: from `deal.uw_data` (e.g. `loan_type`, `loan_purpose`, `acquisition_type`, `exit_strategy`). The Condition Matrix supports extra dimensions via `visibility_condition.conditions` (e.g. `loan_type: ["Bridge", "DSCR"]`, or a single deal-type field like construction vs perm).

3. **VisibilityContext** is already built from `deal.asset_class` and `deal.uw_data` (loan_type, loan_purpose, acquisition_type, exit_strategy). Add `capital_side: deal.capital_side` to `dealValues` so the Condition Matrix can filter by debt/equity.

4. **Commercial tab routing** (Pro Forma vs simple UW panel) can use **asset_class === "commercial"** (and optionally capital_side) instead of `cardType.slug === "comm_debt" | "comm_equity"`.

So for **field visibility and tab behavior**: configure the Condition Matrix on each field using **asset_class** and **conditions** (e.g. `capital_side`, `loan_type`, or a dedicated `deal_type` in uw_data: Bridge, DSCR, Perm, Construction, Equity). No card type needed. Replace any `isCommercial`-style checks that use `cardType.slug` with `deal.asset_class === "commercial"` (and optional `deal.capital_side`).

What **remains** after that is only **display/config** metadata: short label in pipeline/breadcrumbs, icon, which metrics on the kanban card, contact roles, and applicable asset classes for new-deal flow. Those can come from a small in-code config keyed by the same axes (e.g. capital_side + loan_type) or by a single derived deal-type slug, so card types can still be removed.

---

## Option A: Hardcoded Deal Types (Recommended)

Replace the card types table with a single constant in code. Deal type is a slug string on the deal; metadata comes from the constant.

### 1. Define deal type registry in code

Add to `pipeline-types.ts` (or a small `lib/pipeline/deal-types.ts`):

```ts
export const DEAL_TYPE_SLUGS = ["res_debt_dscr", "res_debt_rtl", "comm_debt", "comm_equity"] as const;
export type DealTypeSlug = (typeof DEAL_TYPE_SLUGS)[number];

export interface DealTypeConfig {
  slug: DealTypeSlug;
  label: string;
  shortLabel: string;
  capital_side: CapitalSide;
  card_icon: string;
  card_metrics: CardMetricDef[];
  contact_roles: string[];
  applicable_asset_classes: AssetClass[] | null;
  isCommercial: boolean;
}

export const DEAL_TYPE_CONFIG: Record<DealTypeSlug, DealTypeConfig> = {
  res_debt_dscr: { slug: "res_debt_dscr", label: "Residential DSCR", shortLabel: "DSCR", ... },
  res_debt_rtl:   { ... },
  comm_debt:      { ... },
  comm_equity:    { ... },
};
```

Populate from current DB (one-time): read the four active card types and copy slug, label, capital_side, card_icon, card_metrics, contact_roles, applicable_asset_classes into this config. `shortLabel` can match current `CARD_TYPE_SHORT_LABELS`.

### 2. Schema: add `deal_type` to unified_deals

- Add column: `deal_type text NOT NULL DEFAULT 'res_debt_dscr'` (or use a check constraint / enum for the four slugs).
- Backfill: `UPDATE unified_deals SET deal_type = (SELECT slug FROM unified_card_types WHERE id = unified_deals.card_type_id);`
- Remove FK: drop `card_type_id` (or keep nullable for a transition period, then drop).
- Update Supabase types.

### 3. Replace card type usage with deal type config

- **Pipeline page**: Stop fetching `unified_card_types`. For each deal use `deal.deal_type` (or `deal.card_type_id` during transition) to look up `DEAL_TYPE_CONFIG[dealTypeSlug]`. Pass that config (or slug + config) into PipelineView, DealCard, PipelineTable, DealFilters.
- **DealDetailPage**: Resolve card type from `deal.deal_type` → `DEAL_TYPE_CONFIG[deal.deal_type]` (or from joined card type during transition). Use for shortLabel, breadcrumb, isCommercial, and any tab/visibility that still needs it.
- **New deal creation**: CardTypeSelector shows options from `DEAL_TYPE_CONFIG` (filter by status equivalent: e.g. all four). On create, set `deal_type` (and `capital_side` from config) instead of `card_type_id`.
- **Intake**: Map suggested type to slug; store `suggested_deal_type_slug` (or keep `suggested_card_type_id` and resolve slug from existing table during transition). When creating deal from intake, set `deal_type` from suggestion.
- **ContactsTab**: Use `DEAL_TYPE_CONFIG[deal.deal_type].contact_roles`.
- **Quick-create, stage config, etc.**: Use `DEAL_TYPE_CONFIG` and slug instead of card type rows.

### 4. Checklist templates and layout (optional scoping)

- **unified_checklist_templates**: Either (a) add `deal_type` and migrate `card_type_id` → `deal_type`, then drop `card_type_id`, or (b) keep FK to a minimal `deal_types` table (see Option B) so templates stay relational.
- **page_layout_sections.card_type_id**: Layout is universal; can drop the column or ignore it. If you need type-specific sections later, you can filter by `deal_type` in app using `deal.deal_type` (no FK needed).

### 5. Remove Card Type Manager and table

- Delete Control Center route and UI: `app/(authenticated)/control-center/card-types/` (page, CardTypeManagerView, actions).
- Remove from Control Center nav (the “Card Types” tile and link).
- Intake: stop writing `suggested_card_type_id`; use `suggested_deal_type_slug` (new column) or a simple string. Update intake APIs to resolve slug from keyword logic and store slug or leave suggestion as display-only.
- Migration: drop FKs from `unified_deals`, `unified_checklist_templates`, `page_layout_sections`, intake table; then `DROP TABLE unified_card_types`.

### 6. Types and constants cleanup

- Remove `UnifiedCardType` and replace with `DealTypeSlug` + `DealTypeConfig` (and optionally a `DealType` type that’s the config plus slug).
- Replace `UnifiedDeal.card_type_id` with `deal_type: DealTypeSlug` (or keep both during transition).
- Remove `CARD_TYPE_SHORT_LABELS`; use `DEAL_TYPE_CONFIG[slug].shortLabel`.
- `CardMetricDef` stays (used inside `DealTypeConfig`).

---

## Option B: Minimal `deal_types` Table (No Admin UI)

Keep a single table with one row per deal type, no “manager” UI. App and migrations are the only writers.

- Table: `deal_types` with columns: `slug` (PK), `label`, `short_label`, `capital_side`, `card_icon`, `card_metrics` (jsonb), `contact_roles` (array), `applicable_asset_classes` (array), `sort_order`, `is_active` (or drop status and treat all as active).
- Migrate data from `unified_card_types` (only active rows, map slug → one row per type).
- `unified_deals.deal_type` → text FK to `deal_types.slug` (or keep `deal_type_id` FK to `deal_types.id`).
- No Card Type Manager; no create/edit/delete of deal types in UI. Config changes are done via migrations or seed scripts.
- Rest of the app same as Option A: resolve config from `deal_types` by slug instead of from a constant.

---

## Recommended Path (Option A)

1. **Phase 1 – Add deal type config and `deal_type` column**
   - Add `DEAL_TYPE_SLUGS`, `DealTypeSlug`, `DealTypeConfig`, `DEAL_TYPE_CONFIG` in code (from current card type data).
   - Migration: add `unified_deals.deal_type` (text), backfill from `unified_card_types.slug`, add constraint for allowed slugs.

2. **Phase 2 – Use deal type in app (parallel to card_type_id)**
   - Where you have `cardType`, derive a “deal type config” from `DEAL_TYPE_CONFIG[deal.deal_type]` (with fallback from card type join if `deal_type` is missing for old rows).
   - New deal creation: set `deal_type` and `capital_side` from selected config; keep writing `card_type_id` for now if column still exists.

3. **Phase 3 – Stop using card_type_id**
   - All reads use `deal.deal_type` + `DEAL_TYPE_CONFIG`.
   - Create flows set only `deal_type` (and denormalized `capital_side`). Migration: make `card_type_id` nullable and stop writing it.

4. **Phase 4 – Intake and checklists**
   - Intake: add `suggested_deal_type_slug` (or equivalent); resolve from keywords; when creating deal set `deal_type` from suggestion.
   - Checklist templates: add `deal_type` and backfill; drop `card_type_id` from checklist templates.

5. **Phase 5 – Remove Card Types feature and table**
   - Delete Control Center card-types route and nav entry.
   - Drop `card_type_id` from `unified_deals`, `suggested_card_type_id` from intake, `card_type_id` from `page_layout_sections` and `unified_checklist_templates`.
   - Drop table `unified_card_types`.
   - Remove `UnifiedCardType` and any remaining references; use `DealTypeConfig` and `DealTypeSlug` everywhere.

---

## Files to Touch (Summary)

| Area | Files |
|------|--------|
| Types / config | `pipeline-types.ts`, optionally `lib/pipeline/deal-types.ts` |
| Pipeline list | `pipeline/page.tsx`, `PipelineView.tsx`, `PipelineKanban.tsx`, `PipelineTable.tsx`, `DealCard.tsx`, `DealFilters.tsx` |
| Deal detail | `pipeline/[id]/page.tsx`, `DealDetailPage.tsx`, `EditableOverview.tsx`, `PropertyTab.tsx`, `ContactsTab.tsx` |
| New deal | `NewDealDialog.tsx`, `NewDealSheet.tsx`, `CardTypeSelector.tsx` |
| Intake | `app/api/intake/process/route.ts`, `app/api/intake/webhook/route.ts`, `IntakeReviewSheet.tsx`, intake page |
| Quick-create | `quick-create.ts`, `quick-create-button.tsx` |
| Actions | `pipeline/actions.ts` (create deal, ingest email, etc.) |
| Control Center | Remove `control-center/card-types/` and nav entry for Card Types |
| DB | Migrations: add `deal_type`, backfill, FKs, then drop `card_type_id` and `unified_card_types` |

---

## Success Criteria

- No references to `unified_card_types` or Card Type Manager in the app.
- Every deal has a `deal_type` (slug); display, filters, and behavior use `DEAL_TYPE_CONFIG[deal_type]`.
- New deals are created with `deal_type` and optional denormalized fields (`capital_side`); no `card_type_id`.
- Intake and checklist templates work with `deal_type` (or minimal table) instead of card type ID.
- Single source of truth for “deal type” behavior is either code (Option A) or a minimal read-only table (Option B).
