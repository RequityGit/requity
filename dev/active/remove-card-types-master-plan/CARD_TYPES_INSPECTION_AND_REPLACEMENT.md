# Card Types: Inspection and Replacement by Object Manager + Condition Logic

**Date:** 2026-03-14  
**Purpose:** Single reference for what is needed to fully delete Card Types and replace with Object Manager deal pipeline objects and their condition logic.  
**Related:** `remove-card-types-master-plan.md`, `dev/CARD_TYPES_RESEARCH.md`, `dev/CARD_TYPES_TOUCHPOINTS.md`, `dev/active/object-manager-runtime/`

---

## 1. Existing Process (What You Had Running)

You have an **active plan** in `dev/active/remove-card-types-master-plan/`:

- **remove-card-types-master-plan.md** – Master plan (Option A: hardcoded `DEAL_TYPE_CONFIG`, add `unified_deals.deal_type`, 5-phase migration).

That plan is the right one. This doc is a **thorough inspection** that aligns it with Object Manager and condition logic, and lists every touchpoint and prerequisite.

---

## 2. What Card Types Do Today vs Object Manager + Condition Logic

### Already moved to Object Manager (no card type needed at runtime)

| Concern | Source now | Notes |
|--------|------------|--------|
| **Field definitions** | `field_configurations` (modules `uw_deal`, `uw_property`, `uw_borrower`) | Object Manager Fields tab; pipeline uses `useUwFieldConfigs(visibilityContext)` |
| **Page layout (tabs, sections)** | `page_layout_sections` + `page_layout_fields` for `page_type = 'deal_detail'` | Object Manager Page Layout tab; pipeline uses `useDealLayout()`; **universal** (no card_type_id scoping) |
| **Visibility (which fields show)** | `field_configurations.visibility_condition` (Condition Matrix) | Object Manager Condition Matrix; evaluated via `isVisible(condition, context)` with `VisibilityContext` from `deal.asset_class` + `deal.uw_data` (e.g. loan_type) |
| **Formulas (LTV, DSCR, etc.)** | `field_configurations` with `field_type = 'formula'` | Key Metrics, Underwriting panel, kanban computed metrics read from field configs |
| **Conditional logic (future)** | `field_configurations.conditional_rules` | Object Manager runtime plan: `useConditionalLogic`, stage gating, etc. |

So: **deal pipeline “objects” and condition logic are already the Object Manager + `field_configurations` + `page_layout_*`.** Card types are **not** the source of truth for fields or layout anymore.

### What still depends on Card Types (must be replaced)

| Card type data | Where it’s used | Replacement |
|----------------|-----------------|-------------|
| **id** | `unified_deals.card_type_id` FK, `email_intake_queue.suggested_card_type_id`, `page_layout_sections.card_type_id`, `unified_checklist_templates.card_type_id` | Deal identity: use **deal_type slug** (e.g. `res_debt_dscr`) on `unified_deals`; no FK to card types |
| **slug** | DealCard, DealDetailPage, DealFilters, PipelineTable, intake, `isCommercial`, condition generation RPC | **deal_type** column (text slug). Same slugs in code: `DEAL_TYPE_CONFIG[deal.deal_type]` |
| **label** | Breadcrumbs, New Deal selector | `DEAL_TYPE_CONFIG[slug].label` |
| **shortLabel** | Compact display (cards, table) | `DEAL_TYPE_CONFIG[slug].shortLabel` (replace `CARD_TYPE_SHORT_LABELS`) |
| **capital_side** | Deal creation, badges, filters | From config; denormalized on deal already |
| **card_icon** | CardTypeSelector, list/card UI | `DEAL_TYPE_CONFIG[slug].card_icon` |
| **card_metrics** | DealCard, PipelineTable (which metrics and order) | `DEAL_TYPE_CONFIG[slug].card_metrics` |
| **contact_roles** | ContactsTab (role options) | `DEAL_TYPE_CONFIG[slug].contact_roles` |
| **applicable_asset_classes** | NewDealDialog/NewDealSheet (asset class options when creating) | `DEAL_TYPE_CONFIG[slug].applicable_asset_classes` |
| **status** | Only “active” types in selectors/filters | Not needed if deal types are fixed in code |
| **sort_order** | Order in dropdowns | In-code config order |

So: **full deletion of Card Types** = replace the above with a **deal type config** (hardcoded or minimal table) keyed by **slug**, and store **deal_type** (slug) on each deal instead of `card_type_id`.

---

## 3. Object Manager “Deal Pipeline Objects” and Condition Logic (Clarification)

- **Objects:** In Object Manager, the pipeline is represented by the **unified_deal** object and related modules: `uw_deal`, `uw_property`, `uw_borrower` (and optionally `loan_details`, etc.). These are the “deal pipeline objects”; their fields live in `field_configurations` with those modules.
- **Condition logic:**
  - **Visibility:** `field_configurations.visibility_condition` (Condition Matrix: asset_class, loan_type, etc.) – already used at runtime via `useUwFieldConfigs(visibilityContext)`.
  - **Planned:** `conditional_rules`, `required_at_stage`, `blocks_stage_progression`, role permissions – see `dev/active/object-manager-runtime/object-manager-runtime-plan.md`.

No card type is required for Object Manager objects or for this condition logic. Visibility context is **deal.asset_class** + **deal.uw_data** (and optionally **capital_side**); that can come from a deal_type config instead of a card type row.

---

## 4. What Is Needed to Fully Delete Card Types

### 4.1 Prerequisites (already true or small follow-ups)

- **Fields and layout from Object Manager:** Done. Pipeline uses `useUwFieldConfigs` and `useDealLayout`; no runtime reads of card type field refs or layout.
- **Visibility from Condition Matrix:** Done. `VisibilityContext` from deal; no card type in the visibility path.
- **Object Manager runtime (optional but recommended):** Finish wiring conditional logic, stage gating, permissions so that **all** behavior is driven by `field_configurations` and layout, not card type. Not strictly required to *delete* card types, but keeps one source of truth.

### 4.2 Schema and data

1. **Add `unified_deals.deal_type`** (e.g. `text NOT NULL DEFAULT 'res_debt_dscr'`) with allowed values matching your slugs.
2. **Backfill:** `UPDATE unified_deals SET deal_type = (SELECT slug FROM unified_card_types WHERE id = unified_deals.card_type_id);`
3. **Intake:** Add `suggested_deal_type_slug` (or equivalent); backfill from current `suggested_card_type_id` via join to `unified_card_types`; stop writing `suggested_card_type_id`.
4. **Checklist templates:** Add `deal_type` (or keep a minimal `deal_types` table and FK); backfill from `card_type_id`; then drop `card_type_id`.
5. **page_layout_sections.card_type_id:** Layout is universal; can ignore or drop column.
6. **Drop FKs and table:** Remove `card_type_id` from `unified_deals`, `suggested_card_type_id` from intake, `card_type_id` from `page_layout_sections` and `unified_checklist_templates`; then `DROP TABLE unified_card_types`.

### 4.3 Code: deal type config (replacing card type rows)

- **Add** `DEAL_TYPE_SLUGS`, `DealTypeSlug`, `DealTypeConfig`, `DEAL_TYPE_CONFIG` (e.g. in `lib/pipeline/deal-types.ts` or `pipeline-types.ts`). Populate from current active card types: slug, label, shortLabel, capital_side, card_icon, card_metrics, contact_roles, applicable_asset_classes, isCommercial.
- **Replace** every place that today:
  - Fetches or receives a `UnifiedCardType`, or
  - Uses `deal.card_type_id` to look up a card type  
  with a lookup by **deal.deal_type** into `DEAL_TYPE_CONFIG[deal.deal_type]` (with fallback for backfilled rows if you keep `card_type_id` temporarily).

### 4.4 Code: file-level touchpoints (delete or switch to deal_type)

**Remove entirely**

- `apps/requity-os/app/(authenticated)/control-center/card-types/` (page, CardTypeManagerView, actions).
- Control Center nav entry for “Card Types” in `_config/nav.ts`.

**Pipeline list and filters**

- `PipelineView.tsx` – Stop fetching `unified_card_types`; build deal type options from `DEAL_TYPE_CONFIG`.
- `PipelineKanban.tsx`, `PipelineTable.tsx`, `DealCard.tsx`, `DealFilters.tsx` – Use `deal.deal_type` + `DEAL_TYPE_CONFIG` instead of `cardTypeMap.get(deal.card_type_id)` and `CARD_TYPE_SHORT_LABELS`.

**Deal detail**

- `app/(authenticated)/(admin)/pipeline/[id]/page.tsx` – Stop fetching `unified_card_types` by `deal.card_type_id`; pass `deal_type` (and optionally pre-resolved config) into `DealDetailPage`.
- `DealDetailPage.tsx` – Prop: `dealTypeConfig` (or `dealType: DealTypeSlug` + config lookup). Replace all `cardType.*` usage (breadcrumb, shortLabel, isCommercial, contact_roles, etc.) with config from `DEAL_TYPE_CONFIG[deal.deal_type]`.

**New deal creation**

- `NewDealDialog.tsx`, `NewDealSheet.tsx` – Select from `DEAL_TYPE_CONFIG` (no card type fetch); on create send `deal_type` (and `capital_side` from config).
- `CardTypeSelector.tsx` – Optionally keep component but feed it from `DEAL_TYPE_CONFIG` (no DB).

**Actions**

- `pipeline/actions.ts` – `createUnifiedDealAction`: accept `deal_type` (and optionally `capital_side`); write `deal_type` (and stop writing `card_type_id` once column is removed). Ingest-from-email flow: resolve slug from keywords, set `deal_type`; use `suggested_deal_type_slug` in intake if you add it.

**Intake**

- `app/api/intake/webhook/route.ts`, `app/api/intake/process/route.ts` – Suggest/store deal type as slug; when creating deal set `deal_type` from suggestion.
- `IntakeReviewSheet.tsx` – Use deal type slug/config instead of `suggested_card_type_id`.

**Quick-create**

- `quick-create.ts` – Use `DEAL_TYPE_CONFIG` for options; create deals with `deal_type`.

**Conditions RPC**

- `generate_deal_conditions`: today it gets slug via `unified_card_types` join. Change to use `unified_deals.deal_type` (same slug values); no need for card types table.

**Stage config**

- `pipeline-stage-config` – If rules reference `card_type_id`, switch to `deal_type` (string) or remove if not needed.

**Document extraction**

- `app/api/deals/extract-from-document/route.ts` – Accept `deal_type` (or resolve from deal); use field configs for that context instead of card type.

**Types and constants**

- Remove or shrink `UnifiedCardType`; add `DealTypeSlug`, `DealTypeConfig`; replace `UnifiedDeal.card_type_id` with `deal_type: DealTypeSlug`; remove `CARD_TYPE_SHORT_LABELS` in favor of `DEAL_TYPE_CONFIG[slug].shortLabel`.

### 4.5 Hooks and resolution

- **useResolvedCardType:** No longer in use for field resolution; pipeline uses `useUwFieldConfigs` and `useDealLayout`. Any remaining references (e.g. in docs or dead code) can be removed.
- **useUwFieldConfigs(visibilityContext):** Keep; it’s the Object Manager–driven field source with condition logic (visibility).
- **useDealLayout():** Keep; it’s the Object Manager–driven layout.

So: **deleting Card Types does not require a new “object manager deal pipeline object”** – that object and its condition logic are already in place. It only requires **replacing the remaining card-type-derived display/config** with a deal-type config keyed by slug and storing that slug on the deal.

---

## 5. Condition Logic That Object Manager Uses (Recap)

- **Visibility:** `visibility_condition` (Condition Matrix) on `field_configurations`; evaluated with `deal.asset_class` and deal fields (e.g. loan_type). No card type.
- **Commercial tab routing:** Can use `deal.asset_class === 'commercial'` (and optionally `capital_side`) instead of `cardType.slug === 'comm_debt' | 'comm_equity'`.
- **Future:** `conditional_rules`, `required_at_stage`, `blocks_stage_progression`, permissions – all on `field_configurations`; see object-manager-runtime plan.

All of this works with **deal_type + deal fields**; no card type table needed.

---

## 6. Recommended Order of Work

1. **Add deal type config and column (Phase 1 of master plan)**  
   - Implement `DEAL_TYPE_CONFIG` and `unified_deals.deal_type`; backfill from `unified_card_types.slug`.

2. **Use deal_type everywhere in app (Phases 2–3)**  
   - All reads and new writes use `deal.deal_type` + `DEAL_TYPE_CONFIG`; stop writing `card_type_id`.

3. **Intake and checklists (Phase 4)**  
   - `suggested_deal_type_slug`, checklist templates by deal_type; RPC and stage config by deal_type.

4. **Remove Card Types feature and table (Phase 5)**  
   - Delete control-center card-types route and nav; drop FKs and `unified_card_types`.

5. **Optional**  
   - Complete object-manager-runtime wiring so all behavior (including conditional logic and stage gating) is clearly driven only by Object Manager and deal_type.

---

## 7. Success Criteria

- No references to `unified_card_types` or Card Type Manager in the app.
- Every deal has a `deal_type` (slug); display, filters, and behavior use `DEAL_TYPE_CONFIG[deal_type]`.
- New deals are created with `deal_type` (and denormalized fields as needed); no `card_type_id`.
- Intake and checklist templates use `deal_type` (or minimal table) instead of card type.
- Single source of truth for fields and layout: Object Manager (`field_configurations` + `page_layout_*`); for “deal type” display/config: code (or minimal read-only table).

---

## 8. Where Your Existing Plan Lives

- **Master plan (phases, options):** `dev/active/remove-card-types-master-plan/remove-card-types-master-plan.md`
- **Full codebase research:** `dev/CARD_TYPES_RESEARCH.md`
- **Touchpoint index:** `dev/CARD_TYPES_TOUCHPOINTS.md`
- **Removal strategy options:** `dev/CARD_TYPES_REMOVAL_STRATEGY.md`
- **Object Manager runtime (condition logic):** `dev/active/object-manager-runtime/object-manager-runtime-plan.md`

This inspection ties that plan to “object manager deal pipeline objects and condition logic”: those are already in place; the remaining work is to replace card-type-only data with deal_type + config and then remove the Card Types feature and table.
