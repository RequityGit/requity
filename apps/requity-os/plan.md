# Plan: Improve Term Sheet Template Editor

## Problem

The current Term Sheet template editor shows 12 sections (Borrower Information, Property Information, etc.) but admins have **no visibility into what fields each section contains**. The sections are opaque toggles — you can turn them on/off and rename headings, but you can't see or control the individual fields within them. For non-technical admins, this is a guessing game.

## Current State

- 12 sections defined as simple labels (e.g., "Borrower Information", "Loan Terms")
- Toggle to show/hide entire sections
- Up/down buttons to reorder sections
- Customizable section headings
- Custom text blocks for 4 sections (guarantor, reserves, closing costs, conditions)
- No field-level visibility or control
- No preview of what the generated term sheet will look like
- No field-to-section mapping exists in the codebase yet

## Proposed Improvements

### 1. Expandable Section Cards with Field Inventory

**Replace the flat section list with expandable accordion cards.** Each section card shows:

- The existing toggle (show/hide section) and heading customization
- A **collapsible field list** showing every field that section will display
- Each field shows a **human-readable label** (e.g., "Borrower Name", "Credit Score", "Property Address")
- Each field has its own **toggle** to include/exclude it from the term sheet
- Each field has an optional **custom display label** override (e.g., rename "LTV" to "Loan-to-Value Ratio")
- Fields are grouped logically and show helpful descriptions

**Example — "Borrower Information" section expanded:**
```
▼ Borrower Information                              [Section: ON]
   Heading: "Borrower Information"
   ┌─────────────────────────────────────────────────────────┐
   │ ✓  Borrower Name         "Full legal name of borrower" │
   │ ✓  Entity Name           "Borrowing entity (LLC, etc)" │
   │ ✓  Email                 "Borrower email address"      │
   │ ✓  Phone                 "Borrower phone number"       │
   │ ✗  Credit Score           "Borrower credit score"      │
   │ ✓  Citizenship Status    "US citizen or foreign nat'l" │
   └─────────────────────────────────────────────────────────┘
   Custom text: [                                           ]
```

This gives admins **full transparency** into what each section contains without needing to generate a test PDF.

### 2. Default Field Mapping Configuration

Define a comprehensive field-to-section mapping as a configuration constant. This serves as both:
- The source of truth for the editor UI (what fields to show per section)
- The configuration for future PDF generation

**Sections and their fields:**

| Section | Fields |
|---------|--------|
| **Borrower Info** | Borrower name, entity name, entity type, email, phone, credit score, citizenship |
| **Property Info** | Address, city, state, zip, property type, units, sq ft, year built, occupancy |
| **Loan Terms** | Loan amount, interest rate, loan term, loan type, loan purpose, LTV, appraised value, maturity date |
| **Fees & Costs** | Origination fee, broker fee, processing fee, underwriting fee, doc prep fee, wire fee |
| **Reserves & Holdbacks** | Rehab holdback, interest reserve, tax reserve, insurance reserve |
| **Guarantor / Recourse** | Guarantor name, recourse type, guarantee percentage |
| **Closing Cost Breakdown** | Title insurance, recording fees, attorney fees, appraisal fee, environmental fee |
| **Key Dates** | Application date, approval date, closing date, first payment date, maturity date |
| **Prepayment Terms** | Prepayment penalty type, penalty period, penalty percentage, lockout period |
| **Extension Options** | Extension available, extension term, extension fee, extension conditions |
| **Conditions & Requirements** | (Pulls from loan_conditions table — dynamic list) |
| **Disclaimer** | (Custom rich text only — no database fields) |

### 3. Inline Section Preview Snippets

Below each expanded section, show a **mini preview** of how that section will render in the term sheet using sample/placeholder data. This gives admins immediate visual feedback without generating a full PDF.

```
Preview:
┌──────────────────────────────────────┐
│  BORROWER INFORMATION                │
│  Borrower Name:    John Smith        │
│  Entity:           Smith Capital LLC │
│  Email:            john@example.com  │
│  Phone:            (555) 123-4567    │
└──────────────────────────────────────┘
```

### 4. Store Field Visibility in Database

Add a `field_visibility` JSONB column to `term_sheet_templates` to store per-field toggles:

```json
{
  "borrower": {
    "borrower_name": true,
    "entity_name": true,
    "email": true,
    "credit_score": false
  },
  "property": {
    "address": true,
    "property_type": true,
    "year_built": false
  }
}
```

Also add a `field_labels` JSONB column for custom label overrides:

```json
{
  "borrower.email": "Contact Email",
  "loan_terms.ltv": "Loan-to-Value Ratio"
}
```

### 5. Improved UI Layout

**Replace the 4-tab layout with a single, streamlined page:**

- **Top bar**: Loan type selector (existing) + Save button
- **Left panel**: Scrollable list of section accordion cards (improvements #1-3)
- **Right panel**: Live preview of the full term sheet layout (showing which sections are on, in what order, with which fields)
- **Bottom drawer/modal**: Branding & Settings (company info, header/footer — used less frequently)

This way admins see the section configuration and preview side-by-side.

## Implementation Steps

1. **Define field mapping configuration** (`lib/term-sheet-fields.ts`)
   - Create a typed constant mapping each section to its fields
   - Each field definition includes: key, label, description, default visibility, data source

2. **Database migration** — Add `field_visibility` and `field_labels` JSONB columns to `term_sheet_templates`
   - Regenerate TypeScript types

3. **Refactor editor component** into accordion-based layout
   - Replace flat section list with expandable cards
   - Add per-field toggles and custom label inputs inside each card
   - Add inline preview snippets per section
   - Move branding/settings to a collapsible bottom section or modal

4. **Add side preview panel**
   - Show a simplified term sheet layout preview
   - Updates live as sections/fields are toggled

5. **Update server action** to handle new `field_visibility` and `field_labels` fields

## What This Does NOT Include (Future Work)

- WYSIWYG rich text editor (would add significant complexity)
- Drag-and-drop field reordering within sections
- Actual PDF generation edge function (separate project)
- Custom/user-defined fields beyond the loan database columns

## Files to Create/Modify

| File | Action |
|------|--------|
| `lib/term-sheet-fields.ts` | **Create** — Field mapping configuration |
| `components/admin/term-sheet-template-editor.tsx` | **Major rewrite** — Accordion sections, field toggles, preview |
| `components/admin/term-sheet-section-card.tsx` | **Create** — Expandable section card component |
| `components/admin/term-sheet-preview.tsx` | **Create** — Side preview panel component |
| `app/(authenticated)/admin/settings/term-sheets/actions.ts` | **Update** — Handle new fields |
| `app/(authenticated)/control-center/term-sheets/page.tsx` | **Update** — Pass new data |
| `supabase/migrations/` | **Create** — Migration for new JSONB columns |
| `lib/supabase/types.ts` | **Regenerate** — After migration |
