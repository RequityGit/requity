-- =============================================================================
-- Requity Group Unified Portal - Initial Schema Migration
-- =============================================================================
-- This migration creates the complete database schema including:
--   - Core tables (profiles, funds, commitments, calls, distributions,
--     loans, draw requests, payments, documents)
--   - Row Level Security (RLS) policies for every table
--   - Storage buckets and their RLS policies
--   - Trigger functions for auto-profile creation and updated_at timestamps
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. PROFILES
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  company_name text,
  phone text,
  role text not null check (role in ('investor', 'borrower', 'admin')),
  activation_status text default 'activated'
    check (activation_status in ('pending', 'link_sent', 'activated')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- 2. FUNDS
-- ---------------------------------------------------------------------------
create table public.funds (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  fund_type text check (fund_type in ('debt', 'equity', 'hybrid')),
  target_size numeric,
  current_aum numeric default 0,
  vintage_year int,
  irr_target numeric,
  preferred_return numeric,
  management_fee numeric,
  description text,
  status text default 'open' check (status in ('open', 'closed', 'fully_deployed')),
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- 3. INVESTOR COMMITMENTS (unfunded_amount is a generated column)
-- ---------------------------------------------------------------------------
create table public.investor_commitments (
  id uuid default gen_random_uuid() primary key,
  investor_id uuid references public.profiles(id) not null,
  fund_id uuid references public.funds(id) not null,
  commitment_amount numeric not null,
  funded_amount numeric default 0,
  unfunded_amount numeric generated always as (commitment_amount - funded_amount) stored,
  commitment_date date,
  status text default 'active' check (status in ('active', 'partially_called', 'fully_called', 'redeemed')),
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- 4. CAPITAL CALLS
-- ---------------------------------------------------------------------------
create table public.capital_calls (
  id uuid default gen_random_uuid() primary key,
  fund_id uuid references public.funds(id) not null,
  investor_id uuid references public.profiles(id) not null,
  commitment_id uuid references public.investor_commitments(id),
  call_amount numeric not null,
  due_date date not null,
  status text default 'pending' check (status in ('pending', 'paid', 'overdue')),
  paid_date date,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- 5. DISTRIBUTIONS
-- ---------------------------------------------------------------------------
create table public.distributions (
  id uuid default gen_random_uuid() primary key,
  fund_id uuid references public.funds(id) not null,
  investor_id uuid references public.profiles(id) not null,
  commitment_id uuid references public.investor_commitments(id),
  distribution_type text check (distribution_type in ('income', 'return_of_capital', 'gain')),
  amount numeric not null,
  distribution_date date default current_date,
  description text,
  status text default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- 6. LOANS (ltv is a generated column)
-- ---------------------------------------------------------------------------
create sequence if not exists loan_number_seq start 1001;

create table public.loans (
  id uuid default gen_random_uuid() primary key,
  borrower_id uuid references public.profiles(id) not null,
  loan_number text default ('LN-' || nextval('loan_number_seq')::text) unique,
  loan_type text check (loan_type in ('bridge_residential', 'bridge_commercial', 'fix_and_flip', 'ground_up', 'stabilized')),
  property_address text,
  property_city text,
  property_state text,
  property_zip text,
  loan_amount numeric not null,
  appraised_value numeric,
  ltv numeric generated always as (
    case when appraised_value > 0 then loan_amount / appraised_value else null end
  ) stored,
  interest_rate numeric,
  term_months int,
  origination_date date,
  maturity_date date,
  stage text default 'lead' check (stage in ('lead', 'underwriting', 'approved', 'docs_out', 'closed', 'funded', 'servicing', 'payoff', 'default', 'reo', 'paid_off')),
  stage_updated_at timestamptz default now(),
  originator text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- 7. DRAW REQUESTS
-- ---------------------------------------------------------------------------
create table public.draw_requests (
  id uuid default gen_random_uuid() primary key,
  loan_id uuid references public.loans(id) not null,
  borrower_id uuid references public.profiles(id) not null,
  draw_number int not null default 1,
  amount_requested numeric not null,
  amount_approved numeric,
  description text,
  status text default 'submitted' check (status in ('submitted', 'under_review', 'approved', 'funded', 'rejected')),
  submitted_at timestamptz default now(),
  reviewed_at timestamptz,
  reviewer_notes text
);

-- ---------------------------------------------------------------------------
-- 8. LOAN PAYMENTS
-- ---------------------------------------------------------------------------
create table public.loan_payments (
  id uuid default gen_random_uuid() primary key,
  loan_id uuid references public.loans(id) not null,
  borrower_id uuid references public.profiles(id) not null,
  payment_number int,
  amount_due numeric not null,
  amount_paid numeric default 0,
  principal_amount numeric,
  interest_amount numeric,
  due_date date not null,
  paid_date date,
  status text default 'pending' check (status in ('pending', 'paid', 'overdue', 'partial')),
  notes text,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- 9. DOCUMENTS
-- ---------------------------------------------------------------------------
create table public.documents (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.profiles(id) not null,
  uploaded_by uuid references public.profiles(id),
  document_type text not null default 'other',
  file_name text not null,
  description text,
  file_path text not null,
  file_size bigint,
  mime_type text,
  fund_id uuid references public.funds(id),
  loan_id uuid references public.loans(id),
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);


-- ===========================================================================
-- 10. ENABLE ROW LEVEL SECURITY ON EVERY TABLE
-- ===========================================================================
alter table public.profiles enable row level security;
alter table public.funds enable row level security;
alter table public.investor_commitments enable row level security;
alter table public.capital_calls enable row level security;
alter table public.distributions enable row level security;
alter table public.loans enable row level security;
alter table public.draw_requests enable row level security;
alter table public.loan_payments enable row level security;
alter table public.documents enable row level security;


-- ===========================================================================
-- 11. ROW LEVEL SECURITY POLICIES
-- ===========================================================================

-- ---- profiles -------------------------------------------------------------
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can insert profiles"
  on public.profiles for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update profiles"
  on public.profiles for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can delete profiles"
  on public.profiles for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ---- funds ----------------------------------------------------------------
create policy "Investors can view funds"
  on public.funds for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'investor'));

create policy "Admins can view funds"
  on public.funds for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can insert funds"
  on public.funds for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update funds"
  on public.funds for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can delete funds"
  on public.funds for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ---- investor_commitments -------------------------------------------------
create policy "Investors can view own commitments"
  on public.investor_commitments for select
  using (investor_id = auth.uid());

create policy "Admins can select investor_commitments"
  on public.investor_commitments for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can insert investor_commitments"
  on public.investor_commitments for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update investor_commitments"
  on public.investor_commitments for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can delete investor_commitments"
  on public.investor_commitments for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ---- capital_calls --------------------------------------------------------
create policy "Investors can view own capital_calls"
  on public.capital_calls for select
  using (investor_id = auth.uid());

create policy "Admins can select capital_calls"
  on public.capital_calls for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can insert capital_calls"
  on public.capital_calls for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update capital_calls"
  on public.capital_calls for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can delete capital_calls"
  on public.capital_calls for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ---- distributions --------------------------------------------------------
create policy "Investors can view own distributions"
  on public.distributions for select
  using (investor_id = auth.uid());

create policy "Admins can select distributions"
  on public.distributions for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can insert distributions"
  on public.distributions for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update distributions"
  on public.distributions for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can delete distributions"
  on public.distributions for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ---- loans ----------------------------------------------------------------
create policy "Borrowers can view own loans"
  on public.loans for select
  using (borrower_id = auth.uid());

create policy "Admins can select loans"
  on public.loans for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can insert loans"
  on public.loans for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update loans"
  on public.loans for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can delete loans"
  on public.loans for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ---- draw_requests --------------------------------------------------------
create policy "Borrowers can view own draw_requests"
  on public.draw_requests for select
  using (borrower_id = auth.uid());

create policy "Borrowers can insert own draw_requests"
  on public.draw_requests for insert
  with check (borrower_id = auth.uid());

create policy "Admins can select draw_requests"
  on public.draw_requests for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can insert draw_requests"
  on public.draw_requests for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update draw_requests"
  on public.draw_requests for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can delete draw_requests"
  on public.draw_requests for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ---- loan_payments --------------------------------------------------------
create policy "Borrowers can view own loan_payments"
  on public.loan_payments for select
  using (borrower_id = auth.uid());

create policy "Admins can select loan_payments"
  on public.loan_payments for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can insert loan_payments"
  on public.loan_payments for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update loan_payments"
  on public.loan_payments for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can delete loan_payments"
  on public.loan_payments for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ---- documents ------------------------------------------------------------
create policy "Owners can view own documents"
  on public.documents for select
  using (owner_id = auth.uid());

create policy "Admins can select documents"
  on public.documents for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can insert documents"
  on public.documents for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update documents"
  on public.documents for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can delete documents"
  on public.documents for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Uploaders can insert documents for themselves
create policy "Users can upload own documents"
  on public.documents for insert
  with check (owner_id = auth.uid());


-- ===========================================================================
-- 12. STORAGE BUCKETS
-- ===========================================================================
insert into storage.buckets (id, name, public) values ('investor-documents', 'investor-documents', false);
insert into storage.buckets (id, name, public) values ('loan-documents', 'loan-documents', false);


-- ===========================================================================
-- 13. STORAGE RLS POLICIES
-- ===========================================================================

-- ---- investor-documents bucket --------------------------------------------
create policy "Investors can view own investor-documents"
  on storage.objects for select
  using (
    bucket_id = 'investor-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'investor')
  );

create policy "Admins full access to investor-documents"
  on storage.objects for all
  using (
    bucket_id = 'investor-documents'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  )
  with check (
    bucket_id = 'investor-documents'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ---- loan-documents bucket ------------------------------------------------
create policy "Borrowers can view own loan-documents"
  on storage.objects for select
  using (
    bucket_id = 'loan-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'borrower')
  );

create policy "Borrowers can upload own loan-documents"
  on storage.objects for insert
  with check (
    bucket_id = 'loan-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'borrower')
  );

create policy "Admins full access to loan-documents"
  on storage.objects for all
  using (
    bucket_id = 'loan-documents'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  )
  with check (
    bucket_id = 'loan-documents'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );


-- ===========================================================================
-- 14. AUTO-CREATE PROFILE ON SIGN-UP
-- ===========================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'role', 'borrower'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ===========================================================================
-- 15. UPDATED_AT TRIGGER FUNCTION + TRIGGERS
-- ===========================================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger set_loans_updated_at
  before update on public.loans
  for each row execute procedure public.set_updated_at();
