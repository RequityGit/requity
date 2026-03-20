# Requity Group Marketing Site — CLAUDE.md

## Overview

This is the Requity Group public marketing site. It has its own brand identity separate from RequityOS.

## Tech Stack

- **Framework**: Next.js 14 (App Router) with TypeScript
- **Styling**: Tailwind CSS with custom brand tokens
- **Deployment**: TBD (Netlify or Vercel)

## Commands

```bash
pnpm dev          # Start dev server (port 3001)
pnpm build        # Production build
pnpm lint         # ESLint
```

## Key Rules

- No auth — this is a public site
- No direct Supabase access — use API routes only if needed
- Has its own brand identity and design tokens
- Use `@repo/lib` for shared utilities
- **Never import from `apps/requity-os` or `apps/trg-living`**
