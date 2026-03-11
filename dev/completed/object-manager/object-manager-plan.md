# Object Manager - Implementation Plan

## Objective
Build a unified Object Manager admin console that replaces the separate Field Manager and Page Manager, providing a single three-panel interface to configure objects, fields, relationships, and page layouts in RequityOS.

## Scope
- IN: Schema migrations (new tables + column additions), three-panel UI shell, Fields tab with full config panel, Relationships tab with config, Page Layout tab with tabbed canvas and field palette, nav integration
- OUT: Create Form and Table View layout editors (show "Coming Soon"), drag-and-drop (use click-to-add with up/down arrows), Phase 6 integration with existing detail pages (separate task), Chatter/deal room

## Approach
1. Phase 1: Supabase migration via MCP for schema changes
2. Phase 2: Route + three-panel layout shell
3. Phase 3: Fields tab + right panel config
4. Phase 4: Relationships tab + right panel config
5. Phase 5: Page Layout tab with canvas, sections, field palette
6. Phase 6: Integration touchpoints (minimal, verify backward compat)

## Files to Modify
- NEW: `apps/requity-os/app/(authenticated)/control-center/object-manager/page.tsx`
- NEW: `apps/requity-os/app/(authenticated)/control-center/object-manager/actions.ts`
- NEW: `apps/requity-os/app/(authenticated)/control-center/object-manager/ObjectManagerView.tsx`
- NEW: `apps/requity-os/app/(authenticated)/control-center/object-manager/_components/*.tsx`
- EDIT: `apps/requity-os/app/(authenticated)/control-center/_config/nav.ts`

## Database Changes
- ALTER field_configurations: add ~20 new columns
- CREATE object_definitions, object_relationships, relationship_roles
- CREATE opportunity_properties, opportunity_contacts, entity_contacts junction tables
- ALTER page_layout_sections: add tab and section_type columns
- ALTER page_layout_fields: add source and column_span columns
- Seed data for object_definitions and object_relationships
- RLS policies on all new tables

## Success Criteria
- Object Manager renders at /control-center/object-manager
- Can select objects, view/edit fields, relationships, page layouts
- All data persisted to Supabase
- Build passes with no new TypeScript errors
