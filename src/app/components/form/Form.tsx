import _ from "lodash";

import { useMemo } from "react";

import { KeysDeep, OnChangeEventHandler, useClassNames } from "utils";

import Column, { ColumnProps } from "../flex/Column";
import "./Form.css";


export default function Form({
  className, children, ...rest }: FormProps) {
  const classes = useClassNames("app-form-form", className);
  const columnProps = useMemo(() => _.omit(rest, [
    "name",
    "visibleFields",
    "hiddenFields",
    "hiddenLabels",
    "readOnlyFields",
    "value",
    "errors",
    "readOnly",
    "onChange",
  ]) as Omit<ColumnProps, "title">, [rest])

  return (
    <Column className={classes} {...columnProps}>
      {children}
    </Column>
  );
}


export type FormProps<T = any> = Omit<ColumnProps, "title" | "onChange"> & {
  name?: string,
  visibleFields?: Array<KeysDeep<T>>,
  hiddenFields?: Array<KeysDeep<T>>,
  readOnlyFields?: Array<KeysDeep<T>>,
  disabledFields?: Array<KeysDeep<T>>,
  value?: T,
  errors?: { [K in keyof T]?: any },
  readOnly?: boolean,
  onChange?: OnChangeEventHandler<unknown>,
}
