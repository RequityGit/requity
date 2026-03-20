# Borrower Tab Rebuild - Implementation Plan

## Objective
Rebuild the Borrower tab to use "fields-first, link later" pattern (like Property tab) and have intake auto-create borrower member records so data shows immediately.

## Scope
- IN: Schema migration (add name fields to deal_borrower_members, make contact_id nullable), intake auto-creation of borrowing entity + first member, Borrower tab UI rebuild with inline-editable cards, uw_data sync on member updates
- OUT: CRM contact auto-creation from intake, changes to overview tab borrower section, borrower portal changes

## Approach

### Phase 1: Schema Migration
- Add first_name, last_name, email, phone columns to deal_borrower_members
- Make contact_id nullable (currently NOT NULL with FK to crm_contacts)
- Keep FK constraint but allow NULL

### Phase 2: Intake Auto-Creation
- In processIntakeItemAction, after deal creation, auto-create deal_borrowing_entity (with entity_name if available)
- Auto-create first deal_borrower_members record with whatever borrower data exists (name, credit_score, liquidity, email, phone)
- No CRM contact required

### Phase 3: Borrower Tab UI Rebuild
- BorrowerMemberTable: Remove "entity required" gate for adding borrowers
- BorrowerMemberRow: Show first_name/last_name inline-editable (not from contact join)
- AddBorrowerDialog: Simplify to "Add Borrower" with direct field entry + optional "Link to Contact"
- Keep BorrowingEntityCard as-is (separate section)
- Keep BorrowerRollupSummary as-is

### Phase 4: Sync
- When borrower member fields update (credit_score, liquidity), sync back to uw_data on unified_deals

## Files to Modify
- Migration SQL (new)
- apps/requity-os/app/types/borrower.ts (update DealBorrowerMember interface)
- apps/requity-os/app/services/borrower.server.ts (update queries, allow null contact_id)
- apps/requity-os/app/(authenticated)/(admin)/pipeline/actions.ts (intake auto-creation)
- apps/requity-os/app/(authenticated)/(admin)/pipeline/[id]/borrower-actions.ts (new addBorrowerMemberDirect action)
- apps/requity-os/components/borrower/BorrowerMemberTable.tsx (remove entity gate)
- apps/requity-os/components/borrower/BorrowerMemberRow.tsx (show name fields inline)
- apps/requity-os/components/borrower/AddBorrowerDialog.tsx (simplify to direct entry)

## Database Changes
- ALTER TABLE deal_borrower_members ADD COLUMN first_name text, ADD COLUMN last_name text, ADD COLUMN email text, ADD COLUMN phone text
- ALTER TABLE deal_borrower_members ALTER COLUMN contact_id DROP NOT NULL

## Risks
- Existing members have contact_id set; name display fallback needed (use contact join name if first_name/last_name empty)
- borrower.server.ts MEMBER_SELECT joins crm_contacts; needs to handle null contact gracefully

## Success Criteria
- Intake push auto-creates entity + member, Borrower tab shows data immediately
- Can add borrower without searching for contact first
- Existing borrowers with contact_id still display correctly
- Inline editing works for all fields including name
