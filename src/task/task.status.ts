import type { Intent } from '@blueprintjs/core';

import { TaskStatus } from './task.entity';

export const TASK_STATUSES: Record<TaskStatus, { label: string, intent: Intent }> = {
  new: { label: 'Новая', intent: 'none' },
  in_progress: { label: 'В работе', intent: 'primary' },
  review: { label: 'На проверке', intent: 'warning' },
  rework: { label: 'На доработке', intent: 'danger' },
  accepted: { label: 'Принята', intent: 'success' },
};

/** Display order (workflow order) */
export const TASK_STATUS_ORDER: TaskStatus[] = ['new', 'rework', 'in_progress', 'review', 'accepted'];
