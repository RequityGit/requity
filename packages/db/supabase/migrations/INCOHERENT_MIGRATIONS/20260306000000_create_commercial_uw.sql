-- Commercial Underwriting versions table
create table if not exists public.commercial_uw (
  id uuid primary key default gen_random_uuid(),
  deal_id text not null,
  version integer not null default 1,
  status text not null default 'draft' check (status in ('draft', 'active')),
  data jsonb not null default '{}',
  created_by text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint commercial_uw_deal_version_unique unique (deal_id, version)
);

-- Index for fast lookups by deal
create index if not exists idx_commercial_uw_deal_id on public.commercial_uw (deal_id);

-- RLS
alter table public.commercial_uw enable row level security;

-- Allow authenticated users to read/write (adjust as needed)
create policy "Authenticated users can read commercial_uw"
  on public.commercial_uw for select
  to authenticated
  using (true);

create policy "Authenticated users can insert commercial_uw"
  on public.commercial_uw for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update commercial_uw"
  on public.commercial_uw for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete commercial_uw"
  on public.commercial_uw for delete
  to authenticated
  using (true);
