# Audit: Contacts → Borrower Tab + Deal Team Section (Step 0)

## 0A: Page Layout Config Tables

- **page_layout_sections**: Stores section_key, section_label, section_icon, display_order, section_type ('fields' | 'system'), **tab_key**, **tab_label**, tab_icon, tab_order, tab_locked, page_type. Tabs are not a separate table; they are derived from distinct (tab_key, tab_label, tab_icon, tab_order) across sections. For deal detail, page_type = 'deal_detail'. Sections reference their parent tab via tab_key (e.g. 'overview', 'property').
- **page_layout_fields**: section_id, field_config_id, field_key, display_order, column_position, is_visible, source, source_object_key, column_span.

The **deal detail tab bar** is **not** driven by these tables. The tab list is hardcoded in DealDetailPage.tsx (see 0B). Only the *content* of Overview and Property tabs is layout-driven (sections/fields from page_layout_sections + page_layout_fields).

## 0B: Tab Rendering Logic

- **File**: `apps/requity-os/app/(authenticated)/(admin)/pipeline/[id]/DealDetailPage.tsx`
- **Tabs are hardcoded**: `UNIVERSAL_TABS = ["Overview", "Property", "Underwriting", "Contacts", "Conditions", "Documents", "Tasks", "Activity", "Notes"]`. The tab bar maps over this array and renders a button per tab. No TabsList/TabsTrigger from shadcn; custom buttons.
- **Tab switching**: Local state `activeTab` + URL search param `tab` (lowercase). On change, `window.history.replaceState` updates URL to `?tab=<tab.toLowerCase()>`.
- **Initial tab**: `const initialTab = tabs.find((t) => t.toLowerCase() === tabParam?.toLowerCase()) ?? tabs[0]`. So `?tab=contacts` selects "Contacts".
- **Conclusion**: Rename "Contacts" to "Borrower" in UNIVERSAL_TABS; add redirect when tabParam === 'contacts' to replace with 'borrower'. Update all conditional rendering from `"Contacts"` to `"Borrower"` (loadedTabs, activeTab checks, content div).

## 0C: Contacts Tab Component

- **File**: `apps/requity-os/components/borrower/BorrowerContactsTab.tsx` (exported from `@/components/borrower`). DealDetailPage uses **BorrowerContactsTab**, not the pipeline/tabs/ContactsTab.tsx (which is a different, deal_contacts-based UI).
- **Props**: `{ dealId: string }`. No deal object or tab name prop.
- **Data**: Fetches via fetchBorrowingEntity(dealId) and fetchBorrowerMembers(dealId) from borrower-actions. No reference to the string "Contacts" in this file for tab naming.
- **Conclusion**: No change needed inside BorrowerContactsTab for the rename. Only DealDetailPage needs the tab label and key change.

## 0D: Overview Tab Component

- **File**: `apps/requity-os/components/pipeline/EditableOverview.tsx`
- **Rendering**: Uses useDealLayout() to get fieldSections filtered by tab_key === 'overview'. Renders config-driven section cards (field grids). No built-in support for custom section types (e.g. component_type = 'deal_team').
- **Conclusion**: Use **Path B**: Add `<DealTeamSection />` at the end of the Overview content (after the effectiveFieldGroups map), with dealId and initialContacts from props. Loader must pass dealTeamContacts; EditableOverview needs to accept and forward them.

## 0E: Related Contacts Data Model

- **deal_contacts**: Exists; links deal_id (unified_deals) to contact_id (crm_contacts); role (primary/co_borrower), is_guarantor. Used for borrower/signer contacts on the deal.
- **deal_team_members**: Exists; links deal_id to profile_id (internal staff: Originator, Processor, Underwriter, etc.). Different concept from external deal team (broker, title, etc.).
- **opportunity_contacts**: Exists in schema but pipeline uses unified_deals + deal_contacts.
- **Contact table**: CRM uses **crm_contacts** (not "contacts"). Columns include first_name, last_name, email, phone, company_name.
- **Conclusion**: Create new table **deal_team_contacts** with deal_id → unified_deals(id), contact_id → crm_contacts(id) (optional), plus manual_name, manual_company, manual_phone, manual_email, role, notes, sort_order. Use crm_contacts for linked contact; deal_id references unified_deals(id) to match deal_contacts and deal_team_members.

## Summary

| Item | Finding |
|------|--------|
| Tab name storage | Hardcoded in DealDetailPage.tsx |
| Tab value for URL | Lowercase tab name ("contacts" → "borrower") |
| Contacts tab content | BorrowerContactsTab (dealId only) |
| Overview structure | EditableOverview + useDealLayout; add Deal Team at end (Path B) |
| Deal team table | New deal_team_contacts; FK to unified_deals(id), crm_contacts(id) optional |
