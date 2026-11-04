import { Button } from "@blueprintjs/core";
import { ItemPredicate, Select, SelectProps } from "@blueprintjs/select";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { OnChangeEventHandler } from "utils";

import FormField, { FormFieldProps } from "./Field";

import "./Select.css";


export default function SelectField<T extends { id?: string }>({
  className, label, hidden, disabled, error, name, items,
  itemPredicate, readOnly, value, onChange, buttonRenderer,
  popoverProps, children, ...rest
}: SelectFieldProps<T>) {
  const { t } = useTranslation();
  const classes = useMemo(() => {
    const cls = ['app-form-select', className];
    if (readOnly) cls.push('app-form-select-read-only');
    return cls;
  }, [className, readOnly]);

  const selectedItem = items.find(i => i?.id === value?.id);

  return (
    <FormField
      className={classes.join(" ")}
      label={label}
      disabled={disabled}
      hidden={hidden}
      error={error} >
      <Select<T>
        items={items}
        activeItem={selectedItem}
        filterable={itemPredicate != null}
        itemPredicate={itemPredicate}
        disabled={readOnly || disabled}
        intent={error ? "danger" : undefined}
        onItemSelect={(value: T) => {
          if (onChange)
            onChange({ target: { name, value } });
        }}
        popoverProps={{
          minimal: true,
          matchTargetWidth: true,
          popoverClassName: 'app-form-select-popover',
          usePortal: true,
          ...popoverProps
        }}
        {...rest}
        inputProps={{
          ...rest.inputProps,
          placeholder: t("search_dots"),
        }}>
        <Button className={selectedItem ? undefined : 'app-form-select-placeholder'}>
          {buttonRenderer(selectedItem)}
        </Button>
      </Select>
      {children}
    </FormField>
  );
}


export type SelectFieldProps<T extends { id?: string }> = Omit<FormFieldProps, "children"> &
  Omit<SelectProps<T>, | "items" | "onItemSelect" | "onChange" |
    "filterable" | "itemPredicate" | "createNewItemRenderer"> & {
      name: string,
      items: T[],
      value?: { id?: string } | null,
      onChange?: OnChangeEventHandler<T>,
      readOnly?: boolean,
      buttonRenderer: (item?: T) => JSX.Element | string,
      itemPredicate?: ItemPredicate<T>,
    }
