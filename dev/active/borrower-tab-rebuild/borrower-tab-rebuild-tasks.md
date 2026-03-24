# Borrower Tab Rebuild - Tasks

## Phase 1: Schema Migration
- [ ] Add first_name, last_name, email, phone to deal_borrower_members
- [ ] Make contact_id nullable
- [ ] Apply migration via Supabase MCP

## Phase 2: Intake Auto-Creation
- [ ] In processIntakeItemAction, after deal insert, create deal_borrowing_entity
- [ ] Create first deal_borrower_members record with parsed borrower data
- [ ] Update DealBorrowerMember type to include new fields

## Phase 3: Borrower Tab UI
- [ ] Update BorrowerMemberRow to show first_name/last_name (with contact fallback)
- [ ] Update BorrowerMemberTable to remove "entity required" gate
- [ ] Simplify AddBorrowerDialog to direct entry (no search-first requirement)
- [ ] Add "Link to Contact" optional action on member rows
- [ ] Update borrower.server.ts service layer for new fields

## Phase 4: Sync
- [ ] When member credit_score/liquidity update, sync to uw_data
- [ ] Add server action for uw_data sync

## Phase 5: Build & Verify
- [ ] pnpm build passes
- [ ] Test intake flow creates borrower member
- [ ] Test borrower tab shows inline-editable data

## Last Updated: 2026-03-20
