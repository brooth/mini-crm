-- =====================================================================
-- Mini-CRM "Objects & Tasks" — initial schema, RLS, status workflow
-- All access rules live in the database. The frontend uses only the
-- anon/publishable key + the user's JWT; nothing here trusts the client.
-- =====================================================================

-- ---------- Types ----------------------------------------------------
create type public.user_role   as enum ('manager', 'executor');
create type public.task_status as enum ('new', 'in_progress', 'review', 'accepted', 'rework');

-- ---------- Tables ---------------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null,
  role       public.user_role not null default 'executor',
  created_at timestamptz not null default now()
);

create table public.objects (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (length(btrim(name)) > 0),
  address    text not null default '',
  created_at timestamptz not null default now()
);

create table public.tasks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (length(btrim(title)) > 0),
  description text not null default '',
  object_id   uuid not null references public.objects (id) on delete cascade,
  assignee_id uuid not null references public.profiles (id),
  status      public.task_status not null default 'new',
  author_id   uuid not null references public.profiles (id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index tasks_object_id_idx   on public.tasks (object_id);
create index tasks_assignee_id_idx on public.tasks (assignee_id);

create table public.task_status_history (
  id          bigint generated always as identity primary key,
  task_id     uuid not null references public.tasks (id) on delete cascade,
  from_status public.task_status,            -- null for the creation entry
  to_status   public.task_status not null,
  changed_by  uuid not null references public.profiles (id),
  comment     text,
  created_at  timestamptz not null default now()
);
create index task_status_history_task_id_idx on public.task_status_history (task_id);

-- ---------- Helpers --------------------------------------------------
-- security definer: reads profiles without going through RLS (no recursion)
create function public.is_manager()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(
    (select role = 'manager' from public.profiles where id = auth.uid()),
    false
  );
$$;

-- ---------- Profile auto-creation ------------------------------------
-- Every new auth user gets an 'executor' profile. Roles are promoted
-- manually (SQL / dashboard) — never from user-supplied metadata.
create function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    'executor'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Task integrity triggers ----------------------------------
create function public.tasks_before_insert()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  -- server-controlled fields: client values are ignored
  new.author_id  := auth.uid();
  new.status     := 'new';
  new.created_at := now();
  new.updated_at := now();

  if new.author_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = new.assignee_id and role = 'executor') then
    raise exception 'Assignee must be an executor' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger tasks_before_insert
  before insert on public.tasks
  for each row execute function public.tasks_before_insert();

create function public.tasks_after_insert()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.task_status_history (task_id, from_status, to_status, changed_by)
  values (new.id, null, 'new', new.author_id);
  return null;
end;
$$;

create trigger tasks_after_insert
  after insert on public.tasks
  for each row execute function public.tasks_after_insert();

create function public.tasks_before_update()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  -- immutable fields
  new.author_id  := old.author_id;
  new.created_at := old.created_at;
  new.updated_at := now();

  -- status may change only inside change_task_status()
  if new.status is distinct from old.status
     and coalesce(current_setting('app.status_change', true), '') <> 'on' then
    raise exception 'Status can only be changed via change_task_status()' using errcode = '42501';
  end if;

  if new.assignee_id is distinct from old.assignee_id
     and not exists (select 1 from public.profiles where id = new.assignee_id and role = 'executor') then
    raise exception 'Assignee must be an executor' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger tasks_before_update
  before update on public.tasks
  for each row execute function public.tasks_before_update();

-- ---------- Status workflow (the only way to change status) ----------
create function public.change_task_status(
  p_task_id uuid,
  p_to      public.task_status,
  p_comment text default null
)
returns public.tasks
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid     uuid := auth.uid();
  v_role    public.user_role;
  v_task    public.tasks;
  v_comment text := nullif(btrim(p_comment), '');
  v_ok      boolean;
  v_from    public.task_status;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  select role into v_role from public.profiles where id = v_uid;

  select * into v_task from public.tasks where id = p_task_id for update;
  -- an executor gets the same error for "missing" and "not yours" (no existence leak)
  if not found or (v_role = 'executor' and v_task.assignee_id <> v_uid) then
    raise exception 'Task not found' using errcode = 'P0002';
  end if;

  v_ok := case
    when v_task.status = 'new'         and p_to = 'in_progress' then v_task.assignee_id = v_uid
    when v_task.status = 'in_progress' and p_to = 'review'      then v_task.assignee_id = v_uid
    when v_task.status = 'rework'      and p_to = 'in_progress' then v_task.assignee_id = v_uid
    when v_task.status = 'review'      and p_to = 'accepted'    then v_role = 'manager'
    when v_task.status = 'review'      and p_to = 'rework'      then v_role = 'manager'
    else false
  end;

  if not v_ok then
    raise exception 'Transition % -> % is not allowed for this user', v_task.status, p_to
      using errcode = '42501';
  end if;

  if p_to = 'rework' and v_comment is null then
    raise exception 'A comment is required when returning a task for rework' using errcode = '23514';
  end if;

  v_from := v_task.status;

  perform set_config('app.status_change', 'on', true);
  update public.tasks set status = p_to where id = p_task_id returning * into v_task;
  perform set_config('app.status_change', 'off', true);

  insert into public.task_status_history (task_id, from_status, to_status, changed_by, comment)
  values (p_task_id, v_from, p_to, v_uid, v_comment);

  return v_task;
end;
$$;

-- ---------- Privileges -----------------------------------------------
-- Supabase grants everything to anon/authenticated by default; tighten it.
revoke all on public.profiles, public.objects, public.tasks, public.task_status_history from anon, authenticated;

grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.objects to authenticated;
grant select, delete on public.tasks to authenticated;
grant insert (title, description, object_id, assignee_id) on public.tasks to authenticated;
grant update (title, description, object_id, assignee_id) on public.tasks to authenticated;
grant select on public.task_status_history to authenticated;   -- read-only, always

revoke execute on function public.change_task_status(uuid, public.task_status, text) from public, anon;
grant  execute on function public.change_task_status(uuid, public.task_status, text) to authenticated;
revoke execute on function public.is_manager() from public, anon;
grant  execute on function public.is_manager() to authenticated;
revoke execute on function public.handle_new_user()     from public, anon, authenticated;
revoke execute on function public.tasks_before_insert() from public, anon, authenticated;
revoke execute on function public.tasks_after_insert()  from public, anon, authenticated;
revoke execute on function public.tasks_before_update() from public, anon, authenticated;

-- ---------- Row Level Security ---------------------------------------
alter table public.profiles            enable row level security;
alter table public.objects             enable row level security;
alter table public.tasks               enable row level security;
alter table public.task_status_history enable row level security;

-- profiles: everyone signed in can see names/roles (needed for history & assignee pickers);
-- no insert/update/delete policies -> nobody can change roles through the API.
create policy profiles_select on public.profiles
  for select to authenticated using (true);

-- objects: managers see all; executors see objects where they have a task
create policy objects_select on public.objects
  for select to authenticated
  using (
    (select public.is_manager())
    or exists (select 1 from public.tasks t
               where t.object_id = objects.id and t.assignee_id = (select auth.uid()))
  );
create policy objects_insert on public.objects
  for insert to authenticated with check ((select public.is_manager()));
create policy objects_update on public.objects
  for update to authenticated using ((select public.is_manager())) with check ((select public.is_manager()));
create policy objects_delete on public.objects
  for delete to authenticated using ((select public.is_manager()));

-- tasks: managers see all; executors only their own; only managers write
create policy tasks_select on public.tasks
  for select to authenticated
  using ((select public.is_manager()) or assignee_id = (select auth.uid()));
create policy tasks_insert on public.tasks
  for insert to authenticated with check ((select public.is_manager()));
create policy tasks_update on public.tasks
  for update to authenticated using ((select public.is_manager())) with check ((select public.is_manager()));
create policy tasks_delete on public.tasks
  for delete to authenticated using ((select public.is_manager()));

-- history: readable for tasks you can see; no write policies at all
create policy task_status_history_select on public.task_status_history
  for select to authenticated
  using (
    (select public.is_manager())
    or exists (select 1 from public.tasks t
               where t.id = task_status_history.task_id and t.assignee_id = (select auth.uid()))
  );
