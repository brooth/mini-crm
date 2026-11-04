import {
  HTMLInputProps, NumericInput, NumericInputProps
} from "@blueprintjs/core";
import { useState } from "react";

import { OnChangeEventHandler } from "utils";
import { useI18nText } from "i18n/hooks";

import FormField, { FormFieldProps } from "./Field";
import "./Numeric.css";


export default function NumericInputField({
  className, label, hidden, disabled, error, placeholder,
  name, value, onChange, startElement, endElement,
  selectAllOnFocus = false, readOnly, horizontal,
  actions, ...rest
}: NumericInputFieldProps) {
  const rtl = document.body.classList.contains('rtl');
  const [buff, setBuff] = useState<string | null>(null);
  const placeholderText = useI18nText(placeholder);

  return (
    <FormField
      horizontal={horizontal}
      className={["app-form-numeric", className].join(" ")}
      label={label}
      disabled={disabled}
      hidden={hidden}
      actions={actions}
      error={error} >
      <NumericInput
        disabled={disabled}
        readOnly={readOnly}
        intent={error ? "danger" : undefined}
        value={buff === null
          ? value?.toLocaleString("fullwide", {
            maximumSignificantDigits: 20,
            useGrouping: false,
          }) : buff}
        placeholder={placeholderText}
        onValueChange={(val, str) => {
          if (onChange == null) return;
          if (str === '') {
            setBuff('');
            onChange({ target: { name, value: null } });
          } else if (str !== val.toLocaleString("fullwide", {
            maximumSignificantDigits: 20,
            useGrouping: false,
          })) {
            setBuff(str);
          } else {
            setBuff(null);
            onChange({ target: { name, value: val } });
          }
        }}
        onKeyUp={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur();
          }
        }}
        onBlur={() => {
          const str = value?.toLocaleString("fullwide", {
            maximumSignificantDigits: 20,
            useGrouping: false,
          })
          if (buff !== str)
            setBuff(str || '');
        }}
        buttonPosition={readOnly ? "none" : undefined}
        onFocus={(e) => {
          if (selectAllOnFocus)
            setTimeout(() => e.target.select(), 100);
        }}
        leftElement={rtl ? endElement : startElement}
        rightElement={rtl ? startElement : endElement}
        {...rest}
      />
    </FormField>
  );
}

export type NumericInputFieldProps = FormFieldProps &
  Omit<NumericInputProps, "placeholder"> &
  Omit<HTMLInputProps, "onChange" | "placeholder"> & {
    name: string,
    onChange?: OnChangeEventHandler<number | null>
    placeholder?: string | [string, object?, string?],
    selectAllOnFocus?: boolean,
    startElement?: JSX.Element,
    endElement?: JSX.Element,
    value?: number,
  }
