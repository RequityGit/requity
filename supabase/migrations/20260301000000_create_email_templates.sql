-- Email Templates table
create table public.email_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  subject text not null default '',
  category text not null default 'general',
  html_body text not null default '',
  variables jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-update updated_at
create trigger set_email_templates_updated_at
  before update on public.email_templates
  for each row execute function public.set_updated_at();

-- Email Template Versions table (version history)
create table public.email_template_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.email_templates(id) on delete cascade,
  version_number integer not null,
  subject text not null default '',
  html_body text not null default '',
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Index for fast version lookups
create index idx_email_template_versions_template_id
  on public.email_template_versions(template_id, version_number desc);

-- Unique constraint: one version number per template
alter table public.email_template_versions
  add constraint uq_template_version unique (template_id, version_number);

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
