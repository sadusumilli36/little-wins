-- Little Wins: one profile per signed-in user (name, age, primary contact).
-- This only adds a new table. It does not change tasks, subtasks, or task_progress.
-- It reuses public.little_wins_set_updated_at() from 002_tasks_and_subtasks.sql,
-- so run 002 before this file.

create table if not exists public.profiles (
    user_id uuid primary key
        references auth.users(id) on delete cascade,

    display_name text
        check (display_name is null or length(trim(display_name)) between 1 and 100),

    age integer
        check (age is null or age between 1 and 120),

    -- The primary contact is the caregiver or guardian who can look over progress.
    contact_name text
        check (contact_name is null or length(trim(contact_name)) between 1 and 100),

    contact_email text
        check (
            contact_email is null
            or (
                length(trim(contact_email)) between 3 and 254
                and contact_email like '%_@_%'
            )
        ),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Only signed-in users can use this table, and only through the policies below.
alter table public.profiles enable row level security;

revoke all on table public.profiles from anon, authenticated;

grant select, insert, update, delete
    on public.profiles to authenticated;

drop policy if exists "Users can read their own profile"
    on public.profiles;
create policy "Users can read their own profile"
    on public.profiles for select to authenticated
    using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own profile"
    on public.profiles;
create policy "Users can create their own profile"
    on public.profiles for insert to authenticated
    with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own profile"
    on public.profiles;
create policy "Users can update their own profile"
    on public.profiles for update to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own profile"
    on public.profiles;
create policy "Users can delete their own profile"
    on public.profiles for delete to authenticated
    using ((select auth.uid()) = user_id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
    before update on public.profiles
    for each row
    execute function public.little_wins_set_updated_at();
