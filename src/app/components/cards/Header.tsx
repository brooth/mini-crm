import React from "react";

import { useClassNames } from "utils";
import { useI18nText } from "i18n/hooks";

import "./Header.css";


export default function CardHeader({
  className, left, title, error, right, rightProps, ...rest
}: CardHeaderProps) {
  const classNames = useClassNames("app-card-header", "cardHeader", className);
  const titleText = useI18nText(title);
  const errorText = useI18nText(error);

  return (
    <div className={classNames} {...rest}>
      <div className='left'>{left}</div>
      <h4 className={error ? 'error' : undefined}>{titleText}<span>{error ? ': ' + errorText : null}</span> </h4>
      <div className='right' {...rightProps}>{right}</div>
    </div>
  );
}

export type CardHeaderProps = Omit<React.ComponentPropsWithRef<"div">, "title"> & {
  title?: string | [string, object?, string?],
  error?: string | [string, object?, string?],
  left?: React.ReactNode,
  right?: React.ReactNode,
  rightProps?: React.ComponentPropsWithRef<"div">,
}
