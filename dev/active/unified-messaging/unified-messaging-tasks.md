# Unified Messaging - Tasks

## Phase 1A: Database Schema
- [x] Create migration with deal_messages, deal_message_routing, deal_contact_preferences tables
- [x] Add RLS policies (admin full access, borrower read via deal_contacts join)
- [x] Enable Realtime on deal_messages
- [x] Apply migration via Supabase MCP
- [ ] Regenerate TypeScript types (need Supabase CLI credentials; used 'as never' casts for now)

## Phase 1B: API Routes
- [x] Create POST /api/deal-messages/send (admin auth + token auth)
- [x] Create GET /api/deal-messages/[dealId] (admin auth + token auth)
- [x] Add activity logging on message send (unified_deal_activity insert)

## Phase 1C: Admin Chat Component
- [x] Create useDealMessages hook with real-time subscription
- [x] Create DealMessagesPanel component
- [x] Add "Messages" tab to DealDetailPage UNIVERSAL_TABS
- [x] Wire up component in tab content area

## Phase 1D: Borrower Chat Component
- [x] Add BorrowerMessaging component to SecureUploadClient
- [x] Wire to /api/deal-messages API with token auth + polling
- [x] Add security disclaimer banner
- [x] Add dealId to validate response for client usage

## Phase 1E: Notifications & Activity (TODO - next session)
- [ ] Send email notification to contacts when admin posts
- [ ] Create in-app notification for team when borrower posts
- [x] Log messages in unified_deal_activity (done in send route)

## Phase 1F: Verification
- [x] Run TypeScript check - 0 errors
- [ ] Test admin send/receive flow (requires running app)
- [ ] Test borrower send/receive flow (requires running app)

## Phase 2A: Borrower Identity & Per-Borrower Conditions
- [x] Add contact_id to secure_upload_links (migration applied)
- [x] Add assigned_contact_id to unified_deal_conditions (migration applied)
- [x] Add per_borrower boolean to loan_condition_templates (migration applied)
- [x] Update generate_deal_conditions RPC to handle per_borrower templates
- [x] Create generate_borrower_conditions RPC for new contacts added mid-deal
- [x] Update addDealContact action to call generate_borrower_conditions
- [x] Add "Send to" contact picker in SecureUploadLinkDialog
- [x] Add per_borrower to ConditionFormData interface and save payload
- [x] Add per_borrower toggle to condition template slide-over form
- [x] Add PB column indicator in condition category section table
- [x] Add assigned_contact_id to DealCondition interface (pipeline-types.ts)
- [x] Add borrower badge in DiligenceTab ConditionRow for assigned conditions
- [x] Filter upload link conditions by selected contact
- [x] Move "Send to" picker above mode selector for UX flow
- [x] TypeScript check passes (0 errors)

## Blockers
- None

## Last Updated: 2026-03-15 (session 2)
