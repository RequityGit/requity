# Object Manager Revamp - Implementation Plan

## Objective
Replace the dual Object Manager + Card Types system with a single unified Object Manager that uses two-axis conditional visibility (Asset Class x Loan Type), formula fields with cross-object references, and pro forma template selection.

## Scope
- IN: Database schema additions (field_definition visibility_condition, pro_forma_template, intake tables), Object Manager UI revamp (new tabs: Condition Matrix, Formulas; enhanced Fields tab with condition badges), conditional visibility runtime, formula field enhancements
- OUT: Full data migration from card_types (deferred), Card Types deletion (deferred), Rent Roll/T12 parser rewiring (deferred), public intake form runtime (deferred), Playwright E2E tests (deferred)

## Approach

### Phase 1: Database Schema
1. Add `visibility_condition` JSONB column to `field_configurations`
2. Create `pro_forma_template` table
3. Create intake form tables (`intake_form`, `intake_form_field`, `intake_submission`)
4. Seed Opportunity object fields with appropriate visibility conditions
5. Seed 4 pro forma templates

### Phase 2: Object Manager UI Revamp
1. Add new tabs: "Condition Matrix", "Formulas"
2. Enhance Fields tab with:
   - Axis indicator banners for Opportunity object
   - Condition badges (Asset Class/Loan Type pills)
   - Filter toolbar (All/Conditional/Formula/Always)
   - "+ condition" hover button on fields
3. Build Condition Editor modal (two-section toggle picker)
4. Build Formula Editor modal (code editor with field ref chips)
5. Build Condition Matrix tab (truth table view)
6. Build Formulas tab (list all formula fields)
7. Update Page Layout tab with view switcher including Intake Forms

### Phase 3: Conditional Visibility Runtime
1. Create `isVisible()` utility function
2. Wire condition evaluation into field rendering
3. Build axis change confirmation dialog

## Files to Modify
- `packages/db/supabase/migrations/` - new migration files
- `apps/requity-os/app/(authenticated)/control-center/object-manager/` - all components
- `apps/requity-os/app/(authenticated)/control-center/object-manager/actions.ts` - server actions
- `apps/requity-os/lib/` - visibility utilities

## Database Changes
- ALTER `field_configurations` ADD `visibility_condition JSONB`
- CREATE `pro_forma_template` table
- CREATE `intake_form`, `intake_form_field`, `intake_submission` tables
- SEED visibility conditions on existing opportunity fields
- SEED pro forma templates

## Risks
- Existing field_configurations data must be preserved
- Object Manager must remain functional during migration
- Card Types system continues to work until explicit removal phase

## Success Criteria
- Object Manager shows new tabs (Condition Matrix, Formulas)
- Fields tab displays condition badges from visibility_condition
- Condition Editor modal allows setting Asset Class + Loan Type conditions
- Condition Matrix shows truth table for all conditional fields
- Formulas tab lists formula fields with expressions
- No TypeScript errors, no regressions
