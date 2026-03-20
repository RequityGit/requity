# Blog Content System - Implementation Plan

## Objective
Automated daily blog publishing on requitygroup.com/insights to drive SEO lead generation for both borrowers and investors, with a focus on bridge lending use cases and manufactured housing communities.

## Scope
- IN: Content generation, drip publishing, review workflow, SEO optimization, audience filtering
- OUT: Social media syndication, email newsletter integration, analytics/tracking setup

## Architecture

### Three Independent Systems

1. **Content Generation (Cowork Scheduled Task)**
   - Task ID: `weekly-blog-generation`
   - Schedule: Every Thursday at 6 PM ET
   - Reads `content-guidelines.md` from workspace for all rules and priorities
   - Generates 7 posts, inserts as drafts into `site_insights` with future `scheduled_publish_date`
   - Emails review doc to dylan@requitygroup.com

2. **Auto-Publish (Supabase pg_cron)**
   - Cron job: `blog-auto-publish` (job ID 13)
   - Schedule: Daily at 10:00 UTC (~6 AM ET)
   - Runs `publish_scheduled_blog_posts()` function
   - Publishes any drafts/approved posts where `scheduled_publish_date <= today`

3. **Website Rendering (Next.js on requitygroup.com)**
   - Listing page: `/insights` (filters by `status=published`, `is_published=true`)
   - Detail page: `/insights/[slug]` (full article with SEO metadata)
   - ISR revalidation: 300 seconds (5 minutes)

## Database Schema Additions

Table: `site_insights` (existing, extended)

New columns:
- `status` text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','published'))
- `author` text DEFAULT 'Requity Group'
- `meta_description` text
- `featured_image_url` text
- `scheduled_publish_date` date
- `reading_time_minutes` integer DEFAULT 5
- `category` text DEFAULT 'general'
- `audience` text NOT NULL DEFAULT 'both' CHECK (audience IN ('borrower','investor','both'))

New indexes:
- `idx_site_insights_status_date` on (status, published_date DESC)
- `idx_site_insights_slug` on (slug)
- `idx_site_insights_audience` on (audience)

New function:
- `publish_scheduled_blog_posts()` - SECURITY DEFINER, updates drafts to published based on date

## Files Modified/Created

### New Files
- `apps/requity-group/app/insights/[slug]/page.tsx` - Blog detail page
- `apps/requity-group/app/insights/[slug]/not-found.tsx` - 404 for bad slugs
- `content-guidelines.md` - Central config file for content generation

### Modified Files
- `apps/requity-group/app/insights/page.tsx` - Added links to detail pages, reading time, date ordering, status filter
- `apps/requity-group/app/globals/public.css` - Added `.article-body` typography styles
- `apps/requity-group/lib/types.ts` - Extended `Insight` interface with new fields

## Content Strategy
- 7 posts/week: 4 borrower, 2 investor, 1 SEO opportunistic
- At least 2 posts/week on mobile home parks / manufactured housing
- 12% interest-only rate is fixed; content focuses on use cases and deal economics, never rate shopping
- Most posts branded "Requity Group"; monthly thought leadership from Dylan, periodic from Luis and Jet

## Success Criteria
- Posts publish automatically on schedule without manual intervention
- Guidelines changes take effect on next Thursday batch
- Detail pages render with full SEO metadata (Open Graph, Twitter cards)
- No rate comparison or rate shopping content in any post
