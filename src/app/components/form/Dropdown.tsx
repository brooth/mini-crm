import { HTMLSelectProps } from "@blueprintjs/core";
import { useMemo } from "react";

import { OnChangeEventHandler } from "utils";

import FormField, { FormFieldProps } from "./Field";
import "./Dropdown.css";


export default function DropdownField<T>({
  className, label, hidden, disabled, error, nullable = false,
  name, value, readOnly, options, onChange, children,
  placeholder, selectProps, ...rest
}: DropdownFieldProps<T>) {
  const classes = useMemo(() => {
    const items = ['app-form-dropdown', 'dropdown-form-field', className];
    if (readOnly) items.push('app-form-dropdown-read-only');
    if (placeholder && options.length === 0)
      items.push('app-form-dropdown-placeholder');
    return items;
  }, [className, readOnly, placeholder]);

  const selected = useMemo(() => options.find(o => o.id === value),
    [value, options]);

  const elements = useMemo(() => {
    const opts = new Array<JSX.Element>();
    if (nullable && options.length > 0)
      opts.push(<option key={'option_null'} value={null as any}></option>);
    options.forEach((o, index) =>
      opts.push(<option key={`option_${index}`} value={o.id}>{o.label}</option>));
    if (opts.length === 0 && placeholder)
      opts.push(<option key={'option_placeholder'} disabled value="">{placeholder}</option>);
    return opts;
  }, [options, nullable, placeholder])

  return (
    <FormField
      className={classes.join(" ")}
      label={label}
      disabled={disabled}
      hidden={hidden}
      intent={error ? "danger" : undefined}
      error={error}
      {...rest}>
      <select
        name={name}
        value={selected?.id}
        placeholder={placeholder}
        disabled={readOnly || disabled}
        onChange={({ target: { name, value } }) => {
          const item = options.find(o => o.id === value);
          if (item && onChange)
            onChange({ target: { name, value: item.value } });
        }}
        {...selectProps}>
        {elements}
      </select>
      {children}
    </FormField>
  );
}

export type DropdownOption<T> = {
  id: string;
  label: string;
  value: T;
};

export type DropdownFieldProps<T> = FormFieldProps & {
  name?: string,
  nullable?: boolean,
  value?: string, // id
  placeholder?: string,
  onChange?: OnChangeEventHandler<T>,
  options: Array<DropdownOption<T>>,
  readOnly?: boolean,
  selectProps?: Omit<HTMLSelectProps, "onChange" | "options" | "value">,
}
