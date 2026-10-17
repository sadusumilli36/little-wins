-- Create a table for each user's task progress.
create table public.task_progress (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id) on delete cascade,

  task_id text not null,

  current_step integer not null default 0
    check (current_step >= 0),

  completed boolean not null default false,

  updated_at timestamptz not null default now(),

  unique (user_id, task_id)
);

-- Require row-level security.
alter table public.task_progress
  enable row level security;

-- Remove direct access from anonymous users.
revoke all on table public.task_progress
  from anon, authenticated;

-- Allow signed-in users to use the table,
-- subject to the security policies below.
grant select, insert, update, delete
  on table public.task_progress
  to authenticated;

-- Read only your own progress.
create policy "Read own task progress"
on public.task_progress
for select
to authenticated
using ((select auth.uid()) = user_id);

-- Create records only for your own account.
create policy "Insert own task progress"
on public.task_progress
for insert
to authenticated
with check ((select auth.uid()) = user_id);

-- Update only your own records.
create policy "Update own task progress"
on public.task_progress
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Delete only your own records.
create policy "Delete own task progress"
on public.task_progress
for delete
to authenticated
using ((select auth.uid()) = user_id);
