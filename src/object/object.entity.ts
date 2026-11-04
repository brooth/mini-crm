import type { Tables } from 'lib/database.types';
import type { ProfileShort, TaskStatus } from 'task/task.entity';

export type CrmObject = Pick<Tables<'objects'>, 'id' | 'name' | 'address'>;

export type ObjectInput = Pick<CrmObject, 'name' | 'address'>;

export interface ObjectListItem extends CrmObject {
  // count is computed under RLS: an executor sees the number of his own tasks only
  tasks: Array<{ count: number }>;
}

/** Task row on the object card */
export interface ObjectTask {
  id: string;
  title: string;
  status: TaskStatus;
  created_at: string;
  assignee: ProfileShort;
}
