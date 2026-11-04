\set ON_ERROR_STOP 1
create schema if not exists t;
grant usage on schema t to authenticated, anon;
create or replace function t.fail(name text, q text) returns void language plpgsql as $$
begin
  begin execute q;
  exception when others then raise notice 'PASS  % (blocked: %)', name, sqlerrm; return; end;
  raise warning 'FAIL  % (statement succeeded)', name;
end $$;
create or replace function t.rows(name text, q text, expected int) returns void language plpgsql as $$
declare n int;
begin
  execute 'select count(*) from (' || q || ') s' into n;
  if n = expected then raise notice 'PASS  % (% rows)', name, n;
  else raise warning 'FAIL  % (got %, expected %)', name, n, expected; end if;
end $$;
-- affected rows of a writing CTE
create or replace function t.affects(name text, q text, expected int) returns void language plpgsql as $$
declare n int;
begin
  begin
    execute 'with x as (' || q || ' returning 1) select count(*) from x' into n;
  exception when others then
    if expected = 0 then raise notice 'PASS  % (blocked: %)', name, sqlerrm; else raise warning 'FAIL  % (%)', name, sqlerrm; end if;
    return;
  end;
  if n = expected then raise notice 'PASS  % (% rows affected)', name, n;
  else raise warning 'FAIL  % (affected %, expected %)', name, n, expected; end if;
end $$;
grant execute on all functions in schema t to authenticated, anon;

select id as mgr  from auth.users where email='manager@example.com' \gset
select id as ivan from auth.users where email='ivanov@example.com' \gset
select id as petr from auth.users where email='petrov@example.com' \gset
select id as t_petr_review from tasks where title='Смонтировать опалубку' \gset
select id as t_ivan_inprog from tasks where title='Залить фундамент' \gset
select id as t_ivan_review from tasks where title='Проверить кровлю' \gset
select id as t_petr_new from tasks where title='Завезти материалы' \gset
select id as obj_cottage from objects where name='Коттедж Кузнецовых' \gset
select id as obj_sklad from objects where name='Склад «Восток»' \gset

-- ================= anon =================
begin; set local role anon;
select t.fail('anon: read tasks', 'select * from public.tasks');
select t.fail('anon: call change_task_status', format('select public.change_task_status(%L, %L)', :'t_ivan_inprog', 'review'));
rollback;

-- ================= executor Ivan =================
begin; set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :'ivan')::text, true);
select t.rows('ivan: sees only own tasks', 'select * from public.tasks', 3);
select t.rows('ivan: cannot read Petr task by id', format('select * from public.tasks where id = %L', :'t_petr_review'), 0);
select t.rows('ivan: sees objects only with his tasks (all 3 here)', 'select * from public.objects', 3);
select t.rows('ivan: history only of own tasks', format('select * from public.task_status_history where task_id = %L', :'t_petr_review'), 0);
select t.affects('ivan: update Petr task title', format('update public.tasks set title = %L where id = %L', 'hacked', :'t_petr_review'), 0);
select t.affects('ivan: update own task title', format('update public.tasks set title = %L where id = %L', 'hacked', :'t_ivan_inprog'), 0);
select t.fail('ivan: set status directly', format('update public.tasks set status = %L where id = %L', 'accepted', :'t_ivan_review'));
select t.fail('ivan: insert task', format('insert into public.tasks (title, object_id, assignee_id) values (%L, %L, %L)', 'x', :'obj_sklad', :'ivan'));
select t.affects('ivan: delete own task', format('delete from public.tasks where id = %L', :'t_ivan_inprog'), 0);
select t.fail('ivan: insert object', 'insert into public.objects (name) values (''x'')');
select t.fail('ivan: promote himself to manager', format('update public.profiles set role = %L where id = %L', 'manager', :'ivan'));
select t.fail('ivan: insert fake history', format('insert into public.task_status_history (task_id, to_status, changed_by) values (%L, %L, %L)', :'t_ivan_review', 'accepted', :'mgr'));
select t.fail('ivan: edit history', 'update public.task_status_history set comment = ''x''');
select t.fail('ivan: delete history', 'delete from public.task_status_history');
select t.fail('ivan: accept own task (manager-only)', format('select public.change_task_status(%L, %L)', :'t_ivan_review', 'accepted'));
select t.fail('ivan: skip in_progress -> accepted', format('select public.change_task_status(%L, %L)', :'t_ivan_inprog', 'accepted'));
select t.fail('ivan: move Petr task', format('select public.change_task_status(%L, %L)', :'t_petr_new', 'in_progress'));
rollback;

-- ================= Petr: object visibility =================
begin; set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :'petr')::text, true);
select t.rows('petr: sees only own tasks', 'select * from public.tasks', 3);
rollback;

-- ================= manager =================
begin; set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :'mgr')::text, true);
select t.rows('mgr: sees all tasks', 'select * from public.tasks', 6);
select t.fail('mgr: set status directly', format('update public.tasks set status = %L where id = %L', 'accepted', :'t_petr_review'));
select t.fail('mgr: take task into work (executor-only)', format('select public.change_task_status(%L, %L)', :'t_petr_new', 'in_progress'));
select t.fail('mgr: return for rework without comment', format('select public.change_task_status(%L, %L, %L)', :'t_petr_review', 'rework', '   '));
select t.fail('mgr: assign task to a manager', format('update public.tasks set assignee_id = %L where id = %L', :'mgr', :'t_petr_new'));
select t.fail('mgr: insert fake history', format('insert into public.task_status_history (task_id, to_status, changed_by) values (%L, %L, %L)', :'t_petr_review', 'accepted', :'mgr'));
select t.fail('mgr: delete history', 'delete from public.task_status_history');
select t.affects('mgr: edit task title', format('update public.tasks set title = %L where id = %L', 'Смонтировать опалубку (ред.)', :'t_petr_review'), 1);
select t.affects('mgr: create object', 'insert into public.objects (name, address) values (''Тест'', ''-'')', 1);
rollback;

-- author_id spoofing: manager inserts with author_id = Ivan -> must become manager
begin;
select set_config('request.jwt.claims', json_build_object('sub', :'mgr')::text, true);
set local role authenticated;
select t.fail('mgr: cannot even pass author_id column (no column grant)',
  format('insert into public.tasks (title, object_id, assignee_id, author_id) values (%L, %L, %L, %L)', 'x', :'obj_sklad', :'ivan', :'ivan'));
insert into public.tasks (title, object_id, assignee_id) values ('Новая проверка', :'obj_sklad', :'ivan');
select t.rows('mgr: new task has author = mgr, status = new, history row',
  format('select 1 from public.tasks t join public.task_status_history h on h.task_id = t.id where t.title = %L and t.author_id = %L and t.status = %L', 'Новая проверка', :'mgr', 'new'), 1);
rollback;

-- full happy path
begin; set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :'mgr')::text, true);
select public.change_task_status(:'t_petr_review', 'rework', 'Переделать') is not null as rework_ok;
select set_config('request.jwt.claims', json_build_object('sub', :'petr')::text, true);
select public.change_task_status(:'t_petr_review', 'in_progress') is not null as back_to_work_ok;
select public.change_task_status(:'t_petr_review', 'review') is not null as review_ok;
select set_config('request.jwt.claims', json_build_object('sub', :'mgr')::text, true);
select public.change_task_status(:'t_petr_review', 'accepted') is not null as accepted_ok;
select t.fail('mgr: accepted is terminal', format('select public.change_task_status(%L, %L, %L)', :'t_petr_review', 'rework', 'again'));
rollback;

-- executor sees an object only through his tasks
begin;
select set_config('request.jwt.claims', json_build_object('sub', :'mgr')::text, true);
set local role authenticated;
insert into public.objects (name) values ('Пустой объект');
select set_config('request.jwt.claims', json_build_object('sub', :'ivan')::text, true);
select t.rows('ivan: does not see object without his tasks', 'select * from public.objects where name = ''Пустой объект''', 0);
rollback;
