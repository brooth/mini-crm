import _ from "lodash";

import { FormGroup, FormGroupProps } from "@blueprintjs/core";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import FormLabel from "app/components/form/Label";
import { useI18nText } from "i18n/hooks";

import "./Field.css";


export default function FormField({
  className, hidden, label = '', error, tooltip,
  children, actions, horizontal, borderless, ...rest
}: FormFieldProps) {
  if (hidden) return null;

  const { t } = useTranslation();

  // i18n
  const errorText = useI18nText(error);
  const labelText = useMemo(() => {
    const labelText = _.isArray(label) ? t(label[0], label[2] as any, label[1] as any) : label;
    return [labelText, (_.isEmpty(labelText) || _.isEmpty(errorText) ? '' : ': '), errorText].join('');
  }, [label, errorText]);

  const classNames = useMemo(() => {
    const items = ["app-form-field", "formField", className];
    if (horizontal) items.push("horizontal");
    if (errorText) items.push("error");
    if (borderless) items.push("app-form-field-borderless");
    return items.join(' ');
  }, [className, errorText, horizontal]);

  return (
    <FormGroup
      className={classNames}
      label={
        <FormLabel
          text={labelText}
          tooltip={tooltip}
          actions={actions}
        />
      } {...rest} >
      {children}
    </FormGroup>
  );
}

export type FormFieldProps = Omit<FormGroupProps, "onChange" | "defaultValue"> & {
  hidden?: boolean,
  label?: string | [string, object?, string?],
  error?: string | [string, object?, string?],
  tooltip?: string | [string, object?, string?],
  children?: React.ReactNode,
  actions?: React.ReactNode,
  horizontal?: boolean,
  borderless?: boolean;
}
