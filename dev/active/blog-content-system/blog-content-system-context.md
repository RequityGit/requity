# Blog Content System - Context

## Key Files

| File | Purpose |
|------|---------|
| `content-guidelines.md` (repo root) | Master config for content generation. Edit this to change topics, priorities, tone, keywords, schedule. |
| `apps/requity-group/app/insights/page.tsx` | Insights listing page. Queries `site_insights` for published posts, ordered by date. |
| `apps/requity-group/app/insights/[slug]/page.tsx` | Blog detail page. Full article rendering with hero, meta, related posts, SEO. |
| `apps/requity-group/app/insights/[slug]/not-found.tsx` | 404 page for invalid slugs. |
| `apps/requity-group/app/globals/public.css` | Contains `.article-body` styles for blog typography. |
| `apps/requity-group/lib/types.ts` | `Insight` interface with all blog fields. |
| `apps/requity-group/lib/supabase.ts` | Supabase client (anon key, public reads). |

## Supabase Resources

| Resource | Details |
|----------|---------|
| Table | `site_insights` |
| pg_cron job | `blog-auto-publish` (job ID 13), daily at 10:00 UTC |
| Function | `public.publish_scheduled_blog_posts()` |
| RLS | Public read, admin write |
| Migrations | `add_blog_workflow_fields_to_site_insights`, `add_audience_column_to_site_insights`, `create_blog_auto_publish_cron` |

## Cowork Scheduled Task

| Field | Value |
|-------|-------|
| Task ID | `weekly-blog-generation` |
| Schedule | Every Thursday at 6 PM ET |
| Location | `/Users/dylanmarma/Documents/Claude/Scheduled/weekly-blog-generation/SKILL.md` |
| Reads | `content-guidelines.md` from mounted workspace |
| Writes | Inserts 7 rows into `site_insights` with status='draft' |
| Emails | Review doc to dylan@requitygroup.com |

## Decisions Made

1. **No markdown library.** Blog content stored as HTML in `body_content`. AI generates HTML directly. Avoids a dependency.
2. **pg_cron over edge function for auto-publish.** Simpler, no auth tokens needed, no HTTP calls. Just a SQL UPDATE.
3. **12% rate is fixed.** All content frames bridge loans through deal economics and speed, never rate comparison. Hardcoded in guidelines.
4. **MHP priority: 2+ posts/week.** Manufactured housing is a strategic focus area. Guidelines enforce minimum frequency.
5. **Batch approve workflow.** Thursday generation, Friday-Sunday review window, Monday auto-publish starts. If no response, posts go live on schedule.
6. **Audience column for future filtering.** Added `audience` field (borrower/investor/both) for tab filtering on the insights page. UI filters not yet built.

## Gotchas Discovered

- pnpm cannot install packages in the mounted workspace from Cowork sandbox (EPERM on temp files). Workaround: avoid new dependencies or install globally.
- `fetchSiteData` helper only supports one `.eq()` filter. Switched to direct `supabase.from().select()` for multi-filter queries on the listing page.
- ISR revalidation is 300 seconds. New posts take up to 5 minutes to appear after publish.

## Not Yet Built
- Audience tab filters on `/insights` page (For Borrowers / For Investors / All)
- Category tag filters within each tab
- Blog post admin/review page in RequityOS portal
- Social media syndication
- Email newsletter integration
- Sitemap generation for blog posts

## Last Updated: 2026-03-19
## Next Steps: Build audience tab filters on /insights page. Consider adding a lightweight review UI in RequityOS.
