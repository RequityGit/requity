-- Workflow Rules Engine: Core Tables
-- workflow_definitions, workflow_stages, workflow_rules,
-- workflow_instances, workflow_stage_history, tasks, task_comments, task_documents

create table if not exists workflow_definitions (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  entity_type   text not null,
  is_active     boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create table if not exists workflow_stages (
  id               uuid primary key default gen_random_uuid(),
  workflow_id      uuid references workflow_definitions(id) on delete cascade,
  name             text not null,
  slug             text not null,
  position         integer not null,
  is_terminal      boolean default false,
  warn_after_days  integer,
  alert_after_days integer,
  borrower_label   text,
  created_at       timestamptz default now(),
  unique(workflow_id, slug)
);

create table if not exists workflow_rules (
  id                    uuid primary key default gen_random_uuid(),
  workflow_id           uuid references workflow_definitions(id) on delete cascade,
  name                  text not null,
  is_active             boolean default true,
  trigger_type          text not null,
  trigger_stage_id      uuid references workflow_stages(id),
  trigger_days          integer,
  action_type           text not null,
  task_title_template   text,
  task_description      text,
  task_category         text,
  task_priority         text default 'high',
  task_is_approval      boolean default false,
  assign_to_role        text,
  assign_to_user_id     uuid references auth.users(id),
  requestor_role        text,
  due_days_offset       integer,
  due_anchor            text default 'trigger_date',
  notify_roles          text[],
  notify_user_ids       uuid[],
  notification_title    text,
  notification_body     text,
  notification_type     text,
  is_blocking           boolean default false,
  execution_order       integer default 0,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

create table if not exists workflow_instances (
  id                uuid primary key default gen_random_uuid(),
  workflow_id       uuid references workflow_definitions(id),
  entity_type       text not null,
  entity_id         uuid not null,
  current_stage_id  uuid references workflow_stages(id),
  previous_stage_id uuid references workflow_stages(id),
  status            text default 'active',
  started_at        timestamptz default now(),
  completed_at      timestamptz,
  metadata          jsonb default '{}'::jsonb,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create table if not exists workflow_stage_history (
  id              uuid primary key default gen_random_uuid(),
  instance_id     uuid references workflow_instances(id) on delete cascade,
  from_stage_id   uuid references workflow_stages(id),
  to_stage_id     uuid references workflow_stages(id),
  transitioned_by uuid references auth.users(id),
  note            text,
  created_at      timestamptz default now()
);

create table if not exists tasks (
  id                    uuid primary key default gen_random_uuid(),
  title                 text not null,
  description           text,
  type                  text not null default 'task',
  category              text,
  priority              text default 'high',
  status                text not null default 'todo',
  assignee_user_id      uuid references auth.users(id),
  assignee_role         text,
  requestor_user_id     uuid references auth.users(id),
  active_party          text default 'assignee',
  amount                numeric,
  amount_currency       text default 'USD',
  decision_note         text,
  approved_at           timestamptz,
  rejected_at           timestamptz,
  resubmitted_at        timestamptz,
  revision_count        integer default 0,
  workflow_rule_id      uuid references workflow_rules(id),
  workflow_instance_id  uuid references workflow_instances(id),
  entity_type           text,
  entity_id             uuid,
  parent_task_id        uuid references tasks(id),
  due_date              date,
  completed_at          timestamptz,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);
create index if not exists tasks_assignee_status on tasks(assignee_user_id, status);
create index if not exists tasks_entity on tasks(entity_type, entity_id);
create index if not exists tasks_instance on tasks(workflow_instance_id);
create index if not exists tasks_active_party on tasks(active_party, status);

create table if not exists task_comments (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid references tasks(id) on delete cascade,
  user_id     uuid references auth.users(id),
  body        text not null,
  is_internal boolean default true,
  created_at  timestamptz default now()
);

create table if not exists task_documents (
  id            uuid primary key default gen_random_uuid(),
  task_id       uuid references tasks(id) on delete cascade,
  storage_path  text not null,
  file_name     text not null,
  file_size     integer,
  mime_type     text,
  uploaded_by   uuid references auth.users(id),
  version       integer default 1,
  is_current    boolean default true,
  created_at    timestamptz default now()
);
