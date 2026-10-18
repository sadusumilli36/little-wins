-- Complete a parent task and its subtasks atomically for the authenticated owner.
create or replace function public.set_task_status_with_subtasks(
    p_task_id uuid,
    p_status text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
    updated_task_count integer;
begin
    if p_status not in ('upcoming', 'in_progress', 'completed') then
        raise exception 'Invalid task status.';
    end if;

    update public.tasks
    set status = p_status
    where id = p_task_id;

    get diagnostics updated_task_count = row_count;
    if updated_task_count = 0 then
        raise exception 'Task not found or access denied.';
    end if;

    if p_status = 'completed' then
        update public.subtasks
        set completed = true
        where task_id = p_task_id
          and completed is distinct from true;
    end if;
end;
$$;

revoke all on function public.set_task_status_with_subtasks(uuid, text)
    from public;
revoke all on function public.set_task_status_with_subtasks(uuid, text)
    from anon;
grant execute on function public.set_task_status_with_subtasks(uuid, text)
    to authenticated;