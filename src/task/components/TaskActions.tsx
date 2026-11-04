import { Dialog, DialogBody, DialogFooter } from "@blueprintjs/core";
import { useState } from "react";

import { Alert, Button, TextAreaField, Toast } from "app/components";
import { useProfile } from "auth/auth.hooks";
import { useApiErrors } from "utils";

import { TaskAction, availableActions } from "../task.actions";
import { Task } from "../task.entity";
import { useChangeTaskStatus } from "../task.hooks";
import { TASK_STATUSES } from "../task.status";


/** Status buttons for the page header. Every transition is confirmed first. */
export default function TaskActions({ task }: TaskActionsProps) {
  const profile = useProfile();
  const { changeStatusState, changeStatus } = useChangeTaskStatus();
  useApiErrors(changeStatusState);

  const [confirming, setConfirming] = useState<TaskAction | null>(null);
  const [comment, setComment] = useState('');

  const actions = availableActions(task, profile);
  if (!actions.length) return null;

  const close = () => {
    if (changeStatusState.isLoading) return;
    setConfirming(null);
    setComment('');
  };

  const run = async (action: TaskAction) => {
    const ok = await changeStatus(task, action.to, action.needsComment ? comment : undefined);
    // on failure the toast shows the database error; keep the comment dialog open to retry
    if (ok || !action.needsComment) {
      setConfirming(null);
      setComment('');
    }
    if (ok)
      Toast.showSuccess({ message: `Статус изменён: ${TASK_STATUSES[action.to].label}` });
  };

  return (
    <>
      {/* rendered as direct PageHeader children, like other header buttons */}
      {actions.map((action) => (
        <Button
          key={action.to}
          text={action.label}
          intent={action.intent}
          loading={changeStatusState.isLoading && confirming === action}
          disabled={changeStatusState.isLoading}
          onClick={() => setConfirming(action)}
        />
      ))}
      <Alert
        isOpen={confirming != null && !confirming.needsComment}
        icon={confirming?.icon}
        intent={confirming?.intent}
        confirmButtonText={confirming?.label}
        cancelButtonText="Отмена"
        loading={changeStatusState.isLoading}
        onConfirm={() => run(confirming!)}
        onCancel={close}>
        <p>{confirming?.confirm}</p>
        <p><b>«{task.title}»</b></p>
      </Alert>
      <Dialog
        title={confirming?.label}
        icon={confirming?.icon}
        isOpen={confirming != null && !!confirming.needsComment}
        onClose={close}>
        <DialogBody>
          <p>{confirming?.confirm} <b>«{task.title}»</b></p>
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
              <Button text="Отмена" onClick={close} />
              <Button
                text={confirming?.label}
                intent={confirming?.intent}
                // the database rejects an empty/whitespace comment as well
                disabled={!comment.trim()}
                loading={changeStatusState.isLoading}
                onClick={() => run(confirming!)}
              />
            </>
          }
        />
      </Dialog>
    </>
  );
}

export type TaskActionsProps = {
  task: Pick<Task, 'id' | 'title' | 'status' | 'assignee_id' | 'object_id'>,
}
