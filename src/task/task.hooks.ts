import { useCallback } from "react";

import { unwrap, unwrapMaybe } from "utils/supabase";
import { objectStore } from "object/object.store";
import { failed, loading, success } from "utils/api-state";
import { useApiTools, useAutoLoad } from "utils/store";

import type { Profile } from "auth/auth.entity";

import { TaskInput, TaskStatus } from "./task.entity";
import { taskStore, useTaskStore } from "./task.store";


const TASK_SELECT = `id, title, description, status, created_at, object_id, assignee_id,
  object:objects(id, name, address),
  assignee:profiles!tasks_assignee_id_fkey(id, full_name),
  author:profiles!tasks_author_id_fkey(id, full_name)`;

export function useLoadTask(id: string) {
  const { state, db } = useApiTools(taskStore);
  const loadTaskState = useTaskStore((s) => s.loadTask[id]);

  const loadTask = useCallback(async () => {
    state.setLoadTask(id, loading(state.loadTask[id]?.value));
    try {
      const value = unwrapMaybe(await db.from('tasks')
        .select(TASK_SELECT)
        .eq('id', id)
        .maybeSingle());
      state.setLoadTask(id, success(value));
    } catch (error) {
      state.setLoadTask(id, failed(error));
    }
  }, [id]);

  useAutoLoad(loadTaskState, loadTask);

  return { loadTaskState: loadTaskState ?? {}, loadTask };
}

export function useLoadTaskHistory(id: string, opts: { auto?: boolean } = {}) {
  const { state, db } = useApiTools(taskStore);
  const loadTaskHistoryState = useTaskStore((s) => s.loadTaskHistory[id]);

  const loadTaskHistory = useCallback(async () => {
    state.setLoadTaskHistory(id, loading(state.loadTaskHistory[id]?.value));
    try {
      const value = unwrap(await db.from('task_status_history')
        .select('id, from_status, to_status, comment, created_at, actor:profiles(full_name)')
        .eq('task_id', id)
        .order('id'));
      state.setLoadTaskHistory(id, success(value));
    } catch (error) {
      state.setLoadTaskHistory(id, failed(error));
    }
  }, [id]);

  useAutoLoad(loadTaskHistoryState, loadTaskHistory, opts.auto !== false);

  return { loadTaskHistoryState: loadTaskHistoryState ?? {}, loadTaskHistory };
}

/** Executor: tasks assigned to him. Manager: tasks he created (for his executors). */
export function useLoadMyTasks(me: Pick<Profile, 'id' | 'role'>) {
  const { state, db } = useApiTools(taskStore);
  const loadMyTasksState = useTaskStore((s) => s.loadMyTasks);

  const loadMyTasks = useCallback(async () => {
    state.setLoadMyTasks(loading(state.loadMyTasks.value));
    try {
      // for an executor RLS already limits the rows to his own; the filter just states intent
      const value = unwrap(await db.from('tasks')
        .select('id, title, status, created_at, object:objects(id, name), assignee:profiles!tasks_assignee_id_fkey(id, full_name)')
        .eq(me.role === 'manager' ? 'author_id' : 'assignee_id', me.id)
        .order('created_at', { ascending: false }));
      state.setLoadMyTasks(success(value));
    } catch (error) {
      state.setLoadMyTasks(failed(error));
    }
  }, [me.id, me.role]);

  useAutoLoad(loadMyTasksState, loadMyTasks);

  return { loadMyTasksState, loadMyTasks };
}

export function useLoadExecutors(opts: { auto?: boolean } = {}) {
  const { state, db } = useApiTools(taskStore);
  const loadExecutorsState = useTaskStore((s) => s.loadExecutors);

  const loadExecutors = useCallback(async () => {
    state.setLoadExecutors(loading());
    try {
      const value = unwrap(await db.from('profiles')
        .select('id, full_name')
        .eq('role', 'executor')
        .order('full_name'));
      state.setLoadExecutors(success(value));
    } catch (error) {
      state.setLoadExecutors(failed(error));
    }
  }, []);

  useAutoLoad(loadExecutorsState, loadExecutors, opts.auto !== false);

  return { loadExecutorsState, loadExecutors, executors: loadExecutorsState.value || [] };
}

/** Task changes affect object task lists and counters too. */
function invalidateAfterTaskChange(taskId: string, objectIds: Array<string | undefined>) {
  taskStore.getState().invalidate(taskId);
  const objects = objectStore.getState();
  objectIds.forEach((objectId) => objectId && objects.invalidate(objectId));
}

/**
 * Create (id == null) or update a task. Only title/description/object/assignee
 * are sent — status, author and timestamps are owned by the database.
 * Resolves to the saved id, or null on failure.
 */
export function useSaveTask() {
  const { state, db } = useApiTools(taskStore);
  const saveTaskState = useTaskStore((s) => s.saveTask);

  const saveTask = useCallback(async (id: string | null, input: TaskInput, prevObjectId?: string) => {
    state.setSaveTask(loading());
    try {
      const data: TaskInput = {
        title: input.title.trim(),
        description: input.description.trim(),
        object_id: input.object_id,
        assignee_id: input.assignee_id,
      };
      const value = id == null
        ? unwrap(await db.from('tasks').insert(data).select('id').single())
        : unwrap(await db.from('tasks').update(data).eq('id', id).select('id').single());
      state.setSaveTask(success(value.id));
      invalidateAfterTaskChange(value.id, [data.object_id, prevObjectId]);
      return value.id;
    } catch (error) {
      state.setSaveTask(failed(error));
      return null;
    }
  }, []);

  return { saveTaskState, saveTask };
}

export function useDeleteTask() {
  const { state, db } = useApiTools(taskStore);
  const deleteTaskState = useTaskStore((s) => s.deleteTask);

  const deleteTask = useCallback(async (id: string, objectId: string) => {
    state.setDeleteTask(loading());
    try {
      unwrap(await db.from('tasks').delete().eq('id', id));
      state.setDeleteTask(success(id));
      invalidateAfterTaskChange(id, [objectId]);
      return true;
    } catch (error) {
      state.setDeleteTask(failed(error));
      return false;
    }
  }, []);

  return { deleteTaskState, deleteTask };
}

/** The only way to change a status: the RPC validates the transition, the role and the comment. */
export function useChangeTaskStatus() {
  const { state, db } = useApiTools(taskStore);
  const changeStatusState = useTaskStore((s) => s.changeStatus);

  const changeStatus = useCallback(async (
    task: { id: string, object_id: string }, to: TaskStatus, comment?: string,
  ) => {
    state.setChangeStatus(loading());
    try {
      unwrap(await db.rpc('change_task_status', {
        p_task_id: task.id,
        p_to: to,
        p_comment: comment?.trim() || null,
      }));
      state.setChangeStatus(success(task.id));
      invalidateAfterTaskChange(task.id, [task.object_id]);
      return true;
    } catch (error) {
      state.setChangeStatus(failed(error));
      return false;
    }
  }, []);

  return { changeStatusState, changeStatus };
}
