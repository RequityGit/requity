-- loan_condition_comments
-- Stores per-condition comments with internal/external visibility control.
-- is_internal = true  → admin-only (never visible to borrowers)
-- is_internal = false → visible to borrowers via their portal

create table loan_condition_comments (
  id           uuid        primary key default gen_random_uuid(),
  condition_id uuid        not null references loan_conditions(id) on delete cascade,
  loan_id      uuid        not null references loans(id) on delete cascade,
  author_id    uuid        references auth.users(id),
  author_name  text,                         -- denormalized for fast display
  comment      text        not null,
  is_internal  boolean     not null default false,
  created_at   timestamptz not null default now()
);

alter table loan_condition_comments enable row level security;

-- Admins: full CRUD
create policy "Admins manage condition comments"
  on loan_condition_comments for all
  using (is_admin())
  with check (is_admin());

-- Borrowers: read non-internal comments on their own loans
create policy "Borrowers read external condition comments"
  on loan_condition_comments for select
  using (
    is_internal = false
    and loan_id in (
      select l.id from loans l
      join borrowers b on b.id = l.borrower_id
      where b.id in (select * from my_borrower_ids())
    )
  );

-- Borrowers: post non-internal comments on their own loan conditions
create policy "Borrowers add external condition comments"
  on loan_condition_comments for insert
  with check (
    is_internal = false
    and (select auth.uid()) = author_id
    and loan_id in (
      select l.id from loans l
      join borrowers b on b.id = l.borrower_id
      where b.id in (select * from my_borrower_ids())
    )
  );

create index idx_condition_comments_condition_id on loan_condition_comments(condition_id);
create index idx_condition_comments_loan_id      on loan_condition_comments(loan_id);
