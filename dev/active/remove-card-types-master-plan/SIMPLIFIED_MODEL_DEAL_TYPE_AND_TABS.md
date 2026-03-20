# Simplified Model: Same Layout; Property by Asset Class; Pro Forma by Loan Type

**Date:** 2026-03-14  
**Answers:** What will deal_type pull from? Can we have the same deal layout, Property conditional by asset class, and Pro forma tabs visible by loan type?

---

## What will deal_type pull from?

Two options:

1. **Stored on the deal (recommended for filters/breadcrumbs)**  
   - **deal_type** is a column on `unified_deals` (e.g. text slug: `res_debt_dscr`, `comm_debt`).  
   - It's set **once at creation** from the user's effective choice (asset class + capital side + loan type).  
   - At runtime it "pulls from" **the deal row**: `deal.deal_type`.  
   - A small in-code map (e.g. `DEAL_TYPE_CONFIG[deal.deal_type]`) gives label, shortLabel, icon for header/breadcrumbs/filters.  
   - So: **source of truth for the slug is the deal;** the config is just display metadata in code.

2. **Fully derived (no column)**  
   - Don't store deal_type.  
   - Derive display label/shortLabel from **deal.asset_class**, **deal.capital_side**, and **deal.uw_data.loan_type** via a small helper (e.g. `getDealTypeDisplay(deal)`).  
   - Filters can use the same derived slug or filter by asset_class + capital_side + loan_type directly.

So: deal_type either **pulls from the deal row** (option 1) or is **derived from deal fields** (option 2). It does not need to pull from a separate card types table.

---

## Same layout; Property conditional by asset class; Pro forma by loan type

**Yes.** You can have:

- **Same deal layout for all**  
  You already have one tab list (`UNIVERSAL_TABS`). Keep it. No per-deal-type layout.

- **Property tab: conditional by asset class**  
  Property fields are already driven by **Object Manager visibility**: `useUwFieldConfigs(visibilityContext)` with `visibilityContext = { asset_class, loan_type }`. So "visible property input per asset class" is already the Condition Matrix on `field_configurations` (asset_class, and optionally loan_type). No card type needed.

- **Pro forma / models tab: visible based on loan type (or asset class)**  
  Today the Underwriting tab content switches on `cardType.slug` (comm_debt / comm_equity) to show Commercial Pro Forma vs simple UW. Replace that with **deal data**:

  - **Option A:** `deal.asset_class === 'commercial'` (and optionally `deal.capital_side`) to show the Commercial / Pro Forma content.  
  - **Option B:** `deal.uw_data.loan_type` in a set of "commercial" product types (e.g. Bridge, Perm, Construction) to show the Pro Forma / models tab content.

  Then:

  - **Pro forma / models tab visible when:** `isCommercial = deal.asset_class === 'commercial'` (or `isCommercialLoanType(deal.uw_data?.loan_type)`).  
  - **Otherwise:** show the simple Underwriting panel (existing `UnderwritingPanel`).

No card type and no deal_type are required for that logic; only **asset_class** and **loan_type** (from the deal).

---

## Concrete code change

In `DealDetailPage.tsx`, replace:

```ts
const isCommercial = ["comm_debt", "comm_equity"].includes(cardType.slug);
```

with something like:

```ts
const isCommercial =
  deal.asset_class === "commercial" ||
  (["Bridge", "Perm", "Construction"].includes(String(deal.uw_data?.loan_type ?? "")));
```

(or your exact rule for "this deal gets the Pro Forma / Commercial tab"). Same layout; Property tab already conditional by asset class via visibility; Pro forma visibility driven by loan type (and/or asset class).
