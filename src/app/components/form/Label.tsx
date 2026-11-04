import _ from "lodash";

import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { InfoTooltip } from "app/components/tooltips";
import { useI18nText } from "i18n/hooks";

import "./Label.css";


export default function FormLabel({
  className, text, tooltip, actions, children, ...rest
}: FormLabelProps) {
  const { t } = useTranslation();
  const classes = ["app-form-label", className];
  const labelText = useI18nText(text);
  const tooltipText = useMemo(() =>
    _.isArray(tooltip) ? t(tooltip[0], tooltip[2] as any, tooltip[1] as any) as string : _.isString(tooltip) ? tooltip : null,
    [tooltip])

  return (
    <>
      <div className={classes.join(' ')} {...rest}>
        <span className="text">
          {labelText}
          {tooltipText && (
            <InfoTooltip content={tooltipText} position="top-right" />
          )}
        </span>
        {actions}
      </div>
      {children}
    </>
  );
}

export type FormLabelProps = React.ComponentPropsWithRef<"div"> & {
  text?: string | [string, object?, string?],
  tooltip?: string | [string, object?, string?],
  actions?: React.ReactNode,
}
