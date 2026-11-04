import { create } from 'zustand';

import { ApiCallState } from 'utils/api-state';
import { registerStoreReset } from 'utils/store';

import { CrmObject, ObjectListItem, ObjectTask } from './object.entity';

interface ObjectState {
  loadObjects: ApiCallState<ObjectListItem[]>;
  loadObject: { [id: string]: ApiCallState<CrmObject | null> };
  loadObjectTasks: { [id: string]: ApiCallState<ObjectTask[]> };
  saveObject: ApiCallState<CrmObject>;
  deleteObject: ApiCallState<string>;
  setLoadObjects: (state: ApiCallState<ObjectListItem[]>) => void;
  setLoadObject: (id: string, state: ApiCallState<CrmObject | null>) => void;
  setLoadObjectTasks: (id: string, state: ApiCallState<ObjectTask[]>) => void;
  setSaveObject: (state: ApiCallState<CrmObject>) => void;
  setDeleteObject: (state: ApiCallState<string>) => void;
  /** Drop cached object data so mounted pages refetch it. */
  invalidate: (id?: string) => void;
  reset: () => void;
}

const initialState = {
  loadObjects: {} as ApiCallState<ObjectListItem[]>,
  loadObject: {} as { [id: string]: ApiCallState<CrmObject | null> },
  loadObjectTasks: {} as { [id: string]: ApiCallState<ObjectTask[]> },
  saveObject: {} as ApiCallState<CrmObject>,
  deleteObject: {} as ApiCallState<string>,
};

export const objectStore = create<ObjectState>()((set) => ({
  ...initialState,

  setLoadObjects: (loadObjects) => set({ loadObjects }),
  setLoadObject: (id, state) => set((prev) => ({
    loadObject: { ...prev.loadObject, [id]: state },
  })),
  setLoadObjectTasks: (id, state) => set((prev) => ({
    loadObjectTasks: { ...prev.loadObjectTasks, [id]: state },
  })),
  setSaveObject: (saveObject) => set({ saveObject }),
  setDeleteObject: (deleteObject) => set({ deleteObject }),
  invalidate: (id) => set((prev) => ({
    loadObjects: {},
    loadObject: id ? { ...prev.loadObject, [id]: {} } : prev.loadObject,
    loadObjectTasks: id ? { ...prev.loadObjectTasks, [id]: {} } : {},
  })),
  reset: () => set(initialState),
}));

export const useObjectStore = objectStore;

registerStoreReset(() => objectStore.getState().reset());
