import { InputGroup, InputGroupProps } from "@blueprintjs/core";

import { OnChangeEventHandler } from "utils";
import { useI18nText } from "i18n/hooks";

import FormField, { FormFieldProps } from "./Field";
import "./TextInput.css";


export default function FormTextInput({
  className, label, hidden, disabled, error, onSubmit,
  value, actions, startElement, endElement, placeholder, tooltip,
  nullable, onChange, selectAllOnFocus = false,
  ...rest
}: FormTextInputProps) {
  const rtl = document.body.classList.contains('rtl');
  const placeholderValue = useI18nText(placeholder);

  if (onSubmit) rest.onKeyUp = (e) => {
    if (e.key === 'Enter' || e.keyCode === 13) {
      onSubmit(e);
    }
  };

  return (
    <FormField
      className={["app-form-text-input", className].join(" ")}
      label={label}
      disabled={disabled}
      hidden={hidden}
      error={error}
      tooltip={tooltip}
      actions={actions}>
      <InputGroup
        disabled={disabled}
        intent={error ? "danger" : undefined}
        value={value || ''}
        placeholder={placeholderValue}
        leftElement={rtl ? endElement : startElement}
        rightElement={rtl ? startElement : endElement}
        onFocus={(e) => {
          if (selectAllOnFocus)
            setTimeout(() => e.target.select(), 100);
        }}
        onChange={onChange == null ? undefined : (e) => {
          onChange({
            target: {
              name: e.target.name,
              value: nullable && e.target.value.length === 0
                ? null as any
                : e.target.value,
            }
          })
        }}
        {...rest}
      />
    </FormField>
  );
}



export type FormTextInputProps = FormFieldProps &
  Omit<InputGroupProps, "value" | "placeholder" | "onChange"> & {
    value?: string | null,
    nullable?: boolean,
    onChange?: OnChangeEventHandler<string>,
    startElement?: JSX.Element,
    endElement?: JSX.Element,
    placeholder?: string | [string, object?, string?],
    selectAllOnFocus?: boolean,
  }
