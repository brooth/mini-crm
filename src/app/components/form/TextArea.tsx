import { TextArea, TextAreaProps } from "@blueprintjs/core";

import { OnChangeEventHandler } from "utils";
import { useI18nText } from "i18n/hooks";

import FormField, { FormFieldProps } from "./Field";
import "./TextArea.css";


export default function TextAreaField({
  className, label, hidden, disabled, value, error,
  placeholder, nullable, onChange, ...rest
}: FormTextAreaProps) {
  const placeholderText = useI18nText(placeholder);

  return (
    <FormField
      className={["app-form-text-area", className].join(" ")}
      label={label}
      disabled={disabled}
      hidden={hidden}
      error={error}>
      <TextArea
        fill
        disabled={disabled}
        intent={error ? "danger" : undefined}
        placeholder={placeholderText}
        value={value || ''}
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


export type FormTextAreaProps = FormFieldProps &
  Omit<TextAreaProps, "value" | "placeholder" | "onChange"> & {
    value?: string,
    placeholder?: string | [string, object?, string?],
    nullable?: boolean,
    onChange?: OnChangeEventHandler<string>,
  }
