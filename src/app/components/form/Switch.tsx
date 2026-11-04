import { Switch, SwitchProps } from "@blueprintjs/core";
import { useMemo } from "react";

import { OnChangeEventHandler } from "utils";

import FormField, { FormFieldProps } from "./Field";
import "./Switch.css";


export default function SwitchField({
  className, hidden, disabled,
  name, value, onChange, readOnly, actions, ...rest
}: SwitchFieldProps) {
  const classNames = useMemo(() => {
    const classes = ['app-form-switch', className];
    if (disabled)
      classes.push('app-form-switch-disabled')
    if (readOnly || onChange == null)
      classes.push('app-form-switch-read-only')
    return classes.join(' ').trim();
  }, [className, readOnly, disabled, onChange]);

  return (
    <FormField
      horizontal
      className={classNames}
      disabled={disabled}
      hidden={hidden}
      {...rest}>
      <Switch
        alignIndicator="right"
        disabled={disabled}
        checked={value ?? false}
        onChange={onChange == null || readOnly ? undefined : ({ target }) => {
          onChange!({ target: { name, value: (target as any).checked } });
        }}
      />
    </FormField>
  );
}

export type SwitchFieldProps = FormFieldProps & Omit<SwitchProps, "onChange" | "checked" | "label" | "value"> & {
  name: string,
  onChange?: OnChangeEventHandler<boolean>
  value?: boolean,
}
