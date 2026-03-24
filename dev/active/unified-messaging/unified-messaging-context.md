# Unified Messaging - Context

## Key Files
- `packages/db/supabase/migrations/20260321000000_create_deal_messaging.sql` - Migration (applied)
- `apps/requity-os/app/api/deal-messages/send/route.ts` - Send message API (admin + token auth)
- `apps/requity-os/app/api/deal-messages/[dealId]/route.ts` - Fetch messages API (admin + token auth)
- `apps/requity-os/hooks/useDealMessages.ts` - React hook with real-time + polling
- `apps/requity-os/components/pipeline/DealMessagesPanel.tsx` - Admin chat panel (Messages tab)
- `apps/requity-os/app/(authenticated)/(admin)/pipeline/[id]/DealDetailPage.tsx` - Modified: added Messages tab
- `apps/requity-os/app/(public)/upload/[token]/SecureUploadClient.tsx` - Modified: added BorrowerMessaging component
- `apps/requity-os/app/api/upload-link/validate/route.ts` - Modified: added dealId to response

## Decisions Made
- Types were regenerated via Supabase MCP (removed 'as never' casts for messaging tables)
- Borrower chat uses polling (15s) since they don't have Supabase auth for realtime subscriptions
- Admin chat uses Supabase realtime subscriptions for instant updates
- BorrowerMessaging is a collapsible section in the upload portal (not a separate page)
- Messages tab is the 6th tab in UNIVERSAL_TABS: Overview, Property, Underwriting, Borrower, Diligence, Messages
- Security disclaimer is a persistent banner, not a modal
- Activity logging happens in the send route (unified_deal_activity inserts)

## Gotchas Discovered
- Borrower upload portal doesn't expose deal_id to client - had to add it to validate response
- Types not regenerated = need 'as never' casts for deal_messages table queries
- Set spread syntax ([...new Set(...)]) doesn't compile with current tsconfig - use Array.from(new Set(...))
- SecureUploadClient uses raw HTML elements (not shadcn) since it's a public page - BorrowerMessaging follows same pattern

## Per-Borrower Conditions Architecture
- `loan_condition_templates.per_borrower` = template flag (toggle in Control Center)
- `generate_deal_conditions` RPC: when per_borrower=true, creates one condition per borrower contact, appending " - FirstName LastName" to condition_name, setting assigned_contact_id
- `generate_borrower_conditions(p_deal_id, p_contact_id)` RPC: creates per-borrower conditions for a single new contact added mid-deal
- `unified_deal_conditions.assigned_contact_id` = which borrower owns this condition instance
- Upload link dialog filters conditions: shows deal-level (no assigned_contact_id) + selected contact's conditions
- DiligenceTab shows violet User icon badge on conditions with assigned_contact_id

## Dependencies
- Depends on: deal_contacts table, crm_contacts, secure_upload_links (token auth)
- Future phases depend on: Postmark (email inbound), Twilio (SMS)

## Last Updated: 2026-03-15 (session 2)
## Next Steps:
1. Build Phase 1E notification triggers (email to borrowers on admin message, in-app to team on borrower message)
2. Test end-to-end in running app (messaging + per-borrower conditions + upload link filtering)
3. Phase 2: Inbound email integration when Postmark is ready
4. Phase 3: Outbound email from thread
5. Phase 4: SMS via Twilio
