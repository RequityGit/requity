# RequityOS Monorepo Audit Report

**Date:** 2026-03-11
**Branch:** `claude/audit-monorepo-cleanup-Icci7`
**Build status:** All 3 apps pass

---

## Changes Made (This PR)

### 1. Dead Code Removed

#### Unused npm packages removed from requity-os/package.json:
- `mammoth` (0 imports, ~150KB)
- `react-resizable-panels` (0 imports)
- `embla-carousel-react` (0 imports, wrapper component unused)
- `@radix-ui/react-accordion` (wrapper unused)
- `@radix-ui/react-aspect-ratio` (wrapper unused)
- `@radix-ui/react-context-menu` (wrapper unused)
- `@radix-ui/react-menubar` (wrapper unused)
- `@radix-ui/react-navigation-menu` (wrapper unused)
- `@radix-ui/react-radio-group` (wrapper unused)
- `@radix-ui/react-slider` (wrapper unused)
- `@radix-ui/react-toggle` (wrapper unused)
- `@radix-ui/react-toggle-group` (wrapper unused)

**Total: 12 packages removed**

#### Unused shadcn/ui wrapper components deleted:
- `components/ui/accordion.tsx`
- `components/ui/aspect-ratio.tsx`
- `components/ui/context-menu.tsx`
- `components/ui/menubar.tsx`
- `components/ui/navigation-menu.tsx`
- `components/ui/radio-group.tsx`
- `components/ui/slider.tsx`
- `components/ui/carousel.tsx`
- `components/ui/toggle.tsx`
- `components/ui/toggle-group.tsx`
- `components/ui/resizable.tsx`

**Total: 11 component files deleted**

#### Unused hooks/lib/utility files deleted:
- `hooks/useFieldConfigurations.ts` (deprecated, replaced by useResolvedCardType)
- `lib/form-engine/prefill.ts` (orphaned)
- `lib/dashboard.server.ts` (orphaned)
- `lib/dashboard-ceo.server.ts` (orphaned)
- `lib/supabase/crm-types.ts` (orphaned)

**Total: 5 utility files deleted**

#### Unused component files deleted:
- `components/admin/budget-draws/scope-of-work-tab.tsx`
- `components/admin/equity/equity-pipeline-tabs.tsx`
- `components/admin/property-financials/property-financial-versions.tsx`
- `components/admin/property-financials/upload-property-rent-roll-dialog.tsx`
- `components/admin/property-financials/upload-property-t12-dialog.tsx`
- `components/admin/underwriting/commercial-form.tsx`
- `components/admin/underwriting/dscr-editor.tsx`
- `components/admin/underwriting/guc-editor.tsx`

**Total: 8 component files deleted**

#### Dead routes removed:
- `app/(authenticated)/admin/dscr/` (6 pages, replaced by `/admin/models/dscr/`)
- `app/(authenticated)/admin/pipeline/debt/page.tsx` (redirect)
- `app/(authenticated)/admin/pipeline/debt/[id]/page.tsx` (redirect)
- `app/(authenticated)/admin/pipeline/debt/[id]/property-financial-actions.ts` (orphaned after dialog deletion)
- `app/(authenticated)/admin/pipeline/equity/` (3 files, all redirects)

**Total: 11 route files deleted**

### 2. Broken Redirects Fixed (next.config.mjs)
- `/admin/equity-pipeline/:id` now redirects to `/admin/pipeline/:id` (was pointing to deleted path)
- `/admin/equity-pipeline` now redirects to `/admin/pipeline?tab=equity` (was pointing to deleted path)
- `/admin/deals/:id` now redirects to `/admin/pipeline/:id` (was pointing to deleted path)

### 3. Stale References Cleaned
- `module-guard.tsx`: Removed dead `/admin/dscr` module guard entry
- `mobile-sidebar.tsx`: Removed `/admin/dscr` from Models activePaths
- `sidebar.tsx`: Removed `/admin/dscr` from sidebar path list
- `originations-tabs.tsx`: Updated DSCR links from `/admin/dscr/rate-sheets` and `/admin/dscr/price` to `/admin/models/dscr?tab=*`

### 4. Security Fixes (P0)
- **Added auth guards** to `/api/deals/[dealId]/commercial-uw/route.ts` (GET, POST) - was completely unprotected
- **Added auth guards** to `/api/deals/[dealId]/commercial-uw/[uwId]/route.ts` (GET, PUT, DELETE) - was completely unprotected
- **Added auth guard** to `/api/webflow-collections/route.ts` (GET) - was completely unprotected
- **Fixed `created_by`** in commercial-uw POST to use `user.id` instead of `body.createdBy || "system"`
- **Removed debug info leak** from `/api/loan-request/route.ts` error response (was exposing SMTP config presence)

---

## Remaining Findings (Not Changed, Flagged for Follow-Up)

### P0 - Critical

| File | Issue | Action Needed |
|------|-------|---------------|
| `/api/forms/submit/route.ts` | No auth - public form endpoint. Uses admin client to create CRM entities. | Add rate limiting, honeypot fields, or CAPTCHA |
| `/api/investor-request/route.ts` | No auth - public form. No rate limiting. | Add rate limiting |
| `/api/investor-profile/route.ts` | No auth - public form. No rate limiting. | Add rate limiting |
| `/api/loan-request/route.ts` | No auth - public form. No rate limiting. | Add rate limiting |
| `next@14.2.21` | Security advisory on all 3 apps | Upgrade to 14.2.22+ |

### P1 - Significant

| File | Issue | Action Needed |
|------|-------|---------------|
| `/api/dialer/lists/[listId]/route.ts` | PATCH accepts arbitrary body without field allowlist | Add field validation |
| `/api/search/route.ts` | Uses admin client bypassing RLS | Switch to user client for RPC calls |
| `/api/sync-pricing/route.ts` | Protected only by env secret, no user context | Review if acceptable for webhook-only endpoint |
| `/api/intake/webhook/route.ts` | Protected only by env secret | Review if acceptable for webhook-only endpoint |
| 74 files with `any` types | 297 total `any` annotations across codebase | Systematic type improvement (batch by module) |
| 29 files with `catch (err: any)` | Should use `catch (err: unknown)` + instanceof check | Low risk, batch fix |
| `components/layout/topbar.tsx:68,73` | `<img>` instead of `next/image` for logos | Minor LCP impact, SVG from external storage |
| `components/shared/file-upload.tsx:127` | `<img>` instead of `next/image` | Minor LCP impact |
| `lib/dialer/dialer-context.tsx:254` | React ref cleanup warning | Copy ref to variable inside effect |

### P2 - Nice to Have

| Area | Issue | Notes |
|------|-------|-------|
| `eslint@8.57.1` | End of life | Plan upgrade to ESLint v9 |
| `@uiw/react-md-editor` | ~60KB gzipped, used in 1 file | Consider lighter alternative if SOP editor is rarely used |
| `html2pdf.js` | ~80KB gzipped, used in 2 functions | Consider server-side PDF generation |
| Missing `.nvmrc` | No Node version pinned | Add `20.x` to root |
| Missing `.npmrc` | No pnpm config | Add `auto-install-peers=true` |
| Tiptap peer warning | `@tiptap/extension-horizontal-rule@3.20.1` wants `@tiptap/core@^3.20.1` but `3.20.0` installed | Bump `@tiptap/core` and `@tiptap/pm` to `^3.20.1` |

---

## Dependency Health Summary

| Category | Score | Notes |
|----------|-------|-------|
| Version alignment | 10/10 | All shared deps unified across workspaces |
| Unused packages | 9/10 | 12 removed (was 6/10) |
| Security | 6/10 | Next.js advisory still pending |
| Bundle efficiency | 7/10 | Heavy packages justified (mathjs, tiptap) |
| **Overall** | **8/10** | Significant improvement after cleanup |

---

## Performance Notes

### What's Good
- No console.log statements in production code
- Only 1 `@ts-ignore` in entire codebase (instrumentation.ts)
- Loading states exist for all major route groups (8 loading.tsx files)
- Good use of `force-dynamic` on data-fetching pages
- Shared package versions perfectly aligned

### Areas to Monitor
- `originations/page.tsx` has 24 `any` types and does ~10 sequential Supabase queries - candidate for parallel fetching with `Promise.all`
- `servicing-tabs.tsx` and `billing-tabs.tsx` each have 18 `any` types - heaviest type debt
- `dscr-pricing-manager.tsx` has 28 `any` types - worst single component

---

## Data Architecture Notes

- Real-time subscriptions appear properly cleaned up (checked dialer-context and notification patterns)
- Forms use react-hook-form + zod validation consistently
- Error boundaries exist via Next.js error.tsx convention
- Auth is consistently enforced via `(authenticated)/layout.tsx` for page routes
- API routes were the weak spot (fixed 3 of 7 P0 issues, remaining 4 are intentionally public)
