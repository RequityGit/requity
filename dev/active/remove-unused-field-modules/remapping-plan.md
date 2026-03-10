# Tier 2 Module Remapping Plan

These 6 modules were removed from `field_configurations` but still have references
in the codebase as **entity types** in approvals, notifications, workflows, and search.
Those references are correct and intentional -- they refer to the domain entity, not
a field config module. No code change is needed for them.

---

## 1. `opportunity` -- Approval + Workflow Entity Type

**References (no change needed):**
| File | Usage |
|------|-------|
| `lib/approvals/types.ts:5` | `ApprovalEntityType` union includes `"opportunity"` |
| `lib/approvals/types.ts:153` | `ENTITY_TYPE_LABELS.opportunity = "Deal"` |
| `components/admin/workflow-builder/new-workflow-dialog.tsx:101` | Workflow entity dropdown |
| `admin/operations/approvals/approval-form-modal.tsx:32` | Approval form entity dropdown |
| `admin/operations/approvals/approval-card.tsx:70` | Approval card icon mapping |

**Why no change:** These reference the `opportunities` table entity, not the field config module.
Approvals, workflows, and notifications operate on domain entities. The approval system
tracks which entity type an approval belongs to (loan, opportunity, draw_request, etc.).
This is orthogonal to field_configurations.

---

## 2. `equity_deal` -- Workflow + UW Resolver Entity Type

**References (no change needed):**
| File | Usage |
|------|-------|
| `lib/underwriting/resolver.ts:83` | `{ source: "equity_deal" }` in resolveModelType |
| `components/admin/workflow-builder/new-workflow-dialog.tsx:102` | Workflow entity dropdown |

**Why no change:** The UW resolver uses this as a deal source type to pick the equity
underwriting model. The workflow dialog uses it as a workflow entity type. Both reference
the domain concept, not field_configurations.

---

## 3. `equity_underwriting` -- UW Model Table Name

**References (no change needed):**
| File | Usage |
|------|-------|
| `lib/underwriting/resolver.ts:69` | `primaryTable: "equity_underwriting"` |

**Why no change:** This is a database table reference for the underwriting model system.
It tells the UW resolver which table stores equity underwriting data. Completely separate
from field_configurations.

---

## 4. `investing_entity` -- Search Entity Type

**References (no change needed):**
| File | Usage |
|------|-------|
| `lib/search-utils.ts:20` | `SearchEntityType` union includes `"investing_entity"` |
| `lib/search-utils.ts:65-71` | Search config for investing_entity type |

**Why no change:** The global search system needs to know about investing entities as a
searchable entity type. This references the `investing_entities` table, not field configs.

---

## 5. `draw_request` -- Approval + Notification Entity Type

**References (no change needed):**
| File | Usage |
|------|-------|
| `lib/approvals/types.ts:5` | `ApprovalEntityType` union includes `"draw_request"` |
| `lib/approvals/types.ts:149` | `ENTITY_TYPE_LABELS.draw_request = "Draw Request"` |
| `admin/operations/approvals/approval-form-modal.tsx:29` | Approval form entity dropdown |
| `admin/operations/approvals/approval-card.tsx:64` | Approval card icon mapping |
| `lib/notifications.ts:18` | `EntityType` includes `"draw_request"` |

**Why no change:** Same as opportunity -- these are domain entity type references for
the approval and notification systems. They reference the `draw_requests` table entity.

---

## 6. `wire_instructions` -- Company Page Layout Section

**References (CHANGED):**
| File | Usage | Action |
|------|-------|--------|
| `control-center/page-manager/companies/page.tsx:8` | `COMPANY_FIELD_MODULES` array | **REMOVED** (was loading field configs that no longer exist) |
| `components/crm/company-360/tabs/overview-tab.tsx:73` | Default section layout | No change (section_key, not field config module) |
| `components/crm/company-360/tabs/overview-tab.tsx:534-538` | Section rendering | No change (renders wire instructions from `company_wire_instructions` table directly) |

**Why partial change:** The page manager was trying to load `wire_instructions` field configs
to let admins drag fields into the company page layout. Since those field configs never existed
in practice (the wire instructions UI is hardcoded), removing the module reference is correct.
The actual wire instructions rendering in company-360 reads directly from `company_wire_instructions`
table and doesn't use field configs.

---

## Architecture Alignment

The key insight: **entity types != field config modules**

The codebase has two separate registries:
1. **Field configurations** (`field_configurations` table, managed by Field Manager)
   - Defines field labels, types, dropdown options for UI rendering
   - Consumed by `useFieldConfigurations(module)` and `useResolvedCardType()`
   - Only 10 modules are actively consumed

2. **Entity types** (approval types, notification types, search types, workflow types)
   - Defines which domain objects can have approvals, be searched, trigger workflows
   - References database tables/entities, not field config modules
   - These are correct as-is and should NOT be changed

The confusion arose because some names overlap (e.g., `opportunity` is both a former field
config module AND an approval entity type). Deleting the field config module does not affect
the approval/notification/workflow systems.

---

## Future Work (Optional)

If these entities ever need field-config-driven UIs:
- **Servicing pages**: Could add `servicing_loan` module back and wire it to servicing detail pages
- **Fund pages**: Could add `fund_details` module back for investor fund detail pages
- **Equity pipeline**: Could add `equity_deal` module back when equity pipeline gets field-config support

These would be net-new features, not remapping. The current removal is clean.
