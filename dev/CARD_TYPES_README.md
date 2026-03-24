# Card Types System - Research Documentation

**Research Date:** 2026-03-12
**Scope:** Full codebase analysis of `unified_card_types` usage
**Status:** Complete - Ready for Architecture Review

---

## Quick Start

Start here based on your question:

**"What is the card types system?"**
→ Read: `CARD_TYPES_RESEARCH.md` sections 1-6

**"What code do I need to change?"**
→ Read: `CARD_TYPES_TOUCHPOINTS.md` (organized by file category)

**"How do I remove or replace card types?"**
→ Read: `CARD_TYPES_REMOVAL_STRATEGY.md`

---

## Three-Document Architecture

### 1. CARD_TYPES_RESEARCH.md (29 KB, 641 lines)

**Comprehensive system documentation**

**Sections:**
1. Executive summary
2. Database schema & relationships
3. Core hooks & resolution engines
4. Field resolution & visibility engine
5. Components using card types
6. API routes & server actions
7. Database schema - deal/card type interaction
8. Related tables
9. Pipeline stages & stage gating
10. Migration history - field refs system
11. Visibility system
12. File organization by type of change
13. Entry points for card type lookups
14. Testing requirements for removal
15. Recommendations for removal/replacement
16. Complete file reference list
17. Summary table

**Best for:**
- Understanding the full system
- Architecture decisions
- Impact analysis
- Testing planning

### 2. CARD_TYPES_TOUCHPOINTS.md (17 KB, 484 lines)

**Quick reference for every file that touches card types**

**Organization:**
- Critical system files (types, hooks, engines)
- Pipeline components (UI layer)
- Admin pages (configuration)
- API routes (backends)
- Database operations & migrations
- Supporting libraries
- Caching & invalidation
- Configuration constants
- Dependency graph
- Change impact assessment

**Format:**
```
File path
├─ What it does / imports / uses
├─ Key functions/components
└─ Impact level: LOW/MEDIUM/HIGH
```

**Best for:**
- Finding which files to change
- Understanding dependencies
- Planning refactoring scope
- Identifying risks

### 3. CARD_TYPES_REMOVAL_STRATEGY.md (13 KB, 416 lines)

**Concrete plans for removal/replacement**

**Sections:**
1. Why remove card types (pros/cons)
2. Option 1: Hybrid approach (RECOMMENDED)
3. Option 2: Asset class + capital side mapping
4. Option 3: Inline configuration
5. Option 4: Rename to page_layouts
6. Detailed feasibility (Option 2)
7. Phase-by-phase implementation
8. Migration checklist
9. Risk assessment
10. Recommendation with timeline

**Formats:**
- Decision matrices
- SQL examples
- Before/after code comparisons
- Checklist tables

**Best for:**
- Planning removals or refactoring
- Risk analysis
- Timeline estimation
- Getting stakeholder approval

---

## Key Insights from Research

### Current Architecture

```
Database Layer:
  unified_card_types (configuration table)
    ├─ Stores references: uw_field_refs, property_field_refs, contact_field_refs
    ├─ Stores layout: detail_tabs, detail_field_groups, contact_roles
    ├─ Stores outputs: uw_outputs, card_metrics, uw_grid
    └─ FK: unified_deals.card_type_id (NOT NULL)

Resolution Layer:
  useResolvedCardType() hook
    ├─ Input: cardType + visibilityContext
    ├─ Fetches: field_configurations for 3 modules (uw_deal, uw_property, uw_borrower)
    ├─ Caches: 5-minute TTL
    └─ Output: Fully resolved cardType with inline field arrays populated

UI Layer:
  DealDetailPage (parent)
    ├─ Calls: useResolvedCardType() once
    ├─ Passes resolved cardType to all tabs
    └─ Tabs: EditableOverview, UnderwritingPanel, PropertyTab, ContactsTab, etc.
```

### Critical Stats

- **Files directly affected:** 17+
- **API routes/migrations:** 8+
- **Lines of code:** 5000+
- **Database columns:** 25+ on unified_card_types
- **Migration files:** 8+ reference card types
- **Hooks:** 2 (useResolvedCardType, useFieldConfigurations)
- **Cache invalidation points:** 3 (Object Manager, card type CRUD, field config changes)

### Recent Progress (Completed)

✅ Field refs system (uw_field_refs, property_field_refs, contact_field_refs)
✅ Runtime field resolution (useResolvedCardType hook)
✅ Object Manager integration (pipeline page revalidation on publish)
✅ Inline field array clearing (when refs exist)
✅ Single resolution point (DealDetailPage parent, not per-child)

### What's Not Done

❌ Complete removal of inline arrays from card type editor
❌ Option 2 migration (asset_class + capital_side mapping)
❌ Replacement of card type selection UI with derived logic

---

## How the System Works

### Deal Creation Flow

```
User selects "Create Deal"
    ↓
NewDealDialog shows CardTypeSelector
    ↓
User picks card type (e.g., "DSCR Loan")
    ↓
Form fields populated based on card type
    ↓
createUnifiedDealAction(cardTypeId, asset_class, amount, ...)
    ↓
INSERT unified_deals (card_type_id=..., asset_class=..., ...)
    ↓
RPC generate_deal_conditions() creates conditions from templates
    ↓
Deal created with card_type_id set
```

### Deal Display Flow

```
User opens deal detail page
    ↓
DealDetailPage fetches:
  - unified_deals record
  - unified_card_types record
    ↓
Constructs visibilityContext:
  asset_class: deal.asset_class
  loan_type: deal.loan_type (or derived)
    ↓
Calls useResolvedCardType(cardType, visibilityContext)
    ↓
Hook fetches field_configurations for 3 modules
    ↓
Hook filters by visibility_condition + is_visible + is_archived
    ↓
Returns cardType with populated:
  - uw_fields[]
  - property_fields[]
  - contact_fields[]
    ↓
Passes resolved cardType to all tabs:
  EditableOverview, UnderwritingPanel, PropertyTab, ContactsTab
    ↓
Each tab renders from resolved cardType.{type}_fields
```

### Field Definition Priority

```
field_configurations (DB)
    ↓
    └─ is this field visible? ─ Check visibility_condition against context
    ↓
uw_field_refs (on card type)
    ↓
    └─ which fields apply to this deal type? ─ Reference lookup
    ↓
useResolvedCardType (hook)
    ↓
    └─ populate uw_fields[], property_fields[], contact_fields[]
    ↓
DealDetailPage (receives resolved cardType)
    ↓
    └─ pass to tabs, which render field inputs
```

---

## Decision Points for Removal

### Keep vs. Remove Decision

| Aspect | Keep Card Types | Remove Card Types |
|--------|-----------------|-------------------|
| Deal creation | Explicit type selection | Derived from asset_class + capital_side |
| Complexity | Medium (dual system) | Low (single source of truth) |
| Admin overhead | High (manage card type list) | Low (just config values) |
| Field resolution | From card type context | From deal attributes |
| Layout determination | Per-card-type | Per-asset-capital combination |
| Migration effort | Low (finish what's started) | High (replace creation flow) |
| Risk level | Low | Medium |

### Recommendation

**Hybrid Approach (Option 1):** Keep card types, eliminate inline fields
- Complete in 1 session
- Low risk
- No deal creation flow changes
- Prepares for future Option 2 migration

Then plan **Option 2** for future: Replace card types with asset_class + capital_side mapping
- Simplifies deal creation
- Eliminates admin overhead
- Can be done in 2-3 sessions
- More strategic timing

---

## How to Use These Documents

### For Architecture Review

1. Start with `CARD_TYPES_RESEARCH.md` sections 1-6
2. Review `CARD_TYPES_REMOVAL_STRATEGY.md` recommendation section
3. Discuss Option 1 vs. Option 2 trade-offs
4. Get approval on approach
5. Create task plan based on approved option

### For Implementation Planning

1. Read full `CARD_TYPES_REMOVAL_STRATEGY.md` for chosen option
2. Use `CARD_TYPES_TOUCHPOINTS.md` to identify all files to change
3. Cross-reference with `CARD_TYPES_RESEARCH.md` sections 12-17 for file details
4. Create checklist from migration sections
5. Plan testing from testing requirements section

### For Code Reviews

1. Use `CARD_TYPES_TOUCHPOINTS.md` to verify all related files are changed
2. Check `CARD_TYPES_RESEARCH.md` section 17 (summary table) for impact levels
3. Verify cache invalidation is correct (caching & invalidation section)
4. Check visibility conditions are preserved (visibility engine section)

### For Team Onboarding

1. New engineer: Read `CARD_TYPES_TOUCHPOINTS.md` "Critical System Files"
2. Pipeline engineer: Read `CARD_TYPES_TOUCHPOINTS.md` "Pipeline Components" section
3. Database engineer: Read `CARD_TYPES_RESEARCH.md` sections 2, 7, 8
4. Admin engineer: Read `CARD_TYPES_TOUCHPOINTS.md` "Admin Pages" section

---

## Cross-References Between Documents

### If you find in RESEARCH that you need details on:
- **File names/paths** → Go to TOUCHPOINTS (organized by file location)
- **Change strategy** → Go to REMOVAL_STRATEGY (4 options with details)
- **System overview** → Stay in RESEARCH (comprehensive reference)

### If you find in TOUCHPOINTS that you need:
- **System context** → Go to RESEARCH sections 1-6
- **Full implementation plan** → Go to REMOVAL_STRATEGY (for chosen option)
- **Field resolution details** → Go to RESEARCH section 4

### If you find in REMOVAL_STRATEGY that you need:
- **Current code references** → Go to TOUCHPOINTS (file-by-file)
- **Database schema details** → Go to RESEARCH section 2
- **Hook implementation** → Go to RESEARCH section 3

---

## Search Tips

**In RESEARCH.md:**
- Type definitions: Search "UnifiedCardType"
- Hooks: Search "useResolvedCardType"
- Database: Search "unified_card_types"
- Visibility: Search "visibility_condition"

**In TOUCHPOINTS.md:**
- By impact level: Search "Impact: CRITICAL"
- By file path: Search "apps/requity-os/"
- By system: Search "Pipeline Components" or "Admin Pages"
- By table/operation: Search "createUnifiedDealAction"

**In REMOVAL_STRATEGY.md:**
- By option: Search "Option 1:" / "Option 2:"
- By phase: Search "Phase 1:" / "Phase 2:"
- By risk: Search "Risk Assessment"
- By timeline: Search "Effort:" or "Timeline:"

---

## Document Maintenance

These documents are **research artifacts** (not code). They should be:

- Updated when major architecture changes are made
- Referenced during code reviews (section 17 of RESEARCH)
- Consulted before refactoring card types
- Kept in `/dev/` folder alongside task plans

**When to update:**
- After implementing Option 1 (update "What's Not Done" section)
- After implementing Option 2 (archive all three, create new ones)
- If new files touch card types (add to TOUCHPOINTS)
- If schema changes (update RESEARCH section 2)

---

## Questions This Research Answers

1. **What is a card type?** → RESEARCH section 1
2. **How many files use card types?** → TOUCHPOINTS (complete index)
3. **What happens when I change a field label in Object Manager?** → RESEARCH sections 3-4
4. **How does deal creation work?** → RESEARCH section 6 + TOUCHPOINTS "Deal Creation"
5. **What's the card type resolution process?** → RESEARCH section 4
6. **Can I remove card types?** → REMOVAL_STRATEGY sections 1-5
7. **How long would it take to replace card types?** → REMOVAL_STRATEGY "Detailed Feasibility"
8. **What's the safest way forward?** → REMOVAL_STRATEGY "Recommendation"
9. **Which files would break if I change X?** → TOUCHPOINTS "Dependency Graph"
10. **Where is the field resolution happening?** → RESEARCH section 3 + TOUCHPOINTS "Critical System Files"

---

## Next Steps

1. **Review:** Share these docs with team for architecture review
2. **Approve:** Get consensus on Option 1 (hybrid) vs. Option 2 (full replacement)
3. **Plan:** Create task plan from approved option's "Migration Checklist"
4. **Implement:** Use TOUCHPOINTS as file-by-file change checklist
5. **Test:** Use RESEARCH section 14 (testing requirements) as test plan
6. **Archive:** Move completed research to `/dev/completed/` after implementation

---

**Status:** Research Complete - Ready for Architecture Decision
**Next Reviewer:** Dylan (CEO, final approver)
**Suggested Timeline:** Review now, implement Option 1 in next 1-2 weeks, plan Option 2 for month 2
