-- =====================================================================
-- Demo data. Run ONCE in the Supabase SQL editor AFTER creating these
-- users in Dashboard -> Authentication -> Users -> Add user
-- (tick "Auto Confirm User"):
--   manager@example.com    (постановщик)
--   ivanov@example.com     (исполнитель)
--   petrov@example.com     (исполнитель)
-- Status changes go through change_task_status(), so history is real.
-- =====================================================================
do $$
declare
  v_mgr  uuid := (select id from auth.users where email = 'manager@example.com');
  v_ivan uuid := (select id from auth.users where email = 'ivanov@example.com');
  v_petr uuid := (select id from auth.users where email = 'petrov@example.com');
  o1 uuid; o2 uuid; o3 uuid;
  t1 uuid; t2 uuid; t3 uuid; t4 uuid; t5 uuid; t6 uuid;
begin
  if v_mgr is null or v_ivan is null or v_petr is null then
    raise exception 'Create the three users in Authentication first';
  end if;

  update public.profiles set full_name = 'Анна Смирнова', role = 'manager'  where id = v_mgr;
  update public.profiles set full_name = 'Иван Иванов',                 role = 'executor' where id = v_ivan;
  update public.profiles set full_name = 'Пётр Петров',                 role = 'executor' where id = v_petr;

  -- as manager
  perform set_config('request.jwt.claims', json_build_object('sub', v_mgr, 'role', 'authenticated')::text, true);

  insert into public.objects (name, address) values ('ЖК «Северный»', 'ул. Ленина, 12')       returning id into o1;
  insert into public.objects (name, address) values ('Склад «Восток»', 'Промзона, участок 4') returning id into o2;
  insert into public.objects (name, address) values ('Коттедж Кузнецовых', 'пос. Лесной, 7')   returning id into o3;

  insert into public.tasks (title, description, object_id, assignee_id)
    values ('Залить фундамент', 'Секция А, бетон М300', o1, v_ivan) returning id into t1;
  insert into public.tasks (title, description, object_id, assignee_id)
    values ('Смонтировать опалубку', 'Секция Б', o1, v_petr) returning id into t2;
  insert into public.tasks (title, description, object_id, assignee_id)
    values ('Проверить кровлю', 'После дождей — течь в углу', o2, v_ivan) returning id into t3;
  insert into public.tasks (title, description, object_id, assignee_id)
    values ('Установить ворота', 'Секционные, 4×4 м', o2, v_petr) returning id into t4;
  insert into public.tasks (title, description, object_id, assignee_id)
    values ('Разметка участка', 'По генплану', o3, v_ivan) returning id into t5;
  insert into public.tasks (title, description, object_id, assignee_id)
    values ('Завезти материалы', 'Кирпич, 2 паллеты', o3, v_petr) returning id into t6;
  -- t6 stays "new"

  -- executor Ivan: t1 -> in_progress; t3 -> review; t5 -> review (then accepted)
  perform set_config('request.jwt.claims', json_build_object('sub', v_ivan, 'role', 'authenticated')::text, true);
  perform public.change_task_status(t1, 'in_progress');
  perform public.change_task_status(t3, 'in_progress');
  perform public.change_task_status(t3, 'review', 'Заменил два листа');
  perform public.change_task_status(t5, 'in_progress');
  perform public.change_task_status(t5, 'review');

  -- executor Petr: t2 -> review; t4 -> review
  perform set_config('request.jwt.claims', json_build_object('sub', v_petr, 'role', 'authenticated')::text, true);
  perform public.change_task_status(t2, 'in_progress');
  perform public.change_task_status(t2, 'review');
  perform public.change_task_status(t4, 'in_progress');
  perform public.change_task_status(t4, 'review');

  -- manager: accept t5, return t4 for rework
  perform set_config('request.jwt.claims', json_build_object('sub', v_mgr, 'role', 'authenticated')::text, true);
  perform public.change_task_status(t5, 'accepted');
  perform public.change_task_status(t4, 'rework', 'Ворота перекошены, переставить по уровню');

  -- result: new(t6), in_progress(t1), review(t2, t3), rework(t4), accepted(t5)
end;
$$;
