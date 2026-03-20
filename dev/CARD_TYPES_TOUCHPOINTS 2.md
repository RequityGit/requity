# Card Types - Complete Touchpoint Index

Quick reference for every file that touches `unified_card_types`, `UnifiedCardType`, or card type concepts.

---

## CRITICAL SYSTEM FILES

### Type Definitions
```
apps/requity-os/components/pipeline-v2/pipeline-types.ts
├─ Defines: UnifiedCardType, UnifiedDeal, CardTypeFieldRef, UwFieldDef, all types
├─ Status: Foundation of entire system
└─ Impact: HIGH - Any type changes require updates here
```

### Resolution Engines (Core Logic)
```
apps/requity-os/hooks/useResolvedCardType.ts
├─ Fetches field_configurations for uw_deal, uw_property, uw_borrower
├─ Resolves field_refs to concrete UwFieldDef arrays
├─ Caches for 5 minutes
├─ Filters by visibility_condition if context provided
└─ Impact: CRITICAL - Called in DealDetailPage parent

apps/requity-os/lib/pipeline/resolve-card-type-fields.ts
├─ Helper: resolveCardTypeFields(refs, configMap, fallback?, context?)
├─ Handles field lookup and filtering
└─ Impact: HIGH - Core resolution logic

apps/requity-os/lib/visibility-engine.ts
├─ Helper: isVisible(condition, context)
├─ Evaluates: asset_class + loan_type conditions
└─ Impact: MEDIUM - Visibility evaluation
```

---

## PIPELINE COMPONENTS (UI Layer)

### Deal List/View
```
apps/requity-os/components/pipeline-v2/PipelineView.tsx
├─ Fetches unified_card_types for NewDealDialog
├─ Passes cardTypes[] prop
└─ Impact: LOW - Pass-through

apps/requity-os/components/pipeline-v2/PipelineTable.tsx
├─ Displays deals with card type info
├─ Uses: CARD_TYPE_SHORT_LABELS map
└─ Impact: LOW - Display only

apps/requity-os/components/pipeline-v2/PipelineKanban.tsx
├─ Kanban board of deals
├─ Uses card type for rendering
└─ Impact: LOW - Display only
```

### Deal Creation
```
apps/requity-os/components/pipeline-v2/NewDealDialog.tsx
├─ Receives: cardTypes[] prop
├─ CardTypeSelector UI component
├─ Calls: createUnifiedDealAction(cardTypeId, ...)
├─ Supports: Document extraction + UW data pre-fill
└─ Impact: HIGH - Card type REQUIRED for deal creation

apps/requity-os/components/pipeline-v2/NewDealSheet.tsx
├─ Variant of NewDealDialog
└─ Impact: LOW - Wrapper

apps/requity-os/components/pipeline-v2/CardTypeSelector.tsx
├─ UI component to select from cardTypes[]
├─ Displays: label, description, card_icon, capital_side
└─ Impact: LOW - UI component
```

### Deal Display
```
apps/requity-os/components/pipeline-v2/DealCard.tsx
├─ Kanban card display
├─ Uses: cardType for icon/label
└─ Impact: LOW - Display only

apps/requity-os/components/pipeline-v2/DealDrawer.tsx
├─ Receives: cardType prop (from parent)
├─ Displays: tabs, deal info, notes
└─ Impact: LOW - Presentation
```

### Deal Detail - Tabs (MAIN DEAL EDITING)
```
apps/requity-os/app/(authenticated)/admin/pipeline-v2/[id]/DealDetailPage.tsx
├─ CRITICAL: Calls useResolvedCardType() here (once)
├─ Passes resolved cardType to all tabs
├─ Constructs visibilityContext from deal.asset_class + deal.loan_type
├─ Manages tabs: Overview, Underwriting, Property, Contacts, Conditions, Docs, Financials, Tasks, Activity
└─ Impact: CRITICAL - Resolution point, parent provider

apps/requity-os/components/pipeline-v2/EditableOverview.tsx
├─ Receives: resolved cardType from parent
├─ Uses: cardType.detail_field_groups for section layout
├─ Displays: deal name, amount, assigned_to, expected_close_date, etc.
└─ Impact: MEDIUM - Uses resolved fields

apps/requity-os/components/pipeline-v2/UnderwritingPanel.tsx
├─ Receives: resolved cardType from parent
├─ Uses: cardType.uw_fields (already resolved)
├─ Groups by field.object (deal, property, borrower)
├─ Displays: UW field inputs + computed outputs
├─ Action: updateUwDataAction(dealId, key, value)
└─ Impact: MEDIUM - Core UW data editing

apps/requity-os/components/pipeline-v2/tabs/PropertyTab.tsx
├─ Receives: resolved cardType from parent
├─ Uses: cardType.property_fields + cardType.property_field_groups
├─ Displays: property-specific fields
└─ Impact: MEDIUM - Property field rendering

apps/requity-os/components/pipeline-v2/tabs/ContactsTab.tsx
├─ Receives: resolved cardType from parent
├─ Uses: cardType.contact_fields + cardType.contact_field_groups + cardType.contact_roles
├─ Displays: contact/borrower fields per role
└─ Impact: MEDIUM - Contact field rendering

apps/requity-os/components/pipeline-v2/tabs/FinancialsTab.tsx
├─ Specialized UW table (not field-driven)
├─ Does NOT use field_configurations
└─ Impact: LOW - Separate domain

apps/requity-os/components/pipeline-v2/tabs/CommercialUnderwritingTab.tsx
├─ Specialized UW table (not field-driven)
├─ Does NOT use field_configurations
└─ Impact: LOW - Separate domain
```

### Other Deal Components
```
apps/requity-os/components/pipeline-v2/IntakeReviewSheet.tsx
├─ Intake review before deal creation
├─ May reference card type
└─ Impact: LOW

apps/requity-os/components/pipeline-v2/IntakeQueue.tsx
├─ Shows suggested_card_type_id from email_intake_queue
└─ Impact: LOW

apps/requity-os/components/pipeline-v2/GridProForma.tsx
├─ Renders grid template from cardType.uw_grid
├─ Evaluates formulas on cell overrides
└─ Impact: MEDIUM - Grid rendering
```

---

## ADMIN PAGES

### Card Type Management
```
apps/requity-os/app/(authenticated)/control-center/card-types/page.tsx
├─ Lists all card types
├─ Fetches from unified_card_types
└─ Impact: MEDIUM - Admin UI

apps/requity-os/app/(authenticated)/control-center/card-types/CardTypeManagerView.tsx
├─ Card type editor UI (full)
├─ Edit metadata: label, slug, capital_side, category, description, status
├─ Edit field arrays: uw_field_refs, property_field_refs, contact_field_refs
├─ Edit outputs: uw_outputs[]
├─ Edit grid: uw_grid (rows with formulas)
├─ Edit metrics: card_metrics[]
├─ Edit layout: detail_field_groups, property_field_groups, contact_field_groups
├─ Edit roles: contact_roles
├─ Recent change: Clears inline arrays (uw_fields, property_fields, contact_fields) when refs exist
└─ Impact: HIGH - Card type editor, recent changes to enforce resolution

apps/requity-os/app/(authenticated)/control-center/card-types/actions.ts
├─ Server actions:
│  ├─ fetchCardTypes() - Fetch all
│  ├─ createCardType(input) - Create new
│  ├─ duplicateCardType(sourceId) - Clone from template
│  ├─ saveCardType(cardType) - Update
│  ├─ archiveCardType(id) - Soft delete
│  ├─ deleteCardType(id) - Hard delete
│  └─ fetchUwFieldConfigs() - For field config reference system
├─ Revalidates: /control-center/card-types, /admin/pipeline-v2
└─ Impact: HIGH - Card type CRUD
```

### Pipeline Stage Configuration
```
apps/requity-os/app/(authenticated)/control-center/pipeline-stage-config/_components/pipeline-stage-config.tsx
├─ Stage progression rules
├─ Fields can reference: card_type_id, asset_class, amount, uw:* fields
├─ Stage rules stored in unified_stage_rules table
└─ Impact: MEDIUM - Stage gating may use card type context

apps/requity-os/app/(authenticated)/control-center/pipeline-stage-config/actions.ts
├─ CRUD for stage configs and rules
├─ Uses: unified_stage_configs, unified_stage_rules
└─ Impact: LOW - Separate subsystem
```

### Object Manager (Field Configuration - NOT Card Types)
```
apps/requity-os/app/(authenticated)/control-center/object-manager/page.tsx
├─ Main Object Manager page
└─ Impact: MEDIUM (indirect) - Changes to field_configurations trigger pipeline revalidation

apps/requity-os/app/(authenticated)/control-center/object-manager/actions.ts
├─ Field configuration CRUD (field_configurations table)
├─ Recently added: revalidatePath(/admin/pipeline-v2) and pipeline routes
├─ Calls: invalidateUwFieldConfigCache() on publish
└─ Impact: MEDIUM - Invalidation affects field resolution

apps/requity-os/app/(authenticated)/control-center/object-manager/ObjectManagerView.tsx
├─ UI for field configuration editor
└─ Impact: LOW - Wrapper

apps/requity-os/app/(authenticated)/control-center/object-manager/_components/*.tsx (15+ files)
├─ Field config UI components
└─ Impact: LOW - UI layer
```

### Pipeline Admin (Old Path, Still Used)
```
apps/requity-os/app/(authenticated)/admin/pipeline-v2/page.tsx
├─ Pipeline list page
├─ Fetches unified_stage_configs (not card types directly)
├─ Loads deals with joined card_type_id
└─ Impact: LOW

apps/requity-os/app/(authenticated)/admin/pipeline-v2/[id]/page.tsx
├─ Wrapper for DealDetailPage
├─ Fetches deal + card type
├─ Passes to DealDetailPage
└─ Impact: LOW - Router

apps/requity-os/app/(authenticated)/admin/pipeline-v2/[id]/DealDetailPage.tsx
├─ (See Pipeline Components section above)
└─ Impact: CRITICAL

apps/requity-os/app/(authenticated)/admin/pipeline-v2/actions.ts
├─ Server actions:
│  ├─ createUnifiedDealAction(data) - Card type REQUIRED
│  ├─ updateUwDataAction(dealId, key, value) - Update UW field
│  ├─ advanceStageAction(dealId, stage) - Move stage
│  ├─ addDealNoteAction(dealId, note) - Add note
│  └─ ... others
├─ Revalidates: /admin/pipeline-v2, /admin/pipeline
└─ Impact: HIGH - Deal CRUD

apps/requity-os/app/(authenticated)/admin/pipeline-v2/[id]/actions.ts
├─ Additional detail page actions
└─ Impact: LOW
```

---

## API ROUTES

### Intake Pipeline
```
apps/requity-os/app/api/intake/webhook/route.ts
├─ Email webhook receiver
├─ Fetches unified_card_types to suggest a type
├─ Stores suggested_card_type_id in email_intake_queue
└─ Impact: MEDIUM - Suggests card type

apps/requity-os/app/api/intake/process/route.ts
├─ Processes email intake item
├─ Fetches unified_card_types for extraction
├─ Applies card-type-specific field extraction logic
├─ Creates unified_deals with card_type_id
└─ Impact: MEDIUM - Uses card type for extraction
```

### Document Processing
```
apps/requity-os/app/api/deals/extract-from-document/route.ts
├─ AI document extraction
├─ Fetches unified_card_types to determine applicable fields
├─ Guides extraction based on card type field definitions
└─ Impact: MEDIUM - Field definition discovery
```

---

## DATABASE OPERATIONS & MIGRATIONS

### Supabase Types
```
packages/db/supabase/types.ts
├─ Auto-generated database types
├─ Includes: unified_card_types Row, Insert, Update types
└─ Impact: LOW - Auto-generated, regenerate after schema changes
```

### Key Migrations
```
packages/db/supabase/migrations/20260311300000_migrate_card_type_field_refs.sql
├─ Purpose: Populate uw_field_refs, property_field_refs, contact_field_refs
├─ From: Inline uw_fields, property_fields, contact_fields
├─ Process: Find matching field_configurations records
├─ Impact: HIGH - Completed, enforces ref-based system

packages/db/supabase/migrations/20260309300001_add_card_type_field_refs.sql
├─ Adds the *_field_refs columns
└─ Impact: HIGH - Schema change

packages/db/supabase/migrations/20260308400003_add_property_contact_fields_to_card_types.sql
├─ Adds property_fields, contact_fields, property_field_groups, etc.
└─ Impact: HIGH - Schema foundation

packages/db/supabase/migrations/20260308600000_add_object_bindings_to_uw_fields.sql
├─ Adds 'object' field to UW field defs
└─ Impact: MEDIUM - Object binding feature

packages/db/supabase/migrations/20260309000000_update_uw_output_formulas.sql
├─ Updates formula syntax in uw_outputs
└─ Impact: MEDIUM - Utility

packages/db/supabase/migrations/20260309100000_add_grid_proforma_columns.sql
├─ Extends uw_grid schema
└─ Impact: LOW - Grid enhancement

packages/db/supabase/migrations/20260310200000_add_closing_date_to_deal_summary.sql
├─ Updates unified_card_types with new grid rows
└─ Impact: LOW - Data update

packages/db/supabase/migrations/20260308300000_unified_deal_conditions.sql
├─ RPC generate_deal_conditions uses card type to select templates
├─ SQL references: unified_card_types JOIN unified_deals
└─ Impact: MEDIUM - Condition generation

packages/db/supabase/migrations/20260308500001_create_unified_stage_rules.sql
├─ Creates unified_stage_rules + unified_stage_configs
├─ Rules can reference card_type_id
└─ Impact: MEDIUM - Stage gating
```

---

## SUPPORTING LIBRARIES

### Field Mapping
```
apps/requity-os/lib/pipeline/uw-field-mappings.ts
├─ Maps field keys to display labels
├─ Used by: Extraction, validation
└─ Impact: LOW - Reference data

apps/requity-os/lib/pipeline/validate-stage-advancement.ts
├─ Validates deal eligibility for stage advance
├─ Fetches unified_stage_configs for stage
├─ Rules can reference card_type_id
└─ Impact: MEDIUM - Stage validation
```

### Intake Types
```
apps/requity-os/lib/intake/types.ts
├─ Intake-related type definitions
├─ Field mappings for extraction
└─ Impact: LOW - Type definitions
```

---

## CACHING & INVALIDATION

### Client-Side Caches (5-minute TTL)
```
useResolvedCardType.ts
├─ Cache: uwFieldConfigCache (field_configurations fetches)
├─ Invalidation: invalidateUwFieldConfigCache()
└─ Called by: Object Manager publish action

useFieldConfigurations.ts
├─ Cache: moduleCache (per-module field_configurations)
├─ Invalidation: invalidateFieldConfigCache(module?)
└─ Called by: Object Manager publish action
```

### Server-Side Invalidation
```
apps/requity-os/app/(authenticated)/control-center/card-types/actions.ts
├─ revalidatePath("/control-center/card-types")
├─ revalidatePath("/admin/pipeline-v2")
└─ On: Create, update, delete, archive card type

apps/requity-os/app/(authenticated)/control-center/object-manager/actions.ts
├─ revalidatePath("/admin/pipeline-v2")
├─ revalidatePath("/admin/pipeline")
├─ Calls: invalidateUwFieldConfigCache()
└─ On: Publish changes to field_configurations

apps/requity-os/app/(authenticated)/admin/pipeline-v2/actions.ts
├─ revalidatePath("/admin/pipeline-v2")
├─ revalidatePath("/admin/pipeline")
└─ On: Deal CRUD operations
```

---

## CONFIGURATION CONSTANTS

```
apps/requity-os/components/pipeline-v2/pipeline-types.ts
├─ STAGES: lead, analysis, negotiation, execution, closed
├─ ASSET_CLASS_LABELS: sfr, duplex_fourplex, multifamily, mhc, commercial, etc.
├─ CARD_TYPE_SHORT_LABELS: Maps card type IDs to display labels
├─ CAPITAL_SIDE_COLORS: Styling for debt/equity
├─ ASSET_CLASS_COLORS: (if defined)
└─ Impact: LOW - Display constants

apps/requity-os/lib/visibility-engine.ts
├─ ASSET_CLASSES: Residential, Commercial
├─ LOAN_TYPES: Bridge, DSCR, Perm, Construction, Equity
├─ AXIS_COMBINATIONS: All 8 possible combinations
├─ RESIDENTIAL_CLASSES: Maps db enums to visibility axis
└─ Impact: MEDIUM - Visibility configuration
```

---

## FEATURE FLAGS / EXPERIMENTAL

None explicitly related to card types in current codebase.

---

## DEPENDENCY GRAPH

```
unified_card_types (table)
    ├─ unified_deals.card_type_id (FK, NOT NULL)
    │   ├─ All pipeline components
    │   ├─ Deal detail pages
    │   └─ Admin operations
    │
    ├─ email_intake_queue.suggested_card_type_id (FK, nullable)
    │   └─ Intake processing
    │
    ├─ field_configurations
    │   ├─ (via uw_field_refs/property_field_refs/contact_field_refs)
    │   ├─ useResolvedCardType hook
    │   ├─ useFieldConfigurations hook
    │   └─ Visibility engine
    │
    └─ loan_condition_templates (indirect via RPC)
        └─ generate_deal_conditions
```

---

## CHANGE IMPACT ASSESSMENT

### If `unified_card_types` table schema changes:
- Regenerate: `packages/db/supabase/types.ts` (run `npx supabase gen types`)
- Update: All TypeScript files that import UnifiedCardType
- Test: Card type creation, deal creation, field resolution
- Migrate: Existing card type data

### If `unified_card_types` is removed/replaced:
- **CRITICAL:** `unified_deals.card_type_id` FK must be removed or replaced
- **CRITICAL:** `NewDealDialog` must not require card type selection
- **CRITICAL:** `DealDetailPage` must determine layout/fields without card type
- **HIGH:** All card type management UI must be replaced
- **HIGH:** Field resolution must come from somewhere else (table, config file, etc.)
- **MEDIUM:** Intake process must not suggest card type
- **MEDIUM:** Stage rules that reference card_type_id must be updated

### Safest migration path:
1. Keep card types as configuration entities
2. Remove inline field arrays (uw_fields, property_fields, contact_fields)
3. Force all field lookups through field_configurations
4. Simplify card type editor to only manage references
5. Keep deal.card_type_id for audit trail and historical reference

---

**Last updated:** 2026-03-12
**Status:** Complete touchpoint mapping
