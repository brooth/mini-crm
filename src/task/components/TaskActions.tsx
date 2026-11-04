import { Dialog, DialogBody, DialogFooter } from "@blueprintjs/core";
import { useState } from "react";

import { Button, TextAreaField, Toast } from "app/components";
import { useProfile } from "auth/auth.hooks";
import { useApiErrors } from "utils";

import { TaskAction, availableActions } from "../task.actions";
import { Task } from "../task.entity";
import { useChangeTaskStatus } from "../task.hooks";
import { TASK_STATUSES } from "../task.status";


export default function TaskActions({ task }: TaskActionsProps) {
  const profile = useProfile();
  const { changeStatusState, changeStatus } = useChangeTaskStatus();
  useApiErrors(changeStatusState);

  const [pending, setPending] = useState<TaskAction | null>(null);
  const [commentAction, setCommentAction] = useState<TaskAction | null>(null);
  const [comment, setComment] = useState('');

  const actions = availableActions(task, profile);
  if (!actions.length) return null;

  const run = async (action: TaskAction, actionComment?: string) => {
    setPending(action);
    const ok = await changeStatus(task, action.to, actionComment);
    setPending(null);
    if (ok) {
      setCommentAction(null);
      setComment('');
      Toast.showSuccess({ message: `Статус изменён: ${TASK_STATUSES[action.to].label}` });
    }
  };

  return (
    <>
      {/* rendered as direct PageHeader children, like other header buttons */}
      {actions.map((action) => (
        <Button
          key={action.to}
          text={action.label}
          intent={action.intent}
          loading={pending === action}
          disabled={changeStatusState.isLoading}
          onClick={() => action.needsComment ? setCommentAction(action) : run(action)}
        />
      ))}
      <Dialog
        title={commentAction?.label}
        isOpen={commentAction != null}
        onClose={() => !changeStatusState.isLoading && setCommentAction(null)}>
        <DialogBody>
          <TextAreaField
            label="Комментарий (обязательно)"
            placeholder="Что нужно исправить?"
            value={comment}
            autoFocus
            rows={4}
            onChange={({ target }) => setComment(target.value)}
          />
        </DialogBody>
        <DialogFooter
          actions={
            <>
              <Button text="Отмена" onClick={() => setCommentAction(null)} />
              <Button
                text={commentAction?.label}
                intent={commentAction?.intent}
                // the database rejects an empty/whitespace comment as well
                disabled={!comment.trim()}
                loading={changeStatusState.isLoading}
                onClick={() => run(commentAction!, comment)}
              />
            </>
          }
        />
      </Dialog>
    </>
  );
}

export type TaskActionsProps = {
  task: Pick<Task, 'id' | 'status' | 'assignee_id' | 'object_id'>,
}
