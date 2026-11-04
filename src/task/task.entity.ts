import type { Enums, Tables } from 'app/database.types';
import type { Profile } from 'auth/auth.entity';

export type TaskStatus = Enums<'task_status'>;

export type ProfileShort = Pick<Profile, 'id' | 'full_name'>;

/** The only columns the client may write (column-level grants in the migration). */
export type TaskInput = Pick<Tables<'tasks'>, 'title' | 'description' | 'object_id' | 'assignee_id'>;

export interface Task extends TaskInput {
  id: string;
  status: TaskStatus;
  created_at: string;
  object: { id: string, name: string, address: string };
  assignee: ProfileShort;
  author: ProfileShort;
}

/** Row in "my tasks": assigned to me (executor) or created by me (manager) */
export interface MyTask {
  id: string;
  title: string;
  status: TaskStatus;
  created_at: string;
  object: { id: string, name: string };
  assignee: ProfileShort;
}

export interface TaskHistoryEntry {
  id: number;
  from_status: TaskStatus | null;
  to_status: TaskStatus;
  comment: string | null;
  created_at: string;
  actor: { full_name: string };
}
