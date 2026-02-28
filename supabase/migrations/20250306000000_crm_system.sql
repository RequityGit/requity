-- =============================================================================
-- CRM System Migration
-- =============================================================================
-- Creates the CRM subsystem for lead/contact management and interaction tracking:
--   - crm_contacts: Leads, prospects, and general contacts
--   - crm_activities: Interaction log (calls, emails, meetings, notes)
--   - RLS policies for both tables
--   - Indexes for common query patterns
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. CRM CONTACTS
-- ---------------------------------------------------------------------------
create table public.crm_contacts (
  id uuid default gen_random_uuid() primary key,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  company_name text,
  contact_type text default 'lead'
    check (contact_type in ('lead', 'prospect', 'borrower', 'investor', 'broker', 'vendor', 'other')),
  source text
    check (source in ('referral', 'website', 'cold_call', 'social_media', 'conference', 'existing_relationship', 'other')),
  status text default 'active'
    check (status in ('active', 'nurturing', 'qualified', 'converted', 'inactive', 'do_not_contact')),
  assigned_to uuid references public.profiles(id),
  borrower_id uuid references public.borrowers(id),
  notes text,
  address_line1 text,
  city text,
  state text,
  zip text,
  tags text[],
  last_contacted_at timestamptz,
  next_follow_up_date date,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- 2. CRM ACTIVITIES
-- ---------------------------------------------------------------------------
create table public.crm_activities (
  id uuid default gen_random_uuid() primary key,
  contact_id uuid references public.crm_contacts(id) on delete cascade not null,
  activity_type text not null
    check (activity_type in ('call', 'email', 'meeting', 'note', 'text_message', 'follow_up', 'deal_update')),
  subject text,
  description text,
  outcome text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- 3. INDEXES
-- ---------------------------------------------------------------------------
create index idx_crm_contacts_status on public.crm_contacts(status);
create index idx_crm_contacts_contact_type on public.crm_contacts(contact_type);
create index idx_crm_contacts_assigned_to on public.crm_contacts(assigned_to);
create index idx_crm_contacts_next_follow_up on public.crm_contacts(next_follow_up_date);
create index idx_crm_contacts_borrower_id on public.crm_contacts(borrower_id);
create index idx_crm_activities_contact_id on public.crm_activities(contact_id);
create index idx_crm_activities_type on public.crm_activities(activity_type);

-- ---------------------------------------------------------------------------
-- 4. ENABLE ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
alter table public.crm_contacts enable row level security;
alter table public.crm_activities enable row level security;

-- ---------------------------------------------------------------------------
-- 5. RLS POLICIES
-- ---------------------------------------------------------------------------

-- crm_contacts: admin-only access
create policy "Admins can select crm_contacts"
  on public.crm_contacts for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can insert crm_contacts"
  on public.crm_contacts for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update crm_contacts"
  on public.crm_contacts for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can delete crm_contacts"
  on public.crm_contacts for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- crm_activities: admin-only access
create policy "Admins can select crm_activities"
  on public.crm_activities for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can insert crm_activities"
  on public.crm_activities for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update crm_activities"
  on public.crm_activities for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can delete crm_activities"
  on public.crm_activities for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ---------------------------------------------------------------------------
-- 6. UPDATED_AT TRIGGER FOR CRM CONTACTS
-- ---------------------------------------------------------------------------
create trigger set_crm_contacts_updated_at
  before update on public.crm_contacts
  for each row execute procedure public.set_updated_at();
