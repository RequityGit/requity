# Performance Sprint 1 - Tasks

## Phase 1: Instant Wins (Day 1) - DONE
- [x] Remove revalidatePath("/pipeline") from revalidateDealPaths (was busting entire kanban cache)
- [x] Remove revalidateDeal from inline save functions: updateDealFieldV2, logDealActivityRich, logQuickActionV2, updateDealGoogleSheet, clearDealGoogleSheet, assignTeamMemberV2, updateDealTeamContact
- [x] Add 300ms search debounce to contacts-view.tsx (using existing useDebounce hook)
- [x] Add 300ms search debounce to companies-view.tsx
- [x] Add visibilityState pause to useDealMessages (10s borrower polling)
- [x] Add visibilityState pause to SecureUploadClient (60s link data + 15s messages)
- [x] Add visibilityState pause to useActivityTracker (30s flush)

## Phase 2: Data Layer (Days 2-3) - DONE
- [x] Replace select("*") with explicit column lists on pipeline page queries (unified_stage_configs, unified_deal_activity, intake_items)
- [x] Replace select("*") with explicit column lists on deal detail queries (unified_stage_configs, unified_deal_documents)
- [x] Replace select("*") with explicit column lists on contact 360 queries (crm_contacts, crm_activities, crm_emails, contact_relationship_types)
- [x] Replace select("*") with explicit column lists on company 360 queries (companies, crm_activities, company_files, ops_tasks, notes, company_wire_instructions)
- [x] Verified deal detail page queries already parallelized with Promise.all (12 queries Phase 2, 8 queries Phase 3)
- [ ] Consolidate field config hooks into single FieldConfigProvider at page root (deferred to Phase 4)

## Phase 3: CRM Scaling (Days 4-5) - PENDING
- [ ] Add cursor-based pagination to contacts list (page size 50)
- [ ] Add cursor-based pagination to companies list (page size 50)
- [ ] Lazy-load tab data on Contact 360 (defer activities, emails, tasks, loans, pipeline to tab click)
- [ ] Lazy-load tab data on Company 360

## Phase 4: Architecture Hardening (Days 6-7) - PENDING
- [ ] Replace borrower message polling with Supabase Realtime subscription
- [ ] Cache auth role data in session cookie (eliminate middleware + layout double query)
- [ ] Add list virtualization with @tanstack/react-virtual to contacts/companies
- [ ] Add composite database indexes (unified_deals, field_configurations, crm_contacts)

## Last Updated: 2026-03-21
