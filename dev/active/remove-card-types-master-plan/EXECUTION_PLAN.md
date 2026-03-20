# Remove Card Types: Execution Plan

**Date:** 2026-03-20
**Status:** Proposed, awaiting approval
**Risk level:** Medium (touches pipeline core, but data migration is clean)

---

## Why Now

Fields, formulas, and visibility already live in Object Manager / field_configurations. Card types are a dead abstraction layer that only provides display metadata (label, icon, card_metrics, contact_roles). The build just broke because the UnifiedCardType interface was incomplete. Every time we touch this area, we risk another outage. Rip it out.

---

## The Key Insight the Old Plan Missed

`asset_class + capital_side` is NOT enough. DSCR and RTL are both `sfr:debt` but show different kanban metrics (LTV/DSCR vs LTC/ARV). The config needs a third axis: `loan_type` from `uw_data`.

The config key becomes: `capital_side` + `loan_type` (not asset_class, because asset_class determines field visibility via Condition Matrix, while loan_type determines display behavior).

Actually simpler: there are really only 4 deal "flavors" that matter for display:

| Current slug | Structural driver | Card metrics |
|---|---|---|
| res_debt_dscr | debt + DSCR loan type | rate, LTV, DSCR |
| res_debt_rtl | debt + RTL/fix-flip loan type | rate, LTC, ARV |
| comm_debt | debt + commercial asset class | rate, LTV, DSCR |
| comm_equity | equity (any) | cap rate, units, occupancy |

So the real axes are: `capital_side` + `isCommercial` + `isRTL`. That's it.

---

## Proposed Config Model

```ts
// lib/pipeline/deal-display-config.ts

export type DealFlavor = "res_dscr" | "res_rtl" | "comm_debt" | "comm_equity";

export interface DealDisplayConfig {
  flavor: DealFlavor;
  label: string;
  shortLabel: string;
  icon: string;
  cardMetrics: CardMetricDef[];
  contactRoles: string[];
}

const CONFIGS: Record<DealFlavor, DealDisplayConfig> = {
  res_dscr: {
    flavor: "res_dscr",
    label: "Residential DSCR",
    shortLabel: "DSCR",
    icon: "home",
    cardMetrics: [
      { key: "interest_rate", suffix: "%" },
      { key: "ltv", label: "LTV", suffix: "%", computed: true },
      { key: "dscr", label: "DSCR", suffix: "x", computed: true },
    ],
    contactRoles: ["borrower"],
  },
  res_rtl: {
    flavor: "res_rtl",
    label: "Fix & Flip / RTL",
    shortLabel: "RTL",
    icon: "home",
    cardMetrics: [
      { key: "interest_rate", suffix: "%" },
      { key: "ltc", label: "LTC", suffix: "%", computed: true },
      { key: "arv", label: "ARV", format: "compact", prefix: "$" },
    ],
    contactRoles: ["borrower"],
  },
  comm_debt: {
    flavor: "comm_debt",
    label: "Commercial Bridge",
    shortLabel: "Comm Debt",
    icon: "building-2",
    cardMetrics: [
      { key: "interest_rate", suffix: "%" },
      { key: "ltv", label: "LTV", suffix: "%", computed: true },
      { key: "dscr", label: "DSCR", suffix: "x", computed: true },
    ],
    contactRoles: ["borrower"],
  },
  comm_equity: {
    flavor: "comm_equity",
    label: "Commercial Equity",
    shortLabel: "Comm Equity",
    icon: "building-2",
    cardMetrics: [
      { key: "cap_rate_in", label: "cap", suffix: "%", computed: true },
      { key: "units_lots_sites", suffix: " units" },
      { key: "occupancy_current", label: "occ", suffix: "%" },
    ],
    contactRoles: ["borrower", "investor"],
  },
};

// Derive flavor from deal data. No DB lookup needed.
export function getDealFlavor(deal: {
  asset_class: string | null;
  capital_side: "debt" | "equity";
  uw_data?: Record<string, unknown>;
}): DealFlavor {
  if (deal.capital_side === "equity") return "comm_equity";

  const isCommercial = ["mhc", "rv_park", "campground", "multifamily", "commercial", "mixed_use"]
    .includes(deal.asset_class ?? "");
  if (isCommercial) return "comm_debt";

  const loanType = String(deal.uw_data?.loan_type ?? "").toLowerCase();
  if (["rtl", "fix_flip", "fix & flip", "fix_and_flip"].includes(loanType)) return "res_rtl";

  return "res_dscr"; // default for residential debt
}

export function getDealDisplayConfig(deal: Parameters<typeof getDealFlavor>[0]): DealDisplayConfig {
  return CONFIGS[getDealFlavor(deal)];
}
```

This replaces the entire `unified_card_types` table with ~80 lines of deterministic code.

---

## Execution Phases

### Phase 1: Add Config + Parallel Read Path (non-breaking)
**Estimated effort:** 1 session
**Risk:** Zero (additive only, no deletions)

1. Create `lib/pipeline/deal-display-config.ts` with the config above
2. Fix the 1 deal with null `asset_class` (backfill from card type)
3. Add `getDealDisplayConfig()` calls alongside existing cardType reads (don't remove cardType yet)
4. Verify: `getDealFlavor(deal)` matches the card type slug for all 41 deals

**Files:**
- NEW: `lib/pipeline/deal-display-config.ts`
- EDIT: none (just add the file)

**DB:**
```sql
-- Backfill the one deal missing asset_class
UPDATE unified_deals SET asset_class = 'sfr'
WHERE asset_class IS NULL AND card_type_id = '977496b1-5109-4298-83bb-f8b1735d9d16';
```

---

### Phase 2: Swap All Card Type Reads to Deal Config (breaking change, behind the scenes)
**Estimated effort:** 2 sessions
**Risk:** Medium (core pipeline rendering changes)

Replace every `cardType.xyz` with `getDealDisplayConfig(deal).xyz`.

**Pipeline list page (`pipeline/page.tsx`):**
- Stop fetching `unified_card_types` (currently line 40-44)
- Pass deal data directly; each DealCard calls `getDealDisplayConfig(deal)`

**Pipeline components:**
- `DealCard.tsx`: Replace `cardType.card_metrics` with `getDealDisplayConfig(deal).cardMetrics`
- `PipelineTable.tsx`: Same pattern
- `PipelineKanban.tsx`: Remove cardType prop; derive from deal
- `DealFilters.tsx`: Filter by `capital_side` and `asset_class` dropdowns instead of card type slug. (Already has asset class filter from recent commit.)
- `PipelineView.tsx`: Remove cardType array state; simplify

**Deal detail page (`pipeline/[id]/page.tsx` + `DealDetailPage.tsx`):**
- Stop fetching card type (remove the join)
- Replace `isCommercial = ["comm_debt","comm_equity"].includes(cardType.slug)` with `deal.asset_class` check
- Breadcrumb: use `getDealDisplayConfig(deal).shortLabel`
- ContactsTab: use `getDealDisplayConfig(deal).contactRoles`

**Deal creation (`NewDealDialog.tsx`, `NewDealSheet.tsx`):**
- Remove CardTypeSelector component
- Replace with: asset_class dropdown + capital_side toggle + loan_type dropdown
- On create: set `asset_class`, `capital_side`, `uw_data.loan_type` (still write `card_type_id` for rollback safety)

**Quick create:**
- `quick-create-button.tsx`: Same as above

**Files:**
- `pipeline/page.tsx`
- `pipeline/[id]/page.tsx`
- `DealDetailPage.tsx`
- `DealCard.tsx`
- `PipelineView.tsx`
- `PipelineKanban.tsx`
- `PipelineTable.tsx`
- `DealFilters.tsx`
- `EditableOverview.tsx`
- `ContactsTab.tsx`
- `NewDealDialog.tsx`
- `NewDealSheet.tsx`
- `quick-create-button.tsx`
- `pipeline/actions.ts` (createUnifiedDealAction: stop requiring card_type_id)

---

### Phase 3: Migrate Checklist Templates + Intake
**Estimated effort:** 1 session
**Risk:** Low

**Checklist templates:**
```sql
-- Add new columns
ALTER TABLE unified_checklist_templates ADD COLUMN asset_class text;
ALTER TABLE unified_checklist_templates ADD COLUMN capital_side text;
ALTER TABLE unified_checklist_templates ADD COLUMN deal_flavor text;

-- Backfill from card type
UPDATE unified_checklist_templates t
SET deal_flavor = CASE
  WHEN ct.slug = 'res_debt_dscr' THEN 'res_dscr'
  WHEN ct.slug = 'res_debt_rtl' THEN 'res_rtl'
  WHEN ct.slug = 'comm_debt' THEN 'comm_debt'
  WHEN ct.slug = 'comm_equity' THEN 'comm_equity'
END
FROM unified_card_types ct
WHERE ct.id = t.card_type_id;
```

Update checklist template queries to filter by `deal_flavor` instead of `card_type_id`.

**Intake:**
- `api/intake/webhook/route.ts`: Derive `asset_class` + `capital_side` from document keywords instead of suggesting a card_type_id
- `api/intake/process/route.ts`: Same
- `IntakeReviewSheet.tsx` / `IntakeReviewModal.tsx`: Show asset_class + capital_side selectors instead of card type

**Files:**
- `api/intake/webhook/route.ts`
- `api/intake/process/route.ts`
- `IntakeReviewSheet.tsx` or `IntakeReviewModal.tsx`
- Checklist template queries (wherever they filter by card_type_id)
- DB migration for checklist templates

---

### Phase 4: Drop Card Types (cleanup)
**Estimated effort:** 1 session
**Risk:** Low (everything already migrated)

1. Make `card_type_id` nullable on `unified_deals` (if not already)
2. Stop writing `card_type_id` on deal creation
3. Delete Control Center card types route: `app/(authenticated)/control-center/card-types/` (page.tsx, CardTypeManagerView.tsx, actions.ts)
4. Remove Card Types from Control Center nav
5. Remove `UnifiedCardType` interface and all imports
6. Remove `CardTypeSelector` component
7. Drop FK constraints and columns:

```sql
ALTER TABLE unified_deals DROP CONSTRAINT unified_deals_card_type_id_fkey;
ALTER TABLE unified_deals DROP COLUMN card_type_id;
ALTER TABLE unified_checklist_templates DROP CONSTRAINT unified_checklist_templates_card_type_id_fkey;
ALTER TABLE unified_checklist_templates DROP COLUMN card_type_id;
ALTER TABLE page_layout_sections DROP CONSTRAINT page_layout_sections_card_type_id_fkey;
ALTER TABLE page_layout_sections DROP COLUMN card_type_id;
-- intake table: drop suggested_card_type_id similarly
DROP TABLE unified_card_types;
```

8. Regenerate Supabase types
9. Clean up `pipeline-types.ts`: remove `UnifiedCardType`, `UwFieldDef`, `UwOutputDef`, `GridTemplateDef` and related dead types

**Files:**
- DELETE: `control-center/card-types/` (entire directory)
- DELETE: `CardTypeSelector.tsx`
- EDIT: `pipeline-types.ts` (remove dead types)
- EDIT: Control Center nav/layout
- DB: migration to drop table and columns

---

## Rollback Strategy

Phase 1-2: `card_type_id` is still populated on all deals. If something breaks, revert the code and reads go back to card type joins. Zero data loss.

Phase 3: Checklist templates have both old and new columns during transition. Rollback = revert code, old column still works.

Phase 4: Point of no return. Only execute after Phase 2-3 have been stable in production for at least a week.

---

## Success Criteria

- No references to `unified_card_types` anywhere in the codebase
- No Card Type Manager in Control Center
- Pipeline, deal detail, kanban, filters all work using `getDealDisplayConfig(deal)`
- New deals created with `asset_class` + `capital_side` + `loan_type` only
- Checklist templates and intake use `deal_flavor` or `asset_class`/`capital_side`
- Build passes clean
- All 41 existing deals render correctly

---

## Open Questions for Dylan

1. **Do you want to add a `loan_type` dropdown to the deal creation flow?** Currently loan_type lives in uw_data and gets set on the overview tab. Moving it to the creation dialog would let us derive the flavor immediately. Recommended: yes.

2. **Commercial asset class list:** Currently commercial = mhc, rv_park, campground, multifamily, commercial, mixed_use. Residential = sfr, duplex_fourplex. Is that correct? Or should multifamily be residential in some cases?

3. **Phase 4 timing:** How long do you want Phase 2-3 running in parallel (with card_type_id still populated) before we drop the table? 1 week? 2 weeks?
