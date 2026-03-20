# RequityOS Active Workflows & Automations

> Central reference for all scheduled jobs, cron tasks, and automated workflows.
> Last updated: 2026-03-19

---

## Cowork Scheduled Tasks

These run in Claude/Cowork on the user's machine. They require Cowork to be running (or will execute on next launch if missed).

| Task ID | Schedule | Description |
|---------|----------|-------------|
| `weekly-blog-generation` | Thursdays 6 PM ET | Generates 7 blog posts for the following week, inserts as drafts into `site_insights`, emails review doc to Dylan. Reads `content-guidelines.md` for all rules. |
| `weekly-linkedin-posts` | Mondays 7 AM ET | Generates 7 themed LinkedIn post ideas for Dylan. |
| `npla-linkedin-connections` | One-time (3/20/2026 9 AM ET) | Sends 15 LinkedIn connection requests to remaining NPLA Miami contacts. |

---

## Supabase pg_cron Jobs

These run inside Postgres on Supabase's infrastructure 24/7. They do not depend on any external service.

| Job ID | Name | Schedule (UTC) | What It Does |
|--------|------|----------------|--------------|
| 1 | `check-sop-staleness` | Daily 13:00 | Marks SOPs as 'stale' if not reviewed in 90 days. |
| 2 | `generate-recurring-tasks` | Daily 10:00 | Runs `generate_recurring_tasks()` for task management. |
| 5 | `fetch-intake-emails` | Every 2 min | Calls edge function to pull emails from intake inbox. |
| 7 | `retell-daily-briefing` | Daily 23:00 | Triggers daily briefing edge function for Retell AI. |
| 8 | `stale-condition-reminders` | Daily 14:00, 20:00 | Sends reminders for stale underwriting conditions. |
| 9 | `send-notification-batches` | Every 5 min | Processes queued notification batches. |
| 10 | `retell-weekly-qa` | Mondays 00:00 | Triggers weekly QA review for Retell AI. |
| 11 | `retell-sheet-sync-midday` | Daily 16:30 | Syncs Retell data to Google Sheets (midday). |
| 12 | `retell-sheet-sync-evening` | Daily 23:30 | Syncs Retell data to Google Sheets (evening). |
| 13 | `blog-auto-publish` | Daily 10:00 | Publishes blog drafts whose `scheduled_publish_date` has arrived. Runs `publish_scheduled_blog_posts()`. |

---

## Supabase Edge Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `fetch-intake-emails` | pg_cron (every 2 min) | Pulls emails from intake inbox into RequityOS. |
| `retell-daily-briefing` | pg_cron (daily) | Generates daily briefing for Retell AI phone system. |
| `retell-weekly-qa` | pg_cron (weekly) | Generates weekly QA report for Retell AI. |
| `retell-sheet-sync` | pg_cron (2x daily) | Syncs Retell call data to Google Sheets. |
| `stale-condition-reminders` | pg_cron (2x daily) | Emails reminders for overdue underwriting conditions. |
| `send-notification-batches` | pg_cron (every 5 min) | Sends queued email/push notifications. |

---

## Postgres Functions (Called by Cron)

| Function | Called By | Purpose |
|----------|-----------|---------|
| `generate_recurring_tasks()` | Job 2 | Creates recurring task instances based on templates. |
| `publish_scheduled_blog_posts()` | Job 13 | Flips blog drafts to published when their `scheduled_publish_date` arrives. Updates `status`, `is_published`, and `updated_at`. |

---

## Key Config Files

| File | Purpose | Who Edits |
|------|---------|-----------|
| `content-guidelines.md` (repo root) | Blog content strategy: topics, priorities, writing rules, SEO keywords, schedule. Read by `weekly-blog-generation` task. | Dylan / Grethel |

---

## How to Manage

### Add a new pg_cron job
```sql
SELECT cron.schedule('job-name', '0 10 * * *', $$SQL HERE$$);
```

### View all cron jobs
```sql
SELECT jobid, jobname, schedule, command FROM cron.job ORDER BY jobid;
```

### Disable a cron job
```sql
SELECT cron.unschedule('job-name');
```

### View cron job run history
```sql
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
```

### Manage Cowork scheduled tasks
View and manage from the "Scheduled" section in the Cowork sidebar, or use the `list_scheduled_tasks` / `update_scheduled_task` / `create_scheduled_task` tools.
