import { Dialog, DialogBody, DialogFooter } from "@blueprintjs/core";
import { FormEvent } from "react";

import { Button, DropdownField, Form, TextAreaField, TextInputField, Toast } from "app/components";
import { useLoadObjects } from "object/object.hooks";
import { useApiErrors, useFormData } from "utils";

import { Task, TaskInput } from "../task.entity";
import { useLoadExecutors, useSaveTask } from "../task.hooks";


/** Create (no `task`) or edit a task. Manager only — the database rejects writes from executors anyway. */
export default function TaskDialog({ isOpen, task, defaultObjectId, onClose, onSaved }: TaskDialogProps) {
  const { objects } = useLoadObjects({ auto: isOpen });
  const { executors } = useLoadExecutors({ auto: isOpen });
  const { saveTaskState, saveTask } = useSaveTask();

  const origin: TaskInput | null = task ? {
    title: task.title,
    description: task.description,
    object_id: task.object_id,
    assignee_id: task.assignee_id,
  } : null;
  const { formData, onChange, formErrors, setFormErrors } = useFormData<TaskInput>(
    origin,
    { title: '', description: '', object_id: defaultObjectId ?? '', assignee_id: '' },
    [isOpen, task]);
  useApiErrors(saveTaskState);

  const onSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    const errors: Partial<Record<keyof TaskInput, string>> = {};
    if (!formData.title?.trim()) errors.title = 'обязательно';
    if (!formData.object_id) errors.object_id = 'обязательно';
    if (!formData.assignee_id) errors.assignee_id = 'обязательно';
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }
    const id = await saveTask(task?.id ?? null, formData, task?.object_id);
    if (id) {
      Toast.showSuccess({ message: task ? 'Задача сохранена' : 'Задача создана' });
      onSaved?.(id);
      onClose();
    }
  };

  return (
    <Dialog
      title={task ? 'Редактировать задачу' : 'Новая задача'}
      isOpen={isOpen}
      onClose={() => !saveTaskState.isLoading && onClose()}>
      <form onSubmit={onSubmit}>
        <DialogBody>
          <Form>
            <TextInputField
              name="title"
              label="Название"
              value={formData.title}
              error={formErrors.title}
              onChange={onChange}
              autoFocus
            />
            <TextAreaField
              name="description"
              label="Описание"
              value={formData.description}
              onChange={onChange}
              rows={4}
            />
            <DropdownField
              name="object_id"
              label="Объект"
              nullable
              value={formData.object_id}
              error={formErrors.object_id}
              onChange={onChange}
              options={objects.map((o) => ({ id: o.id, value: o.id, label: o.name }))}
            />
            <DropdownField
              name="assignee_id"
              label="Исполнитель"
              nullable
              value={formData.assignee_id}
              error={formErrors.assignee_id}
              onChange={onChange}
              options={executors.map((p) => ({ id: p.id, value: p.id, label: p.full_name }))}
            />
          </Form>
        </DialogBody>
        <DialogFooter
          actions={
            <>
              <Button text="Отмена" onClick={onClose} />
              <Button
                type="submit"
                intent="primary"
                text={task ? 'Сохранить' : 'Создать'}
                loading={saveTaskState.isLoading}
              />
            </>
          }
        />
      </form>
    </Dialog>
  );
}

export type TaskDialogProps = {
  isOpen: boolean,
  task?: Task | null,
  defaultObjectId?: string,
  onClose: () => void,
  onSaved?: (id: string) => void,
}
