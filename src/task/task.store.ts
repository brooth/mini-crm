import { create } from 'zustand';

import { ApiCallState } from 'utils/api-state';
import { registerStoreReset } from 'utils/store';

import { MyTask, ProfileShort, Task, TaskHistoryEntry } from './task.entity';

interface TaskState {
  loadTask: { [id: string]: ApiCallState<Task | null> };
  loadTaskHistory: { [id: string]: ApiCallState<TaskHistoryEntry[]> };
  loadMyTasks: ApiCallState<MyTask[]>;
  loadExecutors: ApiCallState<ProfileShort[]>;
  saveTask: ApiCallState<string>;
  deleteTask: ApiCallState<string>;
  changeStatus: ApiCallState<string>;
  setLoadTask: (id: string, state: ApiCallState<Task | null>) => void;
  setLoadTaskHistory: (id: string, state: ApiCallState<TaskHistoryEntry[]>) => void;
  setLoadMyTasks: (state: ApiCallState<MyTask[]>) => void;
  setLoadExecutors: (state: ApiCallState<ProfileShort[]>) => void;
  setSaveTask: (state: ApiCallState<string>) => void;
  setDeleteTask: (state: ApiCallState<string>) => void;
  setChangeStatus: (state: ApiCallState<string>) => void;
  /** Drop cached task data (one task or all) so mounted pages refetch it. */
  invalidate: (id?: string) => void;
  reset: () => void;
}

const initialState = {
  loadTask: {} as { [id: string]: ApiCallState<Task | null> },
  loadTaskHistory: {} as { [id: string]: ApiCallState<TaskHistoryEntry[]> },
  loadMyTasks: {} as ApiCallState<MyTask[]>,
  loadExecutors: {} as ApiCallState<ProfileShort[]>,
  saveTask: {} as ApiCallState<string>,
  deleteTask: {} as ApiCallState<string>,
  changeStatus: {} as ApiCallState<string>,
};

export const taskStore = create<TaskState>()((set) => ({
  ...initialState,

  setLoadTask: (id, state) => set((prev) => ({
    loadTask: { ...prev.loadTask, [id]: state },
  })),
  setLoadTaskHistory: (id, state) => set((prev) => ({
    loadTaskHistory: { ...prev.loadTaskHistory, [id]: state },
  })),
  setLoadMyTasks: (loadMyTasks) => set({ loadMyTasks }),
  setLoadExecutors: (loadExecutors) => set({ loadExecutors }),
  setSaveTask: (saveTask) => set({ saveTask }),
  setDeleteTask: (deleteTask) => set({ deleteTask }),
  setChangeStatus: (changeStatus) => set({ changeStatus }),
  invalidate: (id) => set((prev) => ({
    loadMyTasks: {},
    loadTask: id ? { ...prev.loadTask, [id]: {} } : {},
    loadTaskHistory: id ? { ...prev.loadTaskHistory, [id]: {} } : {},
  })),
  reset: () => set(initialState),
}));

export const useTaskStore = taskStore;

registerStoreReset(() => taskStore.getState().reset());
