# TRG Living Admin Panel - Tasks

## Phase 1: Environment & Sync
- [x] Reconcile monorepo migration history and timestamps
- [x] Provision "Master Foundation" local database state
- [x] Resolve environment-specific network port collisions
- [x] Merge upstream commits and unify workspace dependencies

## Phase 2: Security & Authentication
- [x] Deploy modern SSR cookie management factory
- [x] Build secure, resilient Login interface
- [x] Implement Middleware-level route protection for admin directories
- [x] Harden RLS policies across 8 domain-specific tables
- [x] Verify Admin role assignments in shared identity tables

## Phase 3: CMS & Media Architecture
- [x] Implement relational schema for property marketing hierarchy
- [x] Deploy centralized Media Library with storage bucket integration
- [x] Build asynchronous asset upload and thumbnail preview pipeline
- [x] Implement dynamic gallery views with accessibility support
- [x] Standardize automated URL slug generation logic
- [x] Configure public pages for real-time data synchronization

## Phase 4: Production Alignment
- [x] Synchronize Cloud and Local structural column parity
- [x] Verify performance index parity for relational scaling
- [x] Deploy CMS infrastructure to production hosting via feature branch
- [x] Implement idempotent database update scripts
- [x] Standardize global container to 1440px (Navigation, Hero, Main)
- [x] Split Hero to Homepage
- [x] Implement dynamic breadcrumb navigation in community routes
- [x] Verify font-parity with Inter Google Font integration
- [x] Implement server-side HTML scraper via cheerio
- [x] Build /api/listings route with city filtering and caching
- [x] Build listings grid UI component
- [x] Integrate listings grid into community pages

## Phase 5: Admin Form Architecture & Content Management
- [x] Unify New and Edit community forms into shared CommunityForm component
- [x] Refactor data fetching to server components
- [x] Eliminate client-side useEffect data fetching in favor of server-side props
- [x] Implement RichTextEditor (Tiptap) for community description fields
- [x] Resolve SSR hydration mismatch via dynamic imports with ssr: false
- [x] Implement hero image preview with optimistic clear on new selection
- [x] Build AmenityPicker component with icon rendering via CSS mask technique
- [x] Implement prefix guard and maxSelection cap on AmenityPicker
- [x] Wire amenity assignments to junction table
- [x] Gallery and amenity panels to edit-only context
- [x] Harden update payload — strip all join fields before Postgres write
- [x] Fix state_code input with maxLength={2} and .toUpperCase() to prevent DB truncation error
- [x] Add Next.js 15 migration readiness (params destructuring pattern)
- [x] Resolve sanitize-html adoption to replace isomorphic-dompurify (jsdom SSR conflict)