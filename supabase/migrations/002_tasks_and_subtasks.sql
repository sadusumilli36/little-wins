
-- Little Wins: persistent user-created tasks and subtasks.
-- This adds new tables without deleting or changing task_progress.

create table if not exists public.tasks (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references auth.users(id) on delete cascade,

    name text not null
        check (length(trim(name)) > 0),

    due_at timestamptz,

    character_id text,
    character_color text,

    status text not null default 'upcoming'
        check (status in ('upcoming', 'in_progress', 'completed')),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.subtasks (
    id uuid primary key default gen_random_uuid(),

    task_id uuid not null
        references public.tasks(id) on delete cascade,

    description text not null
        check (length(trim(description)) > 0),

    display_order integer not null default 0
        check (display_order >= 0),

    completed boolean not null default false,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Indexes for common queries and sorting.
create index if not exists tasks_user_id_idx
    on public.tasks(user_id);

create index if not exists tasks_user_status_due_idx
    on public.tasks(user_id, status, due_at);

create index if not exists subtasks_task_order_idx
    on public.subtasks(task_id, display_order);

-- Enable row-level security.
alter table public.tasks enable row level security;
alter table public.subtasks enable row level security;

-- Allow signed-in users to access these tables through the Data API.
grant usage on schema public to authenticated;

grant select, insert, update, delete
    on public.tasks to authenticated;

grant select, insert, update, delete
    on public.subtasks to authenticated;

-- Task policies: users can only access their own tasks.
drop policy if exists "Users can read their own tasks"
    on public.tasks;
create policy "Users can read their own tasks"
    on public.tasks for select to authenticated
    using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own tasks"
    on public.tasks;
create policy "Users can create their own tasks"
    on public.tasks for insert to authenticated
    with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own tasks"
    on public.tasks;
create policy "Users can update their own tasks"
    on public.tasks for update to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own tasks"
    on public.tasks;
create policy "Users can delete their own tasks"
    on public.tasks for delete to authenticated
    using ((select auth.uid()) = user_id);

-- Subtask policies: the parent task must belong to the signed-in user.
drop policy if exists "Users can read their own subtasks"
    on public.subtasks;
create policy "Users can read their own subtasks"
    on public.subtasks for select to authenticated
    using (
        exists (
            select 1
            from public.tasks t
            where t.id = public.subtasks.task_id
              and t.user_id = (select auth.uid())
        )
    );

drop policy if exists "Users can create their own subtasks"
    on public.subtasks;
create policy "Users can create their own subtasks"
    on public.subtasks for insert to authenticated
    with check (
        exists (
            select 1
            from public.tasks t
            where t.id = public.subtasks.task_id
              and t.user_id = (select auth.uid())
        )
    );

drop policy if exists "Users can update their own subtasks"
    on public.subtasks;
create policy "Users can update their own subtasks"
    on public.subtasks for update to authenticated
    using (
        exists (
            select 1
            from public.tasks t
            where t.id = public.subtasks.task_id
              and t.user_id = (select auth.uid())
        )
    )
    with check (
        exists (
            select 1
            from public.tasks t
            where t.id = public.subtasks.task_id
              and t.user_id = (select auth.uid())
        )
    );

drop policy if exists "Users can delete their own subtasks"
    on public.subtasks;
create policy "Users can delete their own subtasks"
    on public.subtasks for delete to authenticated
    using (
        exists (
            select 1
            from public.tasks t
            where t.id = public.subtasks.task_id
              and t.user_id = (select auth.uid())
        )
    );

-- Automatically refresh updated_at when either record changes.
create or replace function public.little_wins_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
    before update on public.tasks
    for each row
    execute function public.little_wins_set_updated_at();

drop trigger if exists subtasks_set_updated_at on public.subtasks;
create trigger subtasks_set_updated_at
    before update on public.subtasks
    for each row
    execute function public.little_wins_set_updated_at();
