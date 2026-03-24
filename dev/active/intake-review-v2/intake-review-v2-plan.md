# Intake Review Modal v2 - Implementation Plan

## Objective
Transform the intake review modal from a read-only preview into a full inline deal editor. Users review AI-extracted data, correct errors, fill empty fields, and add notes before creating the deal in one pass.

## Scope
- IN: Editable fields for all extracted data sections, card type selector, notes editor, two-column layout, wider modal, documents preview, entity merge decisions preserved
- IN: Wire edited values into processIntakeItemAction
- OUT: Dynamic field loading from field_configurations (Phase 2)
- OUT: Email body preview panel (Phase 3)
- OUT: AI confidence indicators (Phase 3)

## Approach

### Phase 1 (this session)
1. Rewrite IntakeReviewModal.tsx with two-column layout at 1400px
2. Left column: editable form fields pre-filled from parsed_data, card type selector, notes textarea
3. Right column: documents preview, entity merge decisions (simplified), action summary
4. Update processIntakeItemAction to accept overridden field values from the form (not just raw parsed_data)
5. All fields use shadcn Input/Select primitives, follow design system v3

### Phase 2 (future)
- Pull field_configurations for selected card type to show ALL possible fields
- Add dropdowns for enum fields using field_configurations options
- Currency auto-formatting on financial inputs

### Phase 3 (future)
- Email body preview panel (right column, collapsible)
- AI confidence indicators (yellow highlight on low confidence fields)
- Card type change dynamically updates available fields

## Files to Modify
- `apps/requity-os/components/pipeline/IntakeReviewModal.tsx` (major rewrite)
- `apps/requity-os/app/(authenticated)/(admin)/pipeline/actions.ts` (update processIntakeItemAction signature)

## Database Changes
None - all data flows through existing unified_deals insert

## Risks
- Entity merge flow is complex; need to preserve it while adding inline editing
- Form state management with many fields could get heavy; use a single state object
- Card type selector needs active card types from the server; pass via props or fetch client-side

## Success Criteria
- All AI-extracted fields are editable in the modal
- Empty fields for common deal data are visible and fillable
- User can correct any field before confirming
- Notes textarea pre-filled with AI summary, editable
- Documents section shows attachments with file type icons
- Entity merge decisions still work
- All edited values flow into the created deal
