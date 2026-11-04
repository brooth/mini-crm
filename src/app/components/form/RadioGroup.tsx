import { Radio, RadioGroup, RadioGroupProps } from "@blueprintjs/core";
import { useMemo } from "react";

import { OnChangeEventHandler } from "utils";

import FormField, { FormFieldProps } from "./Field";
import "./RadioGroup.css";


export default function RadioGroupField<T>({
  className, label, hidden, disabled, error,
  name, value, readOnly, options, onChange, children,
  radioGroupProps, ...rest
}: RadioGroupFieldProps<T>) {
  const classes = useMemo(() => {
    const items = ['app-form-radio-group', 'radioGroupField', className];
    if (readOnly) items.push('app-form-radio-group-read-only');
    return items.join(' ');
  }, [className, readOnly]);

  const selectedOption = useMemo(() =>
    options.find(o => o.id === value),
    [value, options]);

  const elements = useMemo(() => {
    const opts = new Array<JSX.Element>();
    options.forEach((o, index) =>
      opts.push(
        <Radio
          key={`radion_${index}`}
          label={o.label}
          value={o.id}
        />));
    return opts;
  }, [options])

  return (
    <FormField
      className={classes}
      label={label}
      disabled={disabled}
      hidden={hidden}
      intent={error ? "danger" : undefined}
      error={error}
      {...rest}>
      <RadioGroup
        name={name}
        selectedValue={selectedOption?.id}
        disabled={disabled}
        onChange={(e) => {
          const item = options.find(o => o.id === (e.target as HTMLInputElement).value);
          if (item && onChange && !readOnly)
            onChange({
              target: {
                name: name || '',
                value: item.value,
              }
            });
        }}
        {...radioGroupProps}>
        {elements}
      </RadioGroup>
      {children}
    </FormField>
  );
}

export type RadioOption<T> = {
  id: string;
  label: string;
  value: T;
};

export type RadioGroupFieldProps<T> = FormFieldProps & {
  name?: string,
  value?: string, // id
  onChange?: OnChangeEventHandler<T>,
  options: Array<RadioOption<T>>,
  readOnly?: boolean,
  radioGroupProps?: Omit<RadioGroupProps, "onChange" | "options" | "selectedValue">,
}
