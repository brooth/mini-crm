import type { IconName, Intent } from '@blueprintjs/core';

import type { Profile } from 'auth/auth.entity';

import { TaskStatus } from './task.entity';

export interface TaskAction {
  to: TaskStatus;
  label: string;
  /** Confirmation question, shown before the transition */
  confirm: string;
  icon: IconName;
  needsComment?: boolean;
  intent?: Intent;
}

const TAKE: TaskAction = {
  to: 'in_progress', label: 'Взять в работу', intent: 'primary', icon: 'play',
  confirm: 'Взять задачу в работу?',
};
const SEND_TO_REVIEW: TaskAction = {
  to: 'review', label: 'Отправить на проверку', intent: 'primary', icon: 'send-message',
  confirm: 'Отправить задачу на проверку постановщику?',
};
const ACCEPT: TaskAction = {
  to: 'accepted', label: 'Принять', intent: 'success', icon: 'tick-circle',
  confirm: 'Принять задачу? Статус «Принята» окончательный, изменить его будет нельзя.',
};
const RETURN_FOR_REWORK: TaskAction = {
  to: 'rework', label: 'Вернуть на доработку', intent: 'warning', icon: 'undo', needsComment: true,
  confirm: 'Вернуть задачу на доработку?',
};

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
      return isAssignee ? [TAKE] : [];
    case 'in_progress':
      return isAssignee ? [SEND_TO_REVIEW] : [];
    case 'rework':
      return isAssignee ? [TAKE] : [];
    case 'review':
      return isManager ? [ACCEPT, RETURN_FOR_REWORK] : [];
    default:
      return [];
  }
}
