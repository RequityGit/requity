-- Email Templates table
create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  notification_type_id uuid references public.notification_types(id) on delete set null,
  slug text unique not null,
  display_name text not null,
  subject_template text not null,
  html_body_template text not null,
  text_body_template text,
  available_variables jsonb not null default '[]'::jsonb,
  preview_data jsonb,
  last_edited_by uuid references auth.users(id) on delete set null,
  last_edited_at timestamptz,
  version integer not null default 1,
  is_active boolean not null default true
);

-- Auto-update updated_at
create trigger set_email_templates_updated_at
  before update on public.email_templates
  for each row execute function public.set_updated_at();

-- Email Template Versions table (version history)
create table if not exists public.email_template_versions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  template_id uuid not null references public.email_templates(id) on delete cascade,
  version integer not null,
  subject_template text not null,
  html_body_template text not null,
  text_body_template text,
  edited_by uuid references auth.users(id) on delete set null,
  change_notes text
);

-- Index for fast version lookups
create index if not exists idx_email_template_versions_template_id
  on public.email_template_versions(template_id, version desc);

-- Unique constraint: one version number per template
alter table public.email_template_versions
  add constraint uq_template_version unique (template_id, version);

-- Enable RLS
alter table public.email_templates enable row level security;
alter table public.email_template_versions enable row level security;

-- RLS policies for email_templates (admin-only CRUD)
create policy "Admins can view email templates"
  on public.email_templates for select
  to authenticated
  using (public.is_admin());

create policy "Admins can insert email templates"
  on public.email_templates for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update email templates"
  on public.email_templates for update
  to authenticated
  using (public.is_admin());

create policy "Admins can delete email templates"
  on public.email_templates for delete
  to authenticated
  using (public.is_admin());

-- RLS policies for email_template_versions (admin-only read, system writes)
create policy "Admins can view template versions"
  on public.email_template_versions for select
  to authenticated
  using (public.is_admin());

create policy "Admins can insert template versions"
  on public.email_template_versions for insert
  to authenticated
  with check (public.is_admin());
