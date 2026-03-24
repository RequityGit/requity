# Blog Content System - Tasks

## Phase 1: Database & Infrastructure
- [x] Add blog workflow columns to site_insights (status, author, meta_description, etc.)
- [x] Add audience column to site_insights
- [x] Create indexes for status/date, slug, and audience
- [x] Create `publish_scheduled_blog_posts()` function
- [x] Set up pg_cron job `blog-auto-publish` (daily at 10:00 UTC)
- [x] Test auto-publish function end-to-end

## Phase 2: Website Pages
- [x] Build `/insights/[slug]` detail page with full SEO metadata
- [x] Build `/insights/[slug]/not-found.tsx` 404 page
- [x] Update `/insights` listing to link to detail pages
- [x] Add reading time and date to listing cards
- [x] Add `.article-body` CSS styles (headings, lists, blockquotes, tables, code, images)
- [x] Update `Insight` TypeScript interface with new fields
- [x] Switch listing page to direct Supabase query (multi-filter support)

## Phase 3: Content Pipeline
- [x] Create `content-guidelines.md` (master config)
- [x] Create Cowork scheduled task `weekly-blog-generation` (Thursdays 6 PM)
- [x] Generate first batch of 7 posts
- [x] Review and publish first batch
- [x] Update guidelines for 12% fixed rate (no rate shopping content)
- [x] Rewrite Monday post (5 Deals You Can Only Win with a Bridge Loan)
- [x] Rewrite Thursday post (Deal Flow and Opportunity, not rate tiers)
- [x] Fix existing published post (remove rate range language)

## Phase 4: Filtering & UX (Not Started)
- [ ] Add audience tab filters to /insights page (All / For Borrowers / For Investors)
- [ ] Add category tag filters within each tab
- [ ] Add search functionality (optional)

## Phase 5: Admin & Review (Not Started)
- [ ] Build blog draft review page in RequityOS portal
- [ ] Add approve/reject/edit controls
- [ ] Add preview functionality

## Phase 6: Distribution (Not Started)
- [ ] Sitemap generation for blog posts
- [ ] Social media auto-posting (LinkedIn)
- [ ] Email newsletter integration

## Last Updated: 2026-03-19
