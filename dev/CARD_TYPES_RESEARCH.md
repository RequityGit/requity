# Card Types System - Complete Codebase Research

**Date:** 2026-03-12
**Status:** Research Complete
**Scope:** Full understanding of `unified_card_types` usage and removal/replacement strategy

---

## Executive Summary

The `unified_card_types` table is a **configuration table** that defines pipeline deal types (DSCR, RTL, Commercial Equity, etc.). It stores:
1. **Field references** that point to `field_configurations` records
2. **Layout definitions** (tabs, detail_field_groups, contact_roles)
3. **Underwriting grids** (row definitions with formulas)
4. **Metrics definitions** and **output formulas**

The table is **actively used across the platform** and will require careful refactoring. The removal/replacement strategy must account for:
- Pipeline deal creation (card_type_id is the key identifier)
- Admin UI for card type management
- Field visibility resolution at runtime
- Client-side caching of field configurations
- Asset class/loan type visibility conditions

---

## 1. DATABASE SCHEMA & RELATIONSHIPS

### `unified_card_types` Table Structure
Located in: `/sessions/inspiring-wonderful-carson/mnt/requity/packages/db/supabase/types.ts`

**Core columns:**
- `id` (UUID) - Primary key
- `slug` (text) - URL slug, e.g., "res_debt_dscr"
- `label` (text) - Display name, e.g., "DSCR Loan"
- `capital_side` (enum: "debt" | "equity")
- `category` (text) - Grouping category
- `description` (nullable text)
- `uw_model_key` (text) - Links to underwriting model
- `status` (enum: "active" | "draft" | "planned" | "archived")
- `sort_order` (integer) - Sort priority
- `card_icon` (text) - Icon reference, e.g., "building-2"

**Field reference arrays (NEW ARCHITECTURE):**
- `uw_field_refs` (JSONB array) - References to `field_configurations` records
  - Structure: `[{field_key, module, required?, object?, sort_order}, ...]`
  - Module values: `uw_deal`, `uw_property`, `uw_borrower`
- `property_field_refs` (JSONB array) - Property-related field references
  - Module: `uw_property`
- `contact_field_refs` (JSONB array) - Contact/borrower field references
  - Module: `uw_borrower`

**Inline field arrays (LEGACY, being replaced):**
- `uw_fields` (JSONB array) - Cached UW field definitions
- `property_fields` (JSONB array) - Cached property field definitions
- `contact_fields` (JSONB array) - Cached contact field definitions

**Layout/configuration:**
- `detail_tabs` (JSONB array) - Tab names for detail view
- `detail_field_groups` (JSONB array) - Field groupings with labels
- `property_field_groups` (JSONB array)
- `contact_field_groups` (JSONB array)
- `contact_roles` (JSONB array) - E.g., ["borrower", "guarantor", "broker"]
- `applicable_asset_classes` (JSONB array nullable) - Which asset classes apply (null = all)

**Grid/metrics:**
- `uw_grid` (JSONB nullable) - Grid Pro Forma row definitions with formulas
- `uw_outputs` (JSONB array) - UW output metric definitions
- `card_metrics` (JSONB array) - Card-level metrics shown in kanban/table view

### Foreign Key References to `unified_card_types`

**Direct FK relationships:**
1. **`unified_deals.card_type_id`** → `unified_card_types.id`
   - Every deal must have a card type
   - Defines which fields/outputs/grid apply to that deal

2. **`email_intake_queue.suggested_card_type_id`** → `unified_card_types.id` (nullable)
   - Email intake process suggests a card type

**Indirect references:**
- `loan_condition_templates` may reference card types (via `generate_deal_conditions` RPC)
- Pipeline stage configs can have rules that reference `card_type_id` column

---

## 2. CORE HOOKS & RESOLUTION ENGINES

### `useResolvedCardType()` Hook
**File:** `/sessions/inspiring-wonderful-carson/mnt/requity/apps/requity-os/hooks/useResolvedCardType.ts`

**Purpose:** Convert field references to concrete field definitions at runtime

**Inputs:**
- `cardType: UnifiedCardType` - Card type with `*_field_refs` arrays
- `visibilityContext?: VisibilityContext | null` - Asset class + loan type for conditional visibility

**Outputs:**
- Returns the card type with `uw_fields`, `property_fields`, `contact_fields` populated from field_configurations

**Logic:**
1. Checks if refs exist (hasRefs = true if any of uw_field_refs, property_field_refs, contact_field_refs has length > 0)
2. If no refs, returns original card type unchanged (backwards compatibility)
3. Fetches field_configurations for modules: `uw_deal`, `uw_property`, `uw_borrower`
4. Caches result for 5 minutes (shared across component tree)
5. For each ref, looks up the field_configuration record
6. Filters by:
   - `is_archived = false`
   - `is_visible = true`
   - Visibility condition matches context (if provided)
7. Returns resolved card type with inline field arrays populated

**Consumers:**
- `DealDetailPage.tsx` - Called once at parent level
- Was called in `EditableOverview` and `UnderwritingPanel` (now removed to avoid double-fetching)

**Cache invalidation:**
- `invalidateUwFieldConfigCache()` - Clears the 5-min cache (called by Object Manager publish)

### `useFieldConfigurations()` Hook
**File:** `/sessions/inspiring-wonderful-carson/mnt/requity/apps/requity-os/hooks/useFieldConfigurations.ts`

**Purpose:** Load field_configurations for a specific module (not card-type-specific)

**Used by:** CRM pages, loan detail pages, servicing, Object Manager

**Caching:** Per-module, 5-minute TTL

---

## 3. FIELD RESOLUTION & VISIBILITY ENGINE

### `resolve-card-type-fields.ts`
**File:** `/sessions/inspiring-wonderful-carson/mnt/requity/apps/requity-os/lib/pipeline/resolve-card-type-fields.ts`

**Core function:** `resolveCardTypeFields(refs, fieldConfigMap, fallbackFields?, visibilityContext?)`

**Visibility Evaluation:**
- Uses `visibility-engine.ts` to evaluate `field.visibility_condition` against context
- Condition format: `{asset_class?: string[], loan_type?: string[]}`
- AND across axes, OR within each axis (e.g., "Residential AND (DSCR OR Perm)")

### `visibility-engine.ts`
**File:** `/sessions/inspiring-wonderful-carson/mnt/requity/apps/requity-os/lib/visibility-engine.ts`

**Key function:** `isVisible(condition: VisibilityCondition | null, context: VisibilityContext): boolean`

**Visibility axis combinations:**
- Asset classes: `Residential`, `Commercial`
- Loan types: `Bridge`, `DSCR`, `Perm`, `Construction`, `Equity`
- Mapped in `AXIS_COMBINATIONS` constant (8 combinations total)

**Asset class mapping:**
```
Residential: sfr, duplex_fourplex, multifamily, mhc
Commercial: commercial, mixed_use, land, rv_park, campground
```

**How it's used:**
- Object Manager condition matrix UI lets admins define per-field visibility
- At runtime, DealDetailPage passes asset_class/loan_type from deal record
- useResolvedCardType filters fields based on this context

---

## 4. COMPONENTS USING CARD TYPES

### Pipeline Components

#### `PipelineView.tsx`
- Fetches card types for selector in new deal dialog
- Passes available card types to NewDealDialog

#### `NewDealDialog.tsx`
**File:** `/sessions/inspiring-wonderful-carson/mnt/requity/components/pipeline-v2/NewDealDialog.tsx`

**Dependencies:**
- Receives `cardTypes: UnifiedCardType[]` prop
- Uses `CardTypeSelector` to pick one
- Extracts `applicable_asset_classes` from selected card type
- Passes `cardTypeId` to `createUnifiedDealAction`
- Supports document extraction and pre-fill of UW data

**Key methods:**
- `handleSubmit(uwData?)` - Creates deal with card_type_id

#### `CardTypeSelector.tsx`
- UI component to render card type cards in grid
- Displays `label`, `description`, `capital_side`, `card_icon`
- Callback on selection

#### `DealDrawer.tsx` & `DealCard.tsx`
- Display deal info including card type icon/label
- Use `CARD_TYPE_SHORT_LABELS` map for compact display

#### `EditableOverview.tsx`
- Renders deal top-level fields (name, amount, assigned_to, etc.)
- Uses resolved `cardType.detail_field_groups` for layout
- Maps field group sections to display

#### `UnderwritingPanel.tsx`
- Renders UW fields from resolved card type
- Groups by `field.object` (deal, property, borrower)
- Handles field updates via `updateUwDataAction`
- Shows computed outputs from `cardType.uw_outputs`

#### `PropertyTab.tsx`
- Renders property-related fields
- Uses `cardType.property_fields` (now resolved by parent)
- Uses `cardType.property_field_groups` for section layout

#### `ContactsTab.tsx`
- Renders contact/borrower fields
- Uses `cardType.contact_fields` (now resolved by parent)
- Uses `cardType.contact_roles` to match contact role names
- Uses `cardType.contact_field_groups` for layout

#### `DealDetailPage.tsx`
**File:** `/sessions/inspiring-wonderful-carson/mnt/requity/app/(authenticated)/admin/pipeline-v2/[id]/DealDetailPage.tsx`

**Architecture:**
1. Fetches deal from `unified_deals` with `card_type_id`
2. Fetches corresponding `unified_card_types` record
3. Calls `useResolvedCardType(cardType, visibilityContext)` where:
   - `visibilityContext = {asset_class: deal.asset_class, loan_type: deal.loan_type}`
4. Passes resolved card type to all tab components
5. Manages tabs: Overview, Underwriting, Property, Contacts, Conditions, Documents, Financials, Tasks, Activity

**Field resolution occurs here - NOT in child components**

### Admin Pages

#### Card Types Manager
**File:** `/sessions/inspiring-wonderful-carson/mnt/requity/app/(authenticated)/control-center/card-types/page.tsx` & `CardTypeManagerView.tsx`

**Functionality:**
- List all card types
- Create new card type
- Duplicate card type from template
- Edit card type metadata
- Edit inline field arrays (uw_fields, property_fields, contact_fields)
- Edit output definitions
- Edit grid definitions
- Manage card metrics
- Manage detail_field_groups
- Archive/delete card types

**Actions:** `/sessions/inspiring-wonderful-carson/mnt/requity/app/(authenticated)/control-center/card-types/actions.ts`

**Key server actions:**
- `fetchCardTypes()` - Fetch all card types
- `createCardType(input)` - Create new
- `duplicateCardType(sourceId)` - Clone from template
- `saveCardType(cardType)` - Update
- `archiveCardType(id)` - Soft delete
- `deleteCardType(id)` - Hard delete
- `fetchUwFieldConfigs()` - For the config reference system

**Recent change (context.md):**
- When saving, now clears inline arrays (uw_fields, property_fields, contact_fields) if field_refs exist
- Forces runtime resolution instead of using stale cached labels

#### Object Manager
**File:** `/sessions/inspiring-wonderful-carson/mnt/requity/app/(authenticated)/control-center/object-manager/`

**Manages:** `field_configurations` table (not card types directly)

**Interactions with card types:**
- Field changes should invalidate pipeline pages (revalidatePath)
- Publishing field changes calls `invalidateUwFieldConfigCache()`
- Modules managed: uw_deal, uw_property, uw_borrower, + 15+ others (loan_details, company_info, etc.)

---

## 5. API ROUTES & SERVER ACTIONS

### Deal Creation
**File:** `/sessions/inspiring-wonderful-carson/mnt/requity/app/(authenticated)/admin/pipeline-v2/actions.ts`

**`createUnifiedDealAction(data)`:**
```typescript
{
  name: string;
  card_type_id: string;        // REQUIRED - which card type defines this deal
  capital_side?: string;       // Falls back to card type's capital_side if omitted
  asset_class?: string;        // For visibility context
  amount?: number;
  uw_data?: Record<string, unknown>;  // Pre-filled UW data
  // ... other fields
}
```

**Logic:**
1. Inserts into `unified_deals` with `card_type_id`
2. Calls RPC `generate_deal_conditions(p_deal_id)` which:
   - Queries `loan_condition_templates` (may be filtered by card type)
   - Creates `deal_conditions` records

### Intake Pipeline
**Files:**
- `/sessions/inspiring-wonderful-carson/mnt/requity/app/api/intake/process/route.ts`
- `/sessions/inspiring-wonderful-carson/mnt/requity/app/api/intake/webhook/route.ts`

**Card type involvement:**
- Email intake suggests a card type based on email content
- `suggested_card_type_id` stored in `email_intake_queue`
- User can override before creating deal

### Document Extraction
**File:** `/sessions/inspiring-wonderful-carson/mnt/requity/app/api/deals/extract-from-document/route.ts`

**Card type involvement:**
- Fetches card type to get applicable field keys
- Uses field definitions to guide extraction from document
- Maps extracted data to UW field keys

---

## 6. DATABASE SCHEMA - DEAL/CARD TYPE INTERACTION

### `unified_deals` Table
**Key column:**
- `card_type_id` (UUID FK) → `unified_card_types.id` - NOT NULLABLE

**Data storage:**
- `uw_data` (JSONB) - Values stored by field key, e.g., `{loan_amount: 5000000, noi_current: 250000}`
- `property_data` (JSONB) - Property field values
- `asset_class` (enum) - For visibility context evaluation
- `capital_side` (enum) - "debt" or "equity"
- Other columns: name, deal_number, stage, assigned_to, amount, expected_close_date, etc.

### Related Tables
- `deal_conditions` - Conditions generated from templates (may be card-type-specific)
- `deal_tasks` - Deal tasks
- `deal_activity` - Activity log
- `email_intake_queue` - Suggested card type via `suggested_card_type_id`

---

## 7. PIPELINE STAGES & STAGE GATING

**File:** `/sessions/inspiring-wonderful-carson/mnt/requity/apps/requity-os/lib/pipeline/validate-stage-advancement.ts`

**Stage progression:**
- Stages are constants: `lead`, `analysis`, `negotiation`, `execution`, `closed`
- Defined in `pipeline-types.ts` as `STAGES` constant
- NOT stored per card type (global)

**Stage rules:** `/sessions/inspiring-wonderful-carson/mnt/requity/packages/db/supabase/migrations/20260308500001_create_unified_stage_rules.sql`

**Table:** `unified_stage_rules`
- `stage_config_id` (FK → `unified_stage_configs`)
- Rules like: "require loan_amount > 0 to advance to execution"
- Can reference any deal column OR `uw:field_key` for UW data

---

## 8. MIGRATION HISTORY - FIELD REFS SYSTEM

**Key migration:** `/sessions/inspiring-wonderful-carson/mnt/requity/packages/db/supabase/migrations/20260311300000_migrate_card_type_field_refs.sql`

**Purpose:** Populate `*_field_refs` arrays from inline `*_fields` arrays

**Process:**
1. For each inline field definition in `uw_fields`
2. Find matching `field_configurations` record (by field_key + module)
3. Create a reference object: `{field_key, module, required, object, sort_order}`
4. Store in `uw_field_refs`
5. Repeat for `property_fields` → `property_field_refs` and `contact_fields` → `contact_field_refs`

**Backwards compatibility:**
- If a card type has no refs, `useResolvedCardType` falls back to inline fields
- Some card types may have refs for UW but not property/contacts

---

## 9. VISIBILITY SYSTEM

### How visibility conditions are stored
**Column:** `field_configurations.visibility_condition` (JSONB nullable)

**Example:**
```json
{
  "asset_class": ["Residential"],
  "loan_type": ["DSCR", "Perm"]
}
```

**Evaluation:**
- AND between axes (asset_class AND loan_type)
- OR within axis (DSCR OR Perm)

### Visibility condition matrix UI
**File:** `/sessions/inspiring-wonderful-carson/mnt/requity/app/(authenticated)/control-center/object-manager/_components/ConditionMatrixTab.tsx`

**Admin view:**
- 8-cell grid (Res+Commercial × DSCR+Bridge+Perm+etc.)
- Check/uncheck cells to define visibility
- Shows which combinations this field appears in

### Runtime evaluation
Called by `useResolvedCardType` and `useFieldConfigurations` to filter fields

---

## 10. FILE ORGANIZATION BY TYPE OF CHANGE REQUIRED

### Type A: Card Type Definition (Would Need to Change)
- `/sessions/inspiring-wonderful-carson/mnt/requity/apps/requity-os/components/pipeline-v2/pipeline-types.ts`
  - UnifiedCardType interface
  - CardTypeFieldRef interface
  - All related types (UwFieldDef, GridTemplateDef, etc.)

### Type B: Resolution/Hooks (Likely Architecture Change)
- `/sessions/inspiring-wonderful-carson/mnt/requity/apps/requity-os/hooks/useResolvedCardType.ts`
  - Core resolution engine
- `/sessions/inspiring-wonderful-carson/mnt/requity/apps/requity-os/lib/pipeline/resolve-card-type-fields.ts`
  - Field resolution logic

### Type C: Card Type Management UI (Moderate Change)
- `/sessions/inspiring-wonderful-carson/mnt/requity/app/(authenticated)/control-center/card-types/page.tsx`
- `/sessions/inspiring-wonderful-carson/mnt/requity/app/(authenticated)/control-center/card-types/CardTypeManagerView.tsx`
- `/sessions/inspiring-wonderful-carson/mnt/requity/app/(authenticated)/control-center/card-types/actions.ts`

### Type D: Pipeline Components (Receive Card Type as Prop, Minimal Change)
- `/sessions/inspiring-wonderful-carson/mnt/requity/components/pipeline-v2/DealDrawer.tsx`
- `/sessions/inspiring-wonderful-carson/mnt/requity/components/pipeline-v2/DealCard.tsx`
- `/sessions/inspiring-wonderful-carson/mnt/requity/components/pipeline-v2/CardTypeSelector.tsx`
- `/sessions/inspiring-wonderful-carson/mnt/requity/components/pipeline-v2/EditableOverview.tsx`
- `/sessions/inspiring-wonderful-carson/mnt/requity/components/pipeline-v2/UnderwritingPanel.tsx`
- `/sessions/inspiring-wonderful-carson/mnt/requity/components/pipeline-v2/PropertyTab.tsx`
- `/sessions/inspiring-wonderful-carson/mnt/requity/components/pipeline-v2/ContactsTab.tsx`

### Type E: Deal CRUD Operations (Moderate Change)
- `/sessions/inspiring-wonderful-carson/mnt/requity/app/(authenticated)/admin/pipeline-v2/actions.ts`
  - `createUnifiedDealAction` - must pass card_type_id or determine from new system
- `/sessions/inspiring-wonderful-carson/mnt/requity/app/(authenticated)/admin/pipeline-v2/page.tsx`
- `/sessions/inspiring-wonderful-carson/mnt/requity/app/(authenticated)/admin/pipeline-v2/[id]/page.tsx`
- `/sessions/inspiring-wonderful-carson/mnt/requity/app/(authenticated)/admin/pipeline-v2/[id]/DealDetailPage.tsx`

### Type F: API Routes (Moderate Change)
- `/sessions/inspiring-wonderful-carson/mnt/requity/app/api/intake/process/route.ts`
- `/sessions/inspiring-wonderful-carson/mnt/requity/app/api/intake/webhook/route.ts`
- `/sessions/inspiring-wonderful-carson/mnt/requity/app/api/deals/extract-from-document/route.ts`

### Type G: Admin Configuration (Light Touch)
- `/sessions/inspiring-wonderful-carson/mnt/requity/app/(authenticated)/control-center/object-manager/actions.ts`
  - May need to add revalidation paths if card types are removed
- `/sessions/inspiring-wonderful-carson/mnt/requity/app/(authenticated)/control-center/pipeline-stage-config/actions.ts`
  - May reference card_type_id in rules

### Type H: Migrations (Database)
- Many migrations reference or update `unified_card_types` columns
- Field refs migration: `20260311300000_migrate_card_type_field_refs.sql`
- Property/contact fields columns: `20260308400003_add_property_contact_fields_to_card_types.sql`
- Grid columns: `20260309100000_add_grid_proforma_columns.sql`

---

## 11. ENTRY POINTS FOR CARD TYPE LOOKUPS

### Deal Creation Paths
1. **NewDealDialog** → `createUnifiedDealAction(cardTypeId)` → inserts `unified_deals` with FK
2. **Email Intake** → suggests `suggested_card_type_id` → user confirms → creates deal
3. **Manual API** → POST /deals with `card_type_id`

### Deal Display Paths
1. **PipelineView** → fetches deals + card types
2. **DealDetailPage** → fetches deal → fetches card type by ID → resolves fields
3. **DealDrawer** → card type passed as prop from parent

### Batch Operations
1. **Pipeline table/kanban** → fetches deals with card types
2. **Email intake queue** → shows suggested card type

---

## 12. TESTING REQUIREMENTS FOR REMOVAL

If card types were to be removed, these would need testing:

1. **Deal creation without card type selection** - How does the system know what fields to display?
2. **Field visibility** - Without card type context, how are visibility conditions evaluated?
3. **UW data storage** - Is uw_data schema still {field_key: value}? Where does validation come from?
4. **Layout rendering** - Who defines detail_tabs, detail_field_groups, property_field_groups?
5. **Metrics and outputs** - Where are uw_outputs and card_metrics defined?
6. **Grid proforma** - Where are grid row definitions stored per deal type?
7. **Stage gating** - Stage rules may be card-type-specific
8. **Intake extraction** - How does document extraction know which fields to extract?

---

## 13. CURRENT STATUS - OBJECT MANAGER SYNC

**From dev docs (object-manager-sync):**

**Status:** COMPLETE as of 2026-03-12

**Changes made:**
1. Field resolution moved to DealDetailPage parent level (single `useResolvedCardType` call)
2. PropertyTab and ContactsTab now consume resolved card type (not inline fields)
3. EditableOverview and UnderwritingPanel no longer duplicate resolution
4. Card type editor clears inline arrays when refs exist (forces runtime resolution)
5. Object Manager publish now revalidates pipeline pages

**Current architecture:**
```
field_configurations (source of truth)
  ↓
useResolvedCardType (DealDetailPage parent, once)
  ↓
resolved cardType (uw_fields, property_fields, contact_fields hydrated)
  ↓
Child components (EditableOverview, PropertyTab, ContactsTab, UnderwritingPanel)
```

**Cache invalidation:**
- 5-minute TTL on field config cache
- Manual invalidation via `invalidateUwFieldConfigCache()` on Object Manager publish
- Page revalidation via `revalidatePath` (server-side)

---

## 14. RECOMMENDATIONS FOR REMOVAL/REPLACEMENT STRATEGY

### Option 1: Keep card types, reduce complexity
- Continue using card types as configuration
- Just remove inline field arrays (uw_fields, property_fields, contact_fields)
- Force all field lookups through field_configurations
- Simplify card type editor UI

### Option 2: Replace with product/deal-type configuration
- Create new `deal_configurations` or `deal_templates` table
- Store only references to field sets, not field definitions
- Eliminate card type UI entirely
- Use deal type determined by asset_class + capital_side instead

### Option 3: Migrate card type logic into pipeline stages
- Define fields per stage, not per card type
- Use stage + capital_side to determine applicable fields
- Eliminate card type selection from new deal dialog

### Option 4: Flatten into deal table
- Add columns like `field_set_id`, `layout_template_id` to `unified_deals`
- Make card type a computed value from these columns
- Gradually denormalize field metadata

---

## 15. COMPLETE FILE REFERENCE LIST

### Type Definitions
- `apps/requity-os/components/pipeline-v2/pipeline-types.ts` (160+ lines, defines UnifiedCardType, UnifiedDeal, all enums)
- `packages/db/supabase/types.ts` (auto-generated database types, includes unified_card_types)

### Hooks
- `apps/requity-os/hooks/useResolvedCardType.ts` (150 lines, resolution + caching)
- `apps/requity-os/hooks/useFieldConfigurations.ts` (181 lines, field config loading)

### Libraries
- `apps/requity-os/lib/visibility-engine.ts` (94 lines, visibility condition evaluation)
- `apps/requity-os/lib/pipeline/resolve-card-type-fields.ts` (140+ lines, field resolution logic)
- `apps/requity-os/lib/pipeline/validate-stage-advancement.ts` (stage gating logic, references card type)
- `apps/requity-os/lib/pipeline/uw-field-mappings.ts` (field mapping reference)

### Pipeline Components
- `apps/requity-os/components/pipeline-v2/PipelineView.tsx` (fetches card types)
- `apps/requity-os/components/pipeline-v2/PipelineTable.tsx` (displays deals with card type info)
- `apps/requity-os/components/pipeline-v2/PipelineKanban.tsx` (kanban view)
- `apps/requity-os/components/pipeline-v2/NewDealDialog.tsx` (card type selection + creation)
- `apps/requity-os/components/pipeline-v2/NewDealSheet.tsx` (variant)
- `apps/requity-os/components/pipeline-v2/CardTypeSelector.tsx` (UI component)
- `apps/requity-os/components/pipeline-v2/DealCard.tsx` (kanban card)
- `apps/requity-os/components/pipeline-v2/DealDrawer.tsx` (side drawer)
- `apps/requity-os/components/pipeline-v2/EditableOverview.tsx` (overview tab)
- `apps/requity-os/components/pipeline-v2/UnderwritingPanel.tsx` (UW tab)
- `apps/requity-os/components/pipeline-v2/tabs/PropertyTab.tsx` (property fields)
- `apps/requity-os/components/pipeline-v2/tabs/ContactsTab.tsx` (contact fields)
- `apps/requity-os/components/pipeline-v2/IntakeReviewSheet.tsx` (intake review)
- `apps/requity-os/components/pipeline-v2/IntakeQueue.tsx` (intake queue)

### Admin Pages
- `apps/requity-os/app/(authenticated)/admin/pipeline-v2/page.tsx` (pipeline list)
- `apps/requity-os/app/(authenticated)/admin/pipeline-v2/[id]/page.tsx` (deal wrapper)
- `apps/requity-os/app/(authenticated)/admin/pipeline-v2/[id]/DealDetailPage.tsx` (deal detail, calls useResolvedCardType)
- `apps/requity-os/app/(authenticated)/admin/pipeline-v2/actions.ts` (deal CRUD)
- `apps/requity-os/app/(authenticated)/admin/pipeline-v2/[id]/actions.ts` (deal detail actions)
- `apps/requity-os/app/(authenticated)/admin/pipeline/intake/page.tsx` (old intake page, still references card types)
- `apps/requity-os/app/(authenticated)/control-center/card-types/page.tsx` (card type list)
- `apps/requity-os/app/(authenticated)/control-center/card-types/CardTypeManagerView.tsx` (card type editor)
- `apps/requity-os/app/(authenticated)/control-center/card-types/actions.ts` (card type CRUD)
- `apps/requity-os/app/(authenticated)/control-center/pipeline-stage-config/_components/pipeline-stage-config.tsx` (stage rules, references card_type_id)
- `apps/requity-os/app/(authenticated)/control-center/pipeline-stage-config/actions.ts`

### Object Manager (Field Configuration Management)
- `apps/requity-os/app/(authenticated)/control-center/object-manager/page.tsx`
- `apps/requity-os/app/(authenticated)/control-center/object-manager/ObjectManagerView.tsx`
- `apps/requity-os/app/(authenticated)/control-center/object-manager/actions.ts` (now includes pipeline revalidation)
- `apps/requity-os/app/(authenticated)/control-center/object-manager/_components/*` (15+ files for UI)

### API Routes
- `apps/requity-os/app/api/intake/process/route.ts` (intake processing, fetches card types)
- `apps/requity-os/app/api/intake/webhook/route.ts` (email webhook, suggests card type)
- `apps/requity-os/app/api/deals/extract-from-document/route.ts` (document extraction)

### Database Migrations (Card Type Related)
- `packages/db/supabase/migrations/20260311300000_migrate_card_type_field_refs.sql` (populate field refs)
- `packages/db/supabase/migrations/20260309300001_add_card_type_field_refs.sql` (add columns)
- `packages/db/supabase/migrations/20260308400003_add_property_contact_fields_to_card_types.sql` (property/contact fields)
- `packages/db/supabase/migrations/20260308600000_add_object_bindings_to_uw_fields.sql`
- `packages/db/supabase/migrations/20260309000000_update_uw_output_formulas.sql`
- `packages/db/supabase/migrations/20260309100000_add_grid_proforma_columns.sql`
- `packages/db/supabase/migrations/20260310200000_add_closing_date_to_deal_summary.sql` (updates card types)
- `packages/db/supabase/migrations/20260308300000_unified_deal_conditions.sql` (RPC uses card types)
- `packages/db/supabase/migrations/20260308500001_create_unified_stage_rules.sql` (stage rules)

### Supporting Code
- `apps/requity-os/lib/pipeline/uw-field-mappings.ts` (field mapping constants)
- `apps/requity-os/components/documents/actions.ts` (document generation may use card type)
- `apps/requity-os/app/(authenticated)/admin/operations/approvals/actions.ts` (approval system)

---

## SUMMARY TABLE

| Area | Impact Level | Key Files | Notes |
|------|-------------|-----------|-------|
| Type System | Critical | pipeline-types.ts, supabase/types.ts | UnifiedCardType defined here |
| Deal Creation | High | NewDealDialog.tsx, pipeline-v2/actions.ts | Must select card type |
| Field Resolution | Critical | useResolvedCardType.ts, resolve-card-type-fields.ts | Core runtime logic |
| UI Components | Medium | PropertyTab, ContactsTab, UnderwritingPanel | Receive resolved card type as prop |
| Card Type Editor | High | CardTypeManagerView.tsx, card-types/actions.ts | Admin UI for card types |
| Intake Pipeline | Medium | API routes, email processing | Suggests card type |
| Stage Gating | Medium | validate-stage-advancement.ts, stage-config | May reference card types |
| Visibility System | Medium | visibility-engine.ts, field_configurations | Conditions stored in field config |
| Database | High | migrations/, unified_card_types FK | Deals must reference a card type |
| Caching | Low | useResolvedCardType.ts cache, invalidation | 5-min TTL + manual invalidation |

---

**End of Research Report**
