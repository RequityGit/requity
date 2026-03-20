# Borrower Tab Rebuild - Context

## Key Files
- `apps/requity-os/components/borrower/BorrowerContactsTab.tsx` - Parent tab component
- `apps/requity-os/components/borrower/BorrowingEntityCard.tsx` - Entity card (stays as-is)
- `apps/requity-os/components/borrower/BorrowerMemberTable.tsx` - Table with "Add Borrower" gate
- `apps/requity-os/components/borrower/BorrowerMemberRow.tsx` - Inline editable row (already has FICO/liquidity/etc)
- `apps/requity-os/components/borrower/AddBorrowerDialog.tsx` - Search-contact-first dialog (replacing)
- `apps/requity-os/components/borrower/BorrowerRollupSummary.tsx` - Rollup (stays as-is)
- `apps/requity-os/app/services/borrower.server.ts` - DB service layer
- `apps/requity-os/app/(authenticated)/(admin)/pipeline/[id]/borrower-actions.ts` - Server actions
- `apps/requity-os/app/(authenticated)/(admin)/pipeline/actions.ts` - processIntakeItemAction (line ~1656)
- `apps/requity-os/app/types/borrower.ts` - Type interfaces

## DB Schema: deal_borrower_members
Columns: id, borrowing_entity_id (FK, NOT NULL), deal_id (FK, NOT NULL), contact_id (FK to crm_contacts, NOT NULL - needs to become nullable), ownership_pct, credit_score, liquidity, net_worth, experience, is_guarantor, role, sort_order, created_at, updated_at, created_by, updated_by

FK Constraints: borrowing_entity_id -> deal_borrowing_entities(id), contact_id -> crm_contacts(id), deal_id -> unified_deals(id)

## Decisions Made
- Keep BorrowingEntityCard as separate section (entity generally shared across borrowers)
- Overview tab stays as quick-view summary reading from uw_data
- Full rebuild is the right long-term move vs just wiring up intake
- Store first_name, last_name, email, phone directly on deal_borrower_members (not just via contact FK)
- contact_id becomes optional ("link later" pattern)

## Gotchas Discovered
- borrower.server.ts MEMBER_SELECT uses left join syntax `contact:crm_contacts(...)` which should handle null contact_id gracefully in PostgREST
- BorrowerMemberRow.contactName() depends on m.contact - needs fallback to m.first_name/last_name
- addBorrowerMember in borrower.server.ts requires borrowing_entity_id - need to auto-create entity too during intake

## Last Updated: 2026-03-20
## Next Steps: Execute Phase 1 migration
