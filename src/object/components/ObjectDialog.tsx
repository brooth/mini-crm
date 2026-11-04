import { Dialog, DialogBody, DialogFooter } from "@blueprintjs/core";
import { FormEvent } from "react";

import { Button, Form, TextInputField, Toast } from "app/components";
import { useApiErrors, useFormData } from "utils";

import { CrmObject, ObjectInput } from "../object.entity";
import { useSaveObject } from "../object.hooks";


/** Create (no `object`) or edit an object. */
export default function ObjectDialog({ isOpen, object, onClose, onSaved }: ObjectDialogProps) {
  const { saveObjectState, saveObject } = useSaveObject();
  const { formData, onChange, formErrors, setFormErrors } = useFormData<ObjectInput>(
    object ? { name: object.name, address: object.address } : null,
    { name: '', address: '' },
    [isOpen, object]);
  useApiErrors(saveObjectState);

  const onSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!formData.name?.trim()) {
      setFormErrors({ name: 'обязательно' });
      return;
    }
    const id = await saveObject(object?.id ?? null, formData);
    if (id) {
      Toast.showSuccess({ message: object ? 'Объект сохранён' : 'Объект создан' });
      onSaved?.(id);
      onClose();
    }
  };

  return (
    <Dialog
      title={object ? 'Редактировать объект' : 'Новый объект'}
      isOpen={isOpen}
      onClose={() => !saveObjectState.isLoading && onClose()}>
      <form onSubmit={onSubmit}>
        <DialogBody>
          <Form>
            <TextInputField
              name="name"
              label="Название"
              value={formData.name}
              error={formErrors.name}
              onChange={onChange}
              autoFocus
            />
            <TextInputField
              name="address"
              label="Адрес"
              value={formData.address}
              onChange={onChange}
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
                text={object ? 'Сохранить' : 'Создать'}
                loading={saveObjectState.isLoading}
              />
            </>
          }
        />
      </form>
    </Dialog>
  );
}

export type ObjectDialogProps = {
  isOpen: boolean,
  object?: CrmObject | null,
  onClose: () => void,
  onSaved?: (id: string) => void,
}
