# TRG Living Site — CLAUDE.md

## Overview

This is the TRG Living public site. It has its own brand identity separate from RequityOS and Requity Group.

## Tech Stack

- **Framework**: Next.js 14 (App Router) with TypeScript
- **Styling**: Tailwind CSS with custom brand tokens
- **Deployment**: TBD (Netlify or Vercel)

## Commands

```bash
pnpm dev          # Start dev server (port 3002)
pnpm build        # Production build
pnpm lint         # ESLint
```

## Key Rules

- No auth — this is a public site
- No direct Supabase access — use API routes only if needed
- Has its own brand identity and design tokens
- Use `@repo/lib` for shared utilities
- **Never import from `apps/requity-os` or `apps/requity-group`**
