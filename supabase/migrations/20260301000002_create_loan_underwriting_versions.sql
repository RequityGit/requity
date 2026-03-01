-- Create loan_underwriting_versions table for deal calculator / underwriting engine
create table if not exists public.loan_underwriting_versions (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loans(id) on delete cascade,
  version_number integer not null default 1,
  is_active boolean not null default false,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  label text,
  notes text,
  calculator_inputs jsonb not null default '{}'::jsonb,
  calculator_outputs jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved', 'rejected')),
  unique (loan_id, version_number)
);

-- Index for fast lookups
create index idx_underwriting_versions_loan_id on public.loan_underwriting_versions(loan_id);
create index idx_underwriting_versions_active on public.loan_underwriting_versions(loan_id) where is_active = true;

-- Auto-increment version_number per loan via trigger
create or replace function public.set_underwriting_version_number()
returns trigger as $$
begin
  select coalesce(max(version_number), 0) + 1
  into new.version_number
  from public.loan_underwriting_versions
  where loan_id = new.loan_id;
  return new;
end;
$$ language plpgsql;

create trigger trg_underwriting_version_number
  before insert on public.loan_underwriting_versions
  for each row execute function public.set_underwriting_version_number();

-- Function to set active version (deactivates all others for the loan)
create or replace function public.set_active_underwriting_version(p_version_id uuid)
returns void as $$
declare
  v_loan_id uuid;
begin
  select loan_id into v_loan_id
  from public.loan_underwriting_versions
  where id = p_version_id;

  if v_loan_id is null then
    raise exception 'Underwriting version not found';
  end if;

  update public.loan_underwriting_versions
  set is_active = false
  where loan_id = v_loan_id and is_active = true;

  update public.loan_underwriting_versions
  set is_active = true
  where id = p_version_id;
end;
$$ language plpgsql security definer;

-- Enable RLS
alter table public.loan_underwriting_versions enable row level security;

-- RLS: Admins can do everything
create policy "Admins full access on underwriting versions"
  on public.loan_underwriting_versions
  for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- RLS: Internal users (non-borrowers) can view
create policy "Internal users can view underwriting versions"
  on public.loan_underwriting_versions
  for select
  to authenticated
  using (
    is_admin()
    or exists (
      select 1 from public.user_roles
      where user_id = (select auth.uid())
      and role in ('admin', 'super_admin', 'investor')
    )
  );
