# Unified Messaging - Implementation Plan

## Objective
Build a centralized deal-level messaging thread that captures portal chat, email replies, and (future) SMS into a single conversation visible to both internal team and all borrower contacts on the deal.

## Scope
- IN: Phase 1 - Portal Chat (database schema, RLS, admin chat component on deal detail, borrower chat in upload portal, real-time subscriptions, notification triggers, security disclaimer)
- OUT: Inbound email integration (Phase 2, waiting on Postmark), SMS integration (Phase 4), outbound email from thread (Phase 3)

## Approach

### Phase 1A: Database Schema
- `deal_messages` table: id, deal_id, sender_type (admin|borrower|system), sender_id (auth.users nullable), contact_id (crm_contacts nullable), source (portal|email|sms), body, metadata (jsonb), created_at
- `deal_message_routing` table: id, deal_id, routing_token (unique), channel (email|sms), contact_id, created_at
- `deal_contact_preferences` table: deal_id, contact_id, notify_email (bool), notify_sms (bool), is_primary (bool)
- RLS: admins/super_admins full access; borrowers read/write own deal messages via token-based API (no direct Supabase auth for borrowers)
- Enable Supabase Realtime on deal_messages

### Phase 1B: API Routes
- `POST /api/deal-messages/send` - Send a message (admin or borrower via token)
- `GET /api/deal-messages/[dealId]` - Fetch messages for a deal (admin auth or token auth)
- Both routes handle sender resolution and activity logging

### Phase 1C: Admin Chat Component
- New `DealMessagesPanel` component rendered in the deal detail page sidebar/below activity
- Real-time subscription to deal_messages for the deal
- Input box with send button
- Messages show sender name, timestamp, source badge (portal/email/sms)
- Security disclaimer banner at top

### Phase 1D: Borrower Chat Component
- Add messaging section to SecureUploadClient.tsx
- Token-based auth (same pattern as upload portal)
- Same real-time subscription pattern
- Disclaimer banner: "This is a secure messaging channel. Please do not share passwords, SSNs, or bank credentials here."

### Phase 1E: Notifications
- When borrower sends a message, create notification for deal team
- When admin sends a message, send email notification to all deal contacts with notify_email=true
- Log message activity in unified_deal_activity

## Files to Modify
- NEW: `packages/db/supabase/migrations/XXXXXXXX_create_deal_messaging.sql`
- NEW: `apps/requity-os/components/pipeline/DealMessagesPanel.tsx`
- NEW: `apps/requity-os/hooks/useDealMessages.ts`
- NEW: `apps/requity-os/app/api/deal-messages/send/route.ts`
- NEW: `apps/requity-os/app/api/deal-messages/[dealId]/route.ts`
- MODIFY: `apps/requity-os/app/(authenticated)/(admin)/pipeline/[id]/DealDetailPage.tsx` (add Messages tab)
- MODIFY: `apps/requity-os/app/(public)/upload/[token]/SecureUploadClient.tsx` (add chat section)
- MODIFY: `apps/requity-os/lib/supabase/types.ts` (regenerate after migration)

## Database Changes
- 3 new tables: deal_messages, deal_message_routing, deal_contact_preferences
- RLS policies on all 3 tables
- Realtime enabled on deal_messages

## Risks
- Borrower portal uses token auth, not Supabase auth - RLS won't protect borrower reads directly; API routes must enforce token validation
- Real-time subscriptions need careful channel naming to avoid cross-deal leakage
- Large message volumes could slow deal detail page - pagination needed from the start

## Success Criteria
- Admin can send/receive messages on deal detail page in real-time
- Borrower can send/receive messages in upload portal in real-time
- All deal contacts receive email notifications for new admin messages
- Messages appear in deal activity feed
- Security disclaimer visible to all parties
- Build passes with no TS errors
