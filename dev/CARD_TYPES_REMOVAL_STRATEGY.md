# Card Types System - Removal/Replacement Strategy

**Purpose:** Plan for removing or refactoring the `unified_card_types` system

**Status:** Strategy document (not approved, for planning use only)

---

## Why Remove Card Types?

**Current state:** Card types are heavily integrated as:
1. Deal type selector (must choose one when creating a deal)
2. Field layout configuration (defines detail_tabs, field_groups)
3. Field visibility context (works with asset_class + loan_type)
4. Metrics/outputs provider (card_metrics, uw_outputs, uw_grid)

**Potential reasons to remove:**
- Admin overhead managing two systems (field_configurations + card_types)
- Field visibility conditions are per-field, not per-card-type
- Layout should be per-module, not per-deal-type
- Deals don't always fit neatly into predefined types

**BUT:** Complete removal is VERY disruptive because:
- `unified_deals.card_type_id` is NOT NULL FK - every deal must reference one
- Deal creation flow requires selecting a type
- Field resolution depends on card type context
- 17+ files directly reference card types
- 8+ API routes and migrations reference card types

---

## Option 1: Hybrid Approach (RECOMMENDED)

### Keep Card Types, Eliminate Inline Fields

**Status:** Already 80% implemented via field_refs system

**What to do:**
1. ✅ Card types store ONLY references: `*_field_refs` (already done)
2. ✅ Card types store ONLY layout: `detail_tabs`, `*_field_groups` (already done)
3. ✅ Remove inline arrays: `uw_fields`, `property_fields`, `contact_fields` (partially done)
4. ✅ Field resolution always from `field_configurations` (already done)
5. Force card type editor to NOT allow editing inline fields

**Effort:** LOW (just finish what's started)
**Risk:** LOW (backwards compatible already)
**Timeline:** 1 session

**Result:**
- Card types become lightweight configuration objects
- All field metadata comes from field_configurations
- Object Manager changes automatically reflected on deals
- No deal creation flow changes required

---

## Option 2: Asset Class + Capital Side = Deal Type

### Replace Card Types with Derived Logic

**Concept:**
- Deal type = asset_class + capital_side
- Layout determined by mapping table: `{asset_class, capital_side} → layout_config`
- Remove explicit "card type" selection from UI

**Implementation:**
1. Create `deal_type_mappings` table:
   ```
   asset_class: enum (sfr, commercial, etc.)
   capital_side: enum (debt, equity)
   layout_id: FK → layout_templates
   metrics_id: FK → metrics_templates
   ```

2. Remove `unified_card_types` table

3. Add indices:
   ```
   ALTER TABLE unified_deals
   DROP COLUMN card_type_id,
   ADD CONSTRAINT uk_asset_capital UNIQUE(asset_class, capital_side);
   ```

4. Update deal creation:
   ```typescript
   // Before
   const result = await createDeal({card_type_id, ...})

   // After
   const result = await createDeal({asset_class, capital_side, ...})
   // Layout resolved automatically
   ```

5. Update DealDetailPage:
   ```typescript
   // Before
   const cardType = await fetchCardType(deal.card_type_id)

   // After
   const layout = await fetchLayoutMapping(deal.asset_class, deal.capital_side)
   ```

**Effort:** HIGH (15-20 files affected)
**Risk:** MEDIUM (changes deal creation flow)
**Timeline:** 2-3 sessions
**Benefit:** Eliminates "card type" as a concept, simpler mental model

**Files to change:**
- `NewDealDialog.tsx` - Remove card type selector, ask for asset class + capital side instead
- `createUnifiedDealAction` - Accept asset_class/capital_side, derive layout
- `DealDetailPage.tsx` - Fetch layout by asset_class/capital_side
- `PipelineView.tsx` - No longer fetch card types
- Remove: `card-types/` entire folder
- Database: New table, migration, FK changes

---

## Option 3: Inline All Configurations

### Move Card Type Logic into Page Components

**Concept:**
- No card types table
- Layout, fields, outputs defined in JSON files or constants
- Each page imports its own configuration

**Implementation:**
```
configs/
  deal-layouts/
    sfr-debt.json (fields, tabs, outputs, metrics)
    commercial-equity.json
    ...

DealDetailPage.tsx
  const layout = importLayout({asset_class, capital_side})
  const resolved = useResolvedCardType(layout, context)
```

**Effort:** MEDIUM (consolidation work)
**Risk:** HIGH (versioning, GitOps complexity)
**Timeline:** 1-2 sessions + ongoing ops burden
**Benefit:** All config in code, easy version control

**Downside:** Less flexible, requires code changes for layout adjustments

---

## Option 4: Centralize in Database, Eliminate Card Types Table

### Use `page_layouts` Instead of Card Types

**Concept:**
- Rename `unified_card_types` to `page_layouts` (or `deal_templates`)
- Store same data but deemphasize "type selection" in UI
- Deal creation defaults layout based on asset_class + capital_side
- Users can override if needed

**Implementation:**
```
ALTER TABLE unified_card_types RENAME TO page_layouts;
ALTER TABLE unified_deals
  RENAME COLUMN card_type_id TO page_layout_id;

UPDATE unified_deals SET page_layout_id = (
  SELECT id FROM page_layouts
  WHERE applicable_asset_classes @> ARRAY[deals.asset_class]
  LIMIT 1
) WHERE page_layout_id IS NULL;
```

**Effort:** LOW (mostly renaming)
**Risk:** LOW (conceptual only, structure unchanged)
**Timeline:** 1 session
**Benefit:** Same system, better naming (layout ≠ type)

---

## Detailed Feasibility: Option 2 (Most Likely)

### Phase 1: Create Mapping System (Session 1-2)

```sql
-- New table
CREATE TABLE deal_type_configurations (
  id UUID PRIMARY KEY,
  asset_class VARCHAR NOT NULL,
  capital_side VARCHAR NOT NULL,
  -- Layout columns (migrate from card types)
  detail_tabs TEXT[] NOT NULL,
  detail_field_groups JSONB NOT NULL,
  property_field_groups JSONB NOT NULL,
  contact_field_groups JSONB NOT NULL,
  contact_roles TEXT[] NOT NULL,
  applicable_asset_classes TEXT[] NULL,
  -- Metrics/outputs
  uw_outputs JSONB NOT NULL,
  card_metrics JSONB NOT NULL,
  uw_grid JSONB NULL,
  -- Status
  status VARCHAR NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(asset_class, capital_side)
);

-- Migrate data
INSERT INTO deal_type_configurations (
  asset_class, capital_side, detail_tabs, ...
)
SELECT
  CASE WHEN applicable_asset_classes @> ARRAY['sfr'] THEN 'sfr'
       WHEN applicable_asset_classes @> ARRAY['commercial'] THEN 'commercial'
       ELSE 'mixed' END,
  capital_side,
  detail_tabs,
  ...
FROM unified_card_types;
```

**Changes:**
- New table: `deal_type_configurations`
- Lookup: `{asset_class, capital_side} → layout`
- Update field_refs columns to reference this table

### Phase 2: Update Deal Creation (Session 2-3)

**Before:**
```typescript
// NewDealDialog
const { cardType } = selectedCardType
await createUnifiedDealAction({
  name,
  card_type_id: cardType.id,
  asset_class: formData.asset_class,
  capital_side: formData.capital_side,
  ...
})
```

**After:**
```typescript
// NewDealDialog
await createUnifiedDealAction({
  name,
  asset_class: formData.asset_class,
  capital_side: formData.capital_side,
  // card_type_id auto-derived in action
  ...
})
```

**Changes:**
- `NewDealDialog.tsx` - Remove CardTypeSelector, add AssetClassSelector + CapitalSideSelector
- `createUnifiedDealAction()` - Accept asset_class/capital_side, derive layout_id
- `unified_deals` - Replace `card_type_id` with `layout_id` (or keep both for historical reference)

### Phase 3: Update Deal Detail Page (Session 3)

**Before:**
```typescript
const deal = await fetchDeal(dealId)
const cardType = await fetchCardType(deal.card_type_id)
const resolved = useResolvedCardType(cardType, context)
```

**After:**
```typescript
const deal = await fetchDeal(dealId)
const layout = await fetchLayoutConfig({
  asset_class: deal.asset_class,
  capital_side: deal.capital_side
})
const resolved = resolveLayoutFields(layout, context)
```

**Changes:**
- `DealDetailPage.tsx` - Fetch layout by asset_class/capital_side instead of ID
- `useResolvedCardType()` - Rename to `useResolvedLayout()` (optional)
- No changes to child components (they still receive resolved field arrays)

### Phase 4: Remove Card Type Admin (Session 4)

**Delete:**
- `/control-center/card-types/` folder entirely
- `unified_card_types` table (after data migration)
- References to card type IDs from pipeline tables

**Create:**
- `/control-center/layout-config/` with new UI for managing deal_type_configurations

---

## Migration Checklist (Option 2)

### Pre-Flight Checks
- [ ] Back up `unified_card_types` data
- [ ] Back up `unified_deals` (all 5000+ rows)
- [ ] Identify all card types in production (count, list by asset class)
- [ ] Run through deal creation flow on staging
- [ ] Run through deal detail page on staging

### Database Changes
- [ ] Create `deal_type_configurations` table
- [ ] Migrate data from `unified_card_types`
- [ ] Add `layout_id` column to `unified_deals`
- [ ] Backfill `unified_deals.layout_id` from `card_type_id` via mapping
- [ ] Test: Can fetch deal + resolve layout
- [ ] Create migration SQL file

### Code Changes
- [ ] Update type definitions (UnifiedCardType → LayoutConfig or keep both)
- [ ] Update `NewDealDialog.tsx`
- [ ] Update `createUnifiedDealAction()` server action
- [ ] Update `DealDetailPage.tsx` fetching logic
- [ ] Update `useResolvedCardType()` or create new hook
- [ ] Remove: Card type selector UI components
- [ ] Remove: Card type admin pages
- [ ] Update all imports and references

### Testing
- [ ] Create new deal with asset_class + capital_side → layout auto-selected
- [ ] Deal detail page loads correctly with resolved fields
- [ ] All tabs render: Overview, UW, Property, Contacts
- [ ] Field visibility conditions work (asset_class + loan_type filters)
- [ ] Edit fields, values saved
- [ ] Object Manager field changes reflected in resolved layout
- [ ] Stage gating still works (may reference layout_id instead of card_type_id)
- [ ] Intake pipeline still works

### Rollback Plan
- Keep `unified_card_types` table (rename to `card_types_archive`)
- Keep `unified_deals.card_type_id` column (mark as deprecated)
- Can reverse if critical issues found

---

## Risk Assessment

### Option 1 (Hybrid - Keep Card Types, Eliminate Inline Fields)
| Risk | Level | Mitigation |
|------|-------|-----------|
| Backward compat | Low | Field refs already support fallback |
| Implementation | Low | Already 80% done |
| Testing | Low | No deal creation flow changes |
| Rollout | Low | Gradual, no cutover required |

### Option 2 (Replace with Asset Class + Capital Side Mapping)
| Risk | Level | Mitigation |
|------|-------|-----------|
| Deal creation flow | Medium | User testing before rollout |
| Data migration | Medium | Thorough backfill, validation |
| Historical records | Medium | Keep card_type_id column (read-only) |
| Admin retraining | Low | Simpler UI (just config mapping) |
| Integration impacts | Medium | Audit all references (15+ files) |

### Option 3 (Inline Config)
| Risk | Level | Mitigation |
|------|-------|-----------|
| Versioning | High | Requires code review for layout changes |
| Drift | High | Easy to inconsistency between code versions |
| Runtime changes | High | Can't adjust without deployment |
| Team adoption | Medium | Different from current patterns |

### Option 4 (Rename to `page_layouts`)
| Risk | Level | Mitigation |
|------|-------|-----------|
| Minimal | Low | Pure refactor, no logic changes |
| User confusion | Low | Naming clarification |
| Migration | Low | Simple rename operations |

---

## Recommendation

### Go with **Option 1 (Hybrid)** for immediate relief

**Why:**
- Lowest risk
- Already 80% implemented
- No deal creation flow changes
- No data migration required
- Can be done in 1 session

**Then consider Option 2 for future simplification**

**Why Option 2 later:**
- Simplifies deal creation (ask for asset_class + capital_side instead of choosing from list)
- Makes "deal type" a derived concept, not a selection
- Eliminates admin overhead of managing card type list
- Can be migrated gradually (keep old system in parallel for 1-2 months)

---

## Recommended Action

1. **Immediate (Week 1):** Complete Option 1
   - Remove inline field arrays from card type editor
   - Force all field lookups through field_configurations
   - Test: Object Manager changes reflect immediately on deals
   - Effort: 4-6 hours

2. **Future (Month 2-3):** Plan Option 2
   - Create deal_type_configurations table
   - Migrate card type data
   - Update deal creation flow
   - Effort: 3-4 sessions + testing

3. **Post-Option-2:** Keep card types for historical reference only
   - Rename table to `card_types_archive`
   - Stop creating new card types
   - Keep `unified_deals.card_type_id` as read-only audit column

---

**Document Status:** Draft - Ready for Architecture Review
**Next Step:** Approve Option 1, schedule work, plan Option 2
