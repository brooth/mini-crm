import type { Intent } from '@blueprintjs/core';

import type { Profile } from 'auth/auth.entity';

import { TaskStatus } from './task.entity';

export interface TaskAction {
  to: TaskStatus;
  label: string;
  needsComment?: boolean;
  intent?: Intent;
}

/**
 * Mirror of the transition table in change_task_status() — only decides which
 * buttons to show. The database re-checks every transition on its own.
 */
export function availableActions(
  task: { status: TaskStatus, assignee_id: string },
  me: Pick<Profile, 'id' | 'role'>,
): TaskAction[] {
  const isAssignee = task.assignee_id === me.id;
  const isManager = me.role === 'manager';
  switch (task.status) {
    case 'new':
      return isAssignee ? [{ to: 'in_progress', label: 'Взять в работу', intent: 'primary' }] : [];
    case 'in_progress':
      return isAssignee ? [{ to: 'review', label: 'Отправить на проверку', intent: 'primary' }] : [];
    case 'rework':
      return isAssignee ? [{ to: 'in_progress', label: 'Взять в работу', intent: 'primary' }] : [];
    case 'review':
      return isManager ? [
        { to: 'accepted', label: 'Принять', intent: 'success' },
        { to: 'rework', label: 'Вернуть на доработку', needsComment: true, intent: 'warning' },
      ] : [];
    default:
      return [];
  }
}
