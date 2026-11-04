/**
 * "Try to break it": attacks the live Supabase API with the same public anon key
 * the frontend uses, logged in as an executor. Every attack must be blocked by Postgres.
 *
 *   npm run security-check          (reads .env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY,
 *                                    MANAGER_PASSWORD, EXECUTOR_PASSWORD)
 *
 * The manager session is used only to look up ids and to verify that nothing changed.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../src/lib/database.types';

try { process.loadEnvFile('.env'); } catch { /* env may come from the shell */ }

const env = (name: string) => {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing env ${name}`);
    process.exit(2);
  }
  return value;
};

const URL = env('VITE_SUPABASE_URL');
const KEY = env('VITE_SUPABASE_ANON_KEY');
const MANAGER_EMAIL = process.env.MANAGER_EMAIL ?? 'manager@example.com';
const EXECUTOR_EMAIL = process.env.EXECUTOR_EMAIL ?? 'ivanov@example.com';

type Client = SupabaseClient<Database>;
type Result = { data: unknown, error: { message: string } | null };

const client = (): Client => createClient<Database>(URL, KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function login(email: string, password: string) {
  const db = client();
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`login ${email}: ${error.message}`);
  return { db, uid: data.user.id };
}

let failures = 0;
const report = (ok: boolean, name: string, detail: string) => {
  if (!ok) failures++;
  console.log(`${ok ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}  ${name} — ${detail}`);
};

/** Write must fail with an error, or affect zero rows (RLS filters it out silently). */
const blocked = (name: string, { data, error }: Result) => {
  const rows = Array.isArray(data) ? data.length : data == null ? 0 : 1;
  report(error != null || rows === 0, name,
    error ? `blocked: ${error.message}` : rows === 0 ? '0 rows affected' : `${rows} row(s) affected!`);
};

/** Call must fail with an error. */
const rejected = (name: string, { error }: Result) =>
  report(error != null, name, error ? `blocked: ${error.message}` : 'statement succeeded!');

async function main() {
  const manager = await login(MANAGER_EMAIL, env('MANAGER_PASSWORD'));
  const executor = await login(EXECUTOR_EMAIL, env('EXECUTOR_PASSWORD'));
  const { db, uid } = executor;

  const { data: allTasks, error } = await manager.db
    .from('tasks').select('id, title, status, assignee_id, object_id');
  if (error || !allTasks) throw new Error(`manager tasks: ${error?.message}`);
  const ownTasks = allTasks.filter((t) => t.assignee_id === uid);
  const foreignTask = allTasks.find((t) => t.assignee_id !== uid);
  const ownTask = ownTasks[0];
  if (!ownTask || !foreignTask) throw new Error('need at least one own and one foreign task (run seed.sql)');
  const { data: ownHistory } = await manager.db
    .from('task_status_history').select('id').eq('task_id', ownTask.id).limit(1).single();
  const { data: allObjects } = await manager.db.from('objects').select('id');
  const foreignObject = allObjects?.find((o) => !ownTasks.some((t) => t.object_id === o.id));

  console.log(`executor ${EXECUTOR_EMAIL}: ${ownTasks.length} own of ${allTasks.length} tasks\n`);

  // --- reading -------------------------------------------------------------
  {
    const { data, error } = await db.from('tasks').select('id, assignee_id');
    const leaked = (data ?? []).filter((t) => t.assignee_id !== uid);
    report(!error && leaked.length === 0 && data!.length === ownTasks.length,
      '1. select tasks → only own', `${data?.length ?? 0} rows, ${leaked.length} foreign`);
  }
  {
    const { data } = await db.from('tasks').select('id').eq('id', foreignTask.id);
    report((data ?? []).length === 0, '2. select foreign task by id → empty', `${data?.length ?? 0} rows`);
  }
  {
    const { data } = await db.from('task_status_history').select('id').eq('task_id', foreignTask.id);
    report((data ?? []).length === 0, '2b. select foreign task history → empty', `${data?.length ?? 0} rows`);
  }
  if (foreignObject) {
    const { data } = await db.from('objects').select('id').eq('id', foreignObject.id);
    report((data ?? []).length === 0, '2c. select object without own tasks → empty', `${data?.length ?? 0} rows`);
  }

  // --- writing tasks -------------------------------------------------------
  blocked('3a. update title of own task',
    await db.from('tasks').update({ title: 'hacked' }).eq('id', ownTask.id).select());
  blocked('3b. update title of foreign task',
    await db.from('tasks').update({ title: 'hacked' }).eq('id', foreignTask.id).select());
  blocked('3c. reassign foreign task to myself',
    await db.from('tasks').update({ assignee_id: uid }).eq('id', foreignTask.id).select());
  rejected('4a. update status=accepted directly',
    await db.from('tasks').update({ status: 'accepted' }).eq('id', ownTask.id).select());
  rejected('4b. update author_id directly',
    await db.from('tasks').update({ author_id: uid }).eq('id', ownTask.id).select());
  rejected('5a. insert task',
    await db.from('tasks').insert({ title: 'x', object_id: ownTask.object_id, assignee_id: uid }).select());
  rejected('5b. insert object',
    await db.from('objects').insert({ name: 'x' }).select());
  blocked('5c. delete own task',
    await db.from('tasks').delete().eq('id', ownTask.id).select());
  blocked('5d. delete object',
    await db.from('objects').delete().eq('id', ownTask.object_id).select());

  // --- history is append-only and written by the database only ------------
  rejected('6a. insert into task_status_history',
    await db.from('task_status_history').insert({
      task_id: ownTask.id, from_status: 'review', to_status: 'accepted', changed_by: uid,
    }).select());
  if (ownHistory) {
    blocked('6b. update task_status_history',
      await db.from('task_status_history').update({ comment: 'edited' }).eq('id', ownHistory.id).select());
    blocked('6c. delete from task_status_history',
      await db.from('task_status_history').delete().eq('id', ownHistory.id).select());
  }

  // --- roles ---------------------------------------------------------------
  blocked('7. update own profile role=manager',
    await db.from('profiles').update({ role: 'manager' }).eq('id', uid).select());

  // --- status workflow -----------------------------------------------------
  for (const task of ownTasks) {
    rejected(`8. rpc accept own task (${task.status}) "${task.title}"`,
      await db.rpc('change_task_status', { p_task_id: task.id, p_to: 'accepted' }));
  }
  rejected('8b. rpc skip a step: own task → review from wrong status',
    await db.rpc('change_task_status', {
      p_task_id: (ownTasks.find((t) => t.status !== 'in_progress') ?? ownTask).id, p_to: 'review',
    }));
  rejected('9. rpc on foreign task',
    await db.rpc('change_task_status', { p_task_id: foreignTask.id, p_to: 'in_progress' }));

  // --- anonymous / sign-up -------------------------------------------------
  {
    const anon = client();
    const { data, error } = await anon.from('tasks').select('id');
    report(error != null || (data ?? []).length === 0, '10. anonymous select tasks',
      error ? `blocked: ${error.message}` : `${data?.length ?? 0} rows`);
    rejected('11. anonymous rpc',
      await anon.rpc('change_task_status', { p_task_id: ownTask.id, p_to: 'in_progress' }));
    const signUp = await anon.auth.signUp({
      email: `intruder+${Date.now()}@example.com`, password: 'Intruder-12345',
    });
    // other errors (e.g. email rate limit) don't prove sign-up is off
    const disabled = signUp.error?.code === 'signup_disabled' || /signups? not allowed/i.test(signUp.error?.message ?? '');
    report(disabled, '12. self sign-up disabled',
      disabled ? `blocked: ${signUp.error!.message}`
        : signUp.error ? `unexpected error: ${signUp.error.message}` : 'account created!');
  }

  // --- nothing actually changed -------------------------------------------
  const { data: after } = await manager.db.from('tasks').select('id, title, status, assignee_id');
  const changed = allTasks.filter((t) => {
    const a = after?.find((x) => x.id === t.id);
    return !a || a.title !== t.title || a.status !== t.status || a.assignee_id !== t.assignee_id;
  });
  report(changed.length === 0 && after?.length === allTasks.length,
    '13. data unchanged (checked as manager)', `${changed.length} task(s) changed or missing`);

  console.log(failures === 0 ? '\nAll attacks blocked.' : `\n${failures} check(s) FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(2);
});
