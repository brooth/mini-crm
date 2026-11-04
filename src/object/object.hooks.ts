import { useCallback } from "react";

import { unwrap, unwrapMaybe } from "lib/supabase";
import { taskStore } from "task/task.store";
import { failed, loading, success } from "utils/api-state";
import { useApiTools, useAutoLoad } from "utils/store";

import { ObjectInput } from "./object.entity";
import { objectStore, useObjectStore } from "./object.store";


export function useLoadObjects(opts: { auto?: boolean } = {}) {
  const { state, db } = useApiTools(objectStore);
  const loadObjectsState = useObjectStore((s) => s.loadObjects);

  const loadObjects = useCallback(async () => {
    state.setLoadObjects(loading(state.loadObjects.value));
    try {
      const value = unwrap(await db.from('objects')
        .select('id, name, address, tasks(count)')
        .order('name'));
      state.setLoadObjects(success(value));
    } catch (error) {
      state.setLoadObjects(failed(error));
    }
  }, []);

  useAutoLoad(loadObjectsState, loadObjects, opts.auto !== false);

  return { loadObjectsState, loadObjects, objects: loadObjectsState.value || [] };
}

export function useLoadObject(id: string) {
  const { state, db } = useApiTools(objectStore);
  const loadObjectState = useObjectStore((s) => s.loadObject[id]);

  const loadObject = useCallback(async () => {
    state.setLoadObject(id, loading(state.loadObject[id]?.value));
    try {
      const value = unwrapMaybe(await db.from('objects')
        .select('id, name, address')
        .eq('id', id)
        .maybeSingle());
      state.setLoadObject(id, success(value));
    } catch (error) {
      state.setLoadObject(id, failed(error));
    }
  }, [id]);

  useAutoLoad(loadObjectState, loadObject);

  return { loadObjectState: loadObjectState ?? {}, loadObject };
}

export function useLoadObjectTasks(id: string, opts: { auto?: boolean } = {}) {
  const { state, db } = useApiTools(objectStore);
  const loadObjectTasksState = useObjectStore((s) => s.loadObjectTasks[id]);

  const loadObjectTasks = useCallback(async () => {
    state.setLoadObjectTasks(id, loading(state.loadObjectTasks[id]?.value));
    try {
      const value = unwrap(await db.from('tasks')
        .select('id, title, status, created_at, assignee:profiles!tasks_assignee_id_fkey(id, full_name)')
        .eq('object_id', id)
        .order('created_at'));
      state.setLoadObjectTasks(id, success(value));
    } catch (error) {
      state.setLoadObjectTasks(id, failed(error));
    }
  }, [id]);

  useAutoLoad(loadObjectTasksState, loadObjectTasks, opts.auto !== false);

  return { loadObjectTasksState: loadObjectTasksState ?? {}, loadObjectTasks };
}

/** Create (id == null) or update an object. Resolves to the saved id, or null on failure. */
export function useSaveObject() {
  const { state, db } = useApiTools(objectStore);
  const saveObjectState = useObjectStore((s) => s.saveObject);

  const saveObject = useCallback(async (id: string | null, input: ObjectInput) => {
    state.setSaveObject(loading());
    try {
      const data = { name: input.name.trim(), address: input.address.trim() };
      const value = id == null
        ? unwrap(await db.from('objects').insert(data).select('id, name, address').single())
        : unwrap(await db.from('objects').update(data).eq('id', id).select('id, name, address').single());
      state.setSaveObject(success(value));
      state.invalidate(value.id);
      // object name is shown on task cards and in "my tasks"
      taskStore.getState().invalidate();
      return value.id;
    } catch (error) {
      state.setSaveObject(failed(error));
      return null;
    }
  }, []);

  return { saveObjectState, saveObject };
}

export function useDeleteObject() {
  const { state, db } = useApiTools(objectStore);
  const deleteObjectState = useObjectStore((s) => s.deleteObject);

  const deleteObject = useCallback(async (id: string) => {
    state.setDeleteObject(loading());
    try {
      // tasks and their history are removed by ON DELETE CASCADE
      unwrap(await db.from('objects').delete().eq('id', id));
      state.setDeleteObject(success(id));
      state.invalidate(id);
      taskStore.getState().invalidate();
      return true;
    } catch (error) {
      state.setDeleteObject(failed(error));
      return false;
    }
  }, []);

  return { deleteObjectState, deleteObject };
}
