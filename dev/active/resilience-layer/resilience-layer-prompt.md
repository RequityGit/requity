# Resilience Layer — Error Boundaries, Loading States, and Not-Found Pages

## Objective

Make every failure mode in the portal feel intentional, recoverable, and on-brand. Right now, a component crash produces a white screen, a slow query produces a blank page with no feedback, and a bad URL produces a generic Next.js 404. This prompt adds error boundaries, loading skeletons, and not-found pages to every major route so the portal feels bulletproof. This is the last piece of the foundation before the realtime pipeline board, because realtime introduces more failure modes (network drops, stale subscriptions, race conditions) and the portal needs to handle them gracefully.

This also plays into the gamified, culture-of-excellence vision: the best tools don't just work well when everything goes right. They handle failure so gracefully that users barely notice it happened. Think of how Linear's offline mode or Superhuman's error recovery makes you trust the tool more, not less. That's what we're building here.

---

## Current State

### Error Handling
- **1 root error boundary** (`app/error.tsx`) — catches root-level crashes, shows "Something went wrong" with a retry button
- **0 route-level error boundaries** — if a component inside `/pipeline`, `/contacts`, `/servicing`, or any other route crashes, the root boundary catches it and the entire page is replaced. The user loses all context (sidebar, tabs, filters).
- **0 client-side error boundaries** — if a single tab panel on the deal detail page crashes (e.g., bad data in the financials tab), the entire deal page dies. The user can't switch to a working tab.

### Loading States
- **0 `loading.tsx` files** anywhere in the app — Next.js shows nothing while server components fetch data. Users see a blank white area until the page renders.
- **Some components have inline skeletons** (PipelineLoading, DealDetailLoading referenced in CLAUDE.md) but these are not wired into the Next.js loading convention
- **No shared skeleton components** — each page that does have loading states builds its own

### Not-Found Pages
- **0 `not-found.tsx` files** — bad URLs show the default Next.js 404 page, which is completely unstyled and breaks the portal shell

---

## Design Philosophy

### Errors Should Feel Like Speed Bumps, Not Brick Walls

When something breaks, the user should:
1. **Never lose context** — sidebar, header, and navigation stay intact
2. **Understand what happened** — clear, human language, not "An unexpected error occurred"
3. **Have a recovery path** — retry button, link to go back, or at minimum, working navigation
4. **Trust the tool more** — a well-handled error builds confidence ("this tool knows when something's wrong and handles it")

### Loading Should Feel Like Anticipation, Not Waiting

When data is loading, the user should:
1. **See the page shape immediately** — skeletons show the layout before data arrives
2. **Know something is happening** — subtle shimmer animation (already have `rq-shimmer` keyframes)
3. **Never see a blank white screen** — every route has a loading state

### Not-Found Should Feel Like a Gentle Redirect

When a URL is wrong, the user should:
1. **Stay inside the portal** — sidebar, header, navigation all present
2. **Know what happened** — "This page doesn't exist" or "This deal was not found"
3. **Have somewhere to go** — link back to the relevant section

---

## Implementation

### Part 1: Shared Error Boundary Component

Create a reusable error component that can be used in both Next.js `error.tsx` files and as a client-side React error boundary wrapper.

```tsx
// components/shared/ErrorFallback.tsx

"use client";

import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface ErrorFallbackProps {
  title?: string;
  description?: string;
  reset?: () => void;
  backTo?: { label: string; href: string };
  compact?: boolean;    // For inline use (tab panels, cards)
}

export function ErrorFallback({
  title = "Something went wrong",
  description = "An error occurred while loading this section. Try again, or navigate away and come back.",
  reset,
  backTo,
  compact = false,
}: ErrorFallbackProps) {
  const router = useRouter();

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-8 px-4" : "min-h-[40vh] px-6"
      )}
    >
      <div className={cn(
        "rounded-full bg-muted/60 p-3 mb-4",
        compact && "p-2 mb-3"
      )}>
        <AlertTriangle
          className={cn(
            "text-muted-foreground/60",
            compact ? "h-5 w-5" : "h-6 w-6"
          )}
          strokeWidth={1.5}
        />
      </div>
      <h3 className={cn(
        "font-semibold text-foreground",
        compact ? "text-sm" : "text-base"
      )}>
        {title}
      </h3>
      <p className={cn(
        "mt-1.5 max-w-sm text-muted-foreground",
        compact ? "text-xs" : "text-sm"
      )}>
        {description}
      </p>
      <div className="mt-4 flex items-center gap-3">
        {reset && (
          <Button variant="outline" size="sm" onClick={reset} className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </Button>
        )}
        {backTo && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(backTo.href)}
            className="gap-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {backTo.label}
          </Button>
        )}
      </div>
    </div>
  );
}
```

### Part 2: Client-Side Error Boundary Wrapper

For wrapping individual sections (tabs, cards, panels) so one crash doesn't take down the whole page:

```tsx
// components/shared/SectionErrorBoundary.tsx

"use client";

import { Component, type ReactNode } from "react";
import { ErrorFallback } from "./ErrorFallback";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to Sentry or console
    console.error("SectionErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          title={this.props.fallbackTitle ?? "This section encountered an error"}
          description={this.props.fallbackDescription ?? "Try refreshing the page. If the problem persists, contact support."}
          reset={() => this.setState({ hasError: false, error: null })}
          compact
        />
      );
    }
    return this.props.children;
  }
}
```

### Part 3: Route-Level Error Boundaries (`error.tsx`)

Create `error.tsx` files for every major route group. These catch server-side and client-side errors within that route without taking down the sidebar/header.

**Authenticated admin routes:**

```tsx
// app/(authenticated)/(admin)/pipeline/error.tsx
"use client";
import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function PipelineError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Could not load pipeline"
      description="There was a problem loading the pipeline board. This is usually temporary."
      reset={reset}
    />
  );
}
```

Create similar files for each major route:

| File | Title |
|------|-------|
| `app/(authenticated)/(admin)/pipeline/error.tsx` | "Could not load pipeline" |
| `app/(authenticated)/(admin)/pipeline/[id]/error.tsx` | "Could not load deal" |
| `app/(authenticated)/(admin)/contacts/error.tsx` | "Could not load contacts" |
| `app/(authenticated)/(admin)/loans/error.tsx` | "Could not load loans" |
| `app/(authenticated)/(admin)/servicing/error.tsx` | "Could not load servicing" |
| `app/(authenticated)/(admin)/servicing/[loanId]/error.tsx` | "Could not load loan details" |
| `app/(authenticated)/(admin)/investors/error.tsx` | "Could not load investors" |
| `app/(authenticated)/(admin)/funds/error.tsx` | "Could not load funds" |
| `app/(authenticated)/(admin)/documents/error.tsx` | "Could not load documents" |
| `app/(authenticated)/(admin)/operations/error.tsx` | "Could not load operations" |
| `app/(authenticated)/(admin)/conditions/error.tsx` | "Could not load conditions" |
| `app/(authenticated)/(admin)/pricing/error.tsx` | "Could not load pricing" |
| `app/(authenticated)/(admin)/dialer/error.tsx` | "Could not load dialer" |
| `app/(authenticated)/control-center/error.tsx` | "Could not load control center" |
| `app/(authenticated)/i/error.tsx` | "Could not load investor portal" |
| `app/(authenticated)/b/error.tsx` | "Could not load borrower portal" |

Each file is ~15 lines. Same pattern, different title and description.

Also add `backTo` for detail pages so users can navigate back:

```tsx
// app/(authenticated)/(admin)/pipeline/[id]/error.tsx
<ErrorFallback
  title="Could not load deal"
  description="This deal may have been deleted, or there was a problem loading it."
  reset={reset}
  backTo={{ label: "Back to pipeline", href: "/pipeline" }}
/>
```

### Part 4: Shared Loading Skeletons

Create reusable skeleton components for the most common page patterns:

```tsx
// components/shared/skeletons/PageHeaderSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" />        {/* Title */}
      <Skeleton className="h-4 w-72" />        {/* Subtitle/breadcrumb */}
    </div>
  );
}

// components/shared/skeletons/TableSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="rounded-xl border border-border">
      {/* Header */}
      <div className="flex gap-4 border-b border-border px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b border-border last:border-0 px-4 py-3">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// components/shared/skeletons/CardGridSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

interface CardGridSkeletonProps {
  cards?: number;
}

export function CardGridSkeleton({ cards = 6 }: CardGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border p-5 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

// components/shared/skeletons/KanbanSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

export function KanbanSkeleton() {
  const columns = [4, 3, 2, 3, 1]; // Staggered card counts per column
  return (
    <div className="flex gap-4 overflow-hidden">
      {columns.map((cardCount, col) => (
        <div key={col} className="w-72 shrink-0 space-y-3">
          <div className="flex items-center justify-between px-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-8" />
          </div>
          <div className="space-y-2 rounded-lg bg-muted/30 p-2">
            {Array.from({ length: cardCount }).map((_, i) => (
              <Skeleton key={i} className="h-[130px] w-full rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// components/shared/skeletons/DetailPageSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

export function DetailPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Skeleton className="h-4 w-48" />
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      {/* Stage stepper */}
      <Skeleton className="h-12 w-full rounded-lg" />
      {/* KPI row */}
      <div className="flex gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 flex-1 rounded-lg" />
        ))}
      </div>
      {/* Tab bar */}
      <Skeleton className="h-10 w-full" />
      {/* Tab content */}
      <div className="rq-field-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// components/shared/skeletons/index.ts (barrel export)
export { PageHeaderSkeleton } from "./PageHeaderSkeleton";
export { TableSkeleton } from "./TableSkeleton";
export { CardGridSkeleton } from "./CardGridSkeleton";
export { KanbanSkeleton } from "./KanbanSkeleton";
export { DetailPageSkeleton } from "./DetailPageSkeleton";
```

### Part 5: Route-Level Loading States (`loading.tsx`)

Create `loading.tsx` files for every major route. These use the shared skeletons:

| File | Skeleton |
|------|---------|
| `app/(authenticated)/(admin)/pipeline/loading.tsx` | `<KanbanSkeleton />` |
| `app/(authenticated)/(admin)/pipeline/[id]/loading.tsx` | `<DetailPageSkeleton />` |
| `app/(authenticated)/(admin)/contacts/loading.tsx` | `<PageHeaderSkeleton /> + <TableSkeleton />` |
| `app/(authenticated)/(admin)/loans/loading.tsx` | `<PageHeaderSkeleton /> + <TableSkeleton />` |
| `app/(authenticated)/(admin)/servicing/loading.tsx` | `<PageHeaderSkeleton /> + <TableSkeleton />` |
| `app/(authenticated)/(admin)/servicing/[loanId]/loading.tsx` | `<DetailPageSkeleton />` |
| `app/(authenticated)/(admin)/investors/loading.tsx` | `<PageHeaderSkeleton /> + <TableSkeleton />` |
| `app/(authenticated)/(admin)/funds/loading.tsx` | `<PageHeaderSkeleton /> + <CardGridSkeleton />` |
| `app/(authenticated)/(admin)/documents/loading.tsx` | `<PageHeaderSkeleton /> + <TableSkeleton />` |
| `app/(authenticated)/(admin)/operations/loading.tsx` | `<PageHeaderSkeleton /> + <TableSkeleton />` |
| `app/(authenticated)/(admin)/conditions/loading.tsx` | `<PageHeaderSkeleton /> + <TableSkeleton />` |
| `app/(authenticated)/(admin)/pricing/loading.tsx` | `<PageHeaderSkeleton /> + <TableSkeleton />` |
| `app/(authenticated)/control-center/loading.tsx` | `<PageHeaderSkeleton /> + <TableSkeleton />` |
| `app/(authenticated)/i/loading.tsx` | `<PageHeaderSkeleton /> + <CardGridSkeleton />` |
| `app/(authenticated)/b/loading.tsx` | `<PageHeaderSkeleton /> + <TableSkeleton />` |

Each file is ~10 lines:

```tsx
// app/(authenticated)/(admin)/pipeline/loading.tsx
import { KanbanSkeleton } from "@/components/shared/skeletons";

export default function PipelineLoading() {
  return (
    <div className="space-y-6 p-6">
      <KanbanSkeleton />
    </div>
  );
}
```

### Part 6: Not-Found Pages

Create `not-found.tsx` for key routes:

```tsx
// app/not-found.tsx (root)
import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function NotFound() {
  return (
    <ErrorFallback
      title="Page not found"
      description="The page you're looking for doesn't exist or has been moved."
      backTo={{ label: "Go to dashboard", href: "/" }}
    />
  );
}
```

Route-specific not-found pages:

| File | Message | Back Link |
|------|---------|-----------|
| `app/(authenticated)/(admin)/pipeline/[id]/not-found.tsx` | "Deal not found" | Back to pipeline |
| `app/(authenticated)/(admin)/servicing/[loanId]/not-found.tsx` | "Loan not found" | Back to servicing |
| `app/(authenticated)/(admin)/investors/[id]/not-found.tsx` | "Investor not found" | Back to investors |
| `app/(authenticated)/(admin)/funds/[id]/not-found.tsx` | "Investment not found" | Back to funds |

### Part 7: Wrap Deal Detail Tabs in SectionErrorBoundary

The deal detail page has 11 lazy-loaded tabs. Each tab should be wrapped so a crash in one doesn't kill the whole page:

```tsx
// In DealDetailPage.tsx, wrap each lazy tab:
<SectionErrorBoundary fallbackTitle="Could not load overview">
  <Suspense fallback={<TabLoadingFallback />}>
    <EditableOverview ... />
  </Suspense>
</SectionErrorBoundary>
```

This applies to: Overview, Property, Borrower, Underwriting, Residential Analysis, Conditions, Documents, Tasks, Activity, Messages, Forms.

Also wrap the CRM contact/company 360 tabs and the loan servicing tabs with the same pattern.

### Part 8: Update Root Error Boundary

Upgrade `app/error.tsx` to use the shared component and match the design system:

```tsx
// app/error.tsx
"use client";
import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Something went wrong"
      description="An unexpected error occurred. Try again, or refresh the page."
      reset={reset}
      backTo={{ label: "Go to dashboard", href: "/" }}
    />
  );
}
```

---

## Why This Matters for the "Gamified Excellence" Vision

The best products don't just delight when things go right. They build trust by handling every edge case:

- **Loading skeletons = anticipation, not confusion.** When Luis navigates to a deal, he sees the page shape instantly. His brain starts processing the layout before data arrives. This is the same psychology that makes slot machines addictive: the anticipation of the reveal.

- **Error boundaries = resilience, not fragility.** When a bad data edge case crashes the financials tab, the rest of the deal page stays alive. Estefania can switch to Conditions, Documents, or any other tab. She doesn't lose her place. The tool feels sturdy, like a well-built machine.

- **Not-found pages = guidance, not dead ends.** When someone shares a link to a deal that's been archived, the user lands on a clean "Deal not found" page with a link back to the pipeline. They're never stranded.

- **Consistency across all states.** The portal now has a consistent, branded response for every possible state: data present (normal), data loading (skeleton), data empty (EmptyState component), data error (ErrorFallback), and data missing (not-found). Five states, all polished. That's what makes a tool feel world-class.

---

## Implementation Order

1. Create `components/shared/ErrorFallback.tsx`
2. Create `components/shared/SectionErrorBoundary.tsx`
3. Run `pnpm build`
4. Create shared skeleton components in `components/shared/skeletons/`
5. Run `pnpm build`
6. Add route-level `error.tsx` files (16 routes)
7. Add route-level `loading.tsx` files (15 routes)
8. Add `not-found.tsx` files (root + 4 detail routes)
9. Run `pnpm build`
10. Upgrade root `app/error.tsx`
11. Wrap deal detail tabs in `SectionErrorBoundary`
12. Wrap CRM 360 tabs in `SectionErrorBoundary`
13. Run `pnpm build`
14. Update CLAUDE.md

---

## CLAUDE.md Additions

Add to Critical Rules:

```markdown
17. **Every route has error.tsx and loading.tsx.** When creating a new route, always create both files. Error pages use `<ErrorFallback>` from `@/components/shared/ErrorFallback` with a context-specific title, description, and back link. Loading pages use shared skeletons from `@/components/shared/skeletons`. Lazy-loaded tab panels and card sections should be wrapped in `<SectionErrorBoundary>` so crashes are isolated. Never let a component crash take down an entire page.
```

Add to the Global CSS Utility Classes table or component reference:

```markdown
### Resilience Components
| Component | Purpose | Import |
|-----------|---------|--------|
| `<ErrorFallback>` | Error state for pages and sections | `@/components/shared/ErrorFallback` |
| `<SectionErrorBoundary>` | Client error boundary wrapper for tabs/cards | `@/components/shared/SectionErrorBoundary` |
| `<KanbanSkeleton>` | Loading skeleton for kanban boards | `@/components/shared/skeletons` |
| `<TableSkeleton>` | Loading skeleton for data tables | `@/components/shared/skeletons` |
| `<CardGridSkeleton>` | Loading skeleton for card grids | `@/components/shared/skeletons` |
| `<DetailPageSkeleton>` | Loading skeleton for detail pages | `@/components/shared/skeletons` |
| `<PageHeaderSkeleton>` | Loading skeleton for page headers | `@/components/shared/skeletons` |
```

---

## Scope

### IN
- `ErrorFallback` component (shared, styled)
- `SectionErrorBoundary` class component (client-side error isolation)
- 5 shared skeleton components
- 16 route-level `error.tsx` files
- 15 route-level `loading.tsx` files
- 5 `not-found.tsx` files
- `SectionErrorBoundary` wrappers on deal detail tabs, CRM 360 tabs, servicing tabs
- Upgraded root `error.tsx`
- CLAUDE.md rule

### OUT
- Sentry integration (already exists at global-error level, no changes needed)
- Offline mode / network error detection (future, pairs with realtime work)
- Retry with exponential backoff (future, would be nice for realtime subscription drops)
- Custom 500 page (Next.js handles this at the framework level)

---

## Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| `error.tsx` only works for errors thrown during render or in server components | Client-side crashes in event handlers still need try/catch. `SectionErrorBoundary` covers render-time crashes. |
| `loading.tsx` shows on every navigation, even fast ones (flash of skeleton) | Skeletons are lightweight and visually stable. A 50ms flash of skeleton is better than a 50ms flash of white. |
| `SectionErrorBoundary` is a class component (React limitation) | This is the only way to create error boundaries in React. The class is minimal and just delegates to `ErrorFallback`. |
| Many `error.tsx` and `loading.tsx` files to maintain | They're all 10-15 lines using shared components. Changes to the visual pattern happen in one place (ErrorFallback, skeletons). |
| Tab wrapping adds JSX nesting in DealDetailPage | The nesting is semantic (error isolation is a real feature). No visual or performance impact. |

---

## Success Criteria

1. Every major route has `error.tsx` and `loading.tsx`
2. Component crash in a deal tab doesn't take down the whole deal page
3. Navigation to any route shows a skeleton immediately (never blank white)
4. Bad URLs show a styled not-found page with navigation back
5. Error pages are on-brand (use design system colors, typography, spacing)
6. `pnpm build` passes with zero errors
7. CLAUDE.md updated with the rule and component reference

---

## Files Reference

### New Files

**Components:**
- `components/shared/ErrorFallback.tsx`
- `components/shared/SectionErrorBoundary.tsx`
- `components/shared/skeletons/PageHeaderSkeleton.tsx`
- `components/shared/skeletons/TableSkeleton.tsx`
- `components/shared/skeletons/CardGridSkeleton.tsx`
- `components/shared/skeletons/KanbanSkeleton.tsx`
- `components/shared/skeletons/DetailPageSkeleton.tsx`
- `components/shared/skeletons/index.ts`

**Route error boundaries (16):**
- `app/(authenticated)/(admin)/pipeline/error.tsx`
- `app/(authenticated)/(admin)/pipeline/[id]/error.tsx`
- `app/(authenticated)/(admin)/contacts/error.tsx`
- `app/(authenticated)/(admin)/loans/error.tsx`
- `app/(authenticated)/(admin)/servicing/error.tsx`
- `app/(authenticated)/(admin)/servicing/[loanId]/error.tsx`
- `app/(authenticated)/(admin)/investors/error.tsx`
- `app/(authenticated)/(admin)/funds/error.tsx`
- `app/(authenticated)/(admin)/documents/error.tsx`
- `app/(authenticated)/(admin)/operations/error.tsx`
- `app/(authenticated)/(admin)/conditions/error.tsx`
- `app/(authenticated)/(admin)/pricing/error.tsx`
- `app/(authenticated)/(admin)/dialer/error.tsx`
- `app/(authenticated)/control-center/error.tsx`
- `app/(authenticated)/i/error.tsx`
- `app/(authenticated)/b/error.tsx`

**Route loading states (15):**
- (Same routes as above, `loading.tsx` instead of `error.tsx`)

**Not-found pages (5):**
- `app/not-found.tsx`
- `app/(authenticated)/(admin)/pipeline/[id]/not-found.tsx`
- `app/(authenticated)/(admin)/servicing/[loanId]/not-found.tsx`
- `app/(authenticated)/(admin)/investors/[id]/not-found.tsx`
- `app/(authenticated)/(admin)/funds/[id]/not-found.tsx`

### Modified Files
- `app/error.tsx` — upgrade to use ErrorFallback
- `app/(authenticated)/(admin)/pipeline/[id]/DealDetailPage.tsx` — wrap tabs in SectionErrorBoundary
- CRM 360 detail pages — wrap tabs in SectionErrorBoundary
- Servicing detail page — wrap tabs in SectionErrorBoundary
- `CLAUDE.md` — add rule and component reference
