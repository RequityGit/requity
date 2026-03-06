# RequityOS — CLAUDE.md

## Overview

This is the RequityOS SaaS portal for borrowers, lenders, and investors. It is the primary authenticated application in the Requity Group monorepo.

## Tech Stack

- **Framework**: Next.js 14 (App Router) with TypeScript
- **UI**: shadcn/ui, Tailwind CSS, Radix UI primitives
- **Database**: Supabase (PostgreSQL with RLS) — shared via `@repo/db`
- **Auth**: Supabase Auth with SSR support (`@supabase/ssr`)
- **Deployment**: Netlify with `@netlify/plugin-nextjs`
- **Error Tracking**: Sentry

## Commands

```bash
pnpm dev          # Start dev server (Turbopack)
pnpm build        # Production build
pnpm lint         # ESLint
pnpm test         # Vitest
```

## Key Rules

- Follow existing `DESIGN_SYSTEM.md` tokens (at monorepo root)
- Use `@/*` path alias for internal imports
- Auth is handled via Supabase — see `lib/supabase/` for client wrappers
- Server actions in `actions.ts` files colocated with pages
- Use `@repo/lib` for shared utilities (`cn`, `formatCurrency`, etc.)
- **Never import from `apps/requity-group` or `apps/trg-living`**
- Packages are imported via workspace references (`@repo/lib`, `@repo/db`, `@repo/ui`, `@repo/types`)

## Structure

```
app/                  # Next.js App Router pages
  (authenticated)/    # Protected routes (auth enforced by layout)
  (public)/           # Public marketing pages
  api/                # API routes
components/           # UI components (admin, borrower, investor, shared, ui)
lib/                  # App-specific utilities, Supabase clients, constants
hooks/                # React hooks
contexts/             # React contexts
```
