import _ from "lodash";

import { Icon, IconName, MaybeElement } from "@blueprintjs/core";
import React from "react";

import { useClassNames, type ExtendedIconName } from "utils";
import { useI18nText } from "i18n/hooks";

import "./Item.css";


export default function ({
  className, hidden, icon, text, head, tail, children, ...rest
}: CardItemProps) {
  const classNames = useClassNames("app-card-item", "cartItem", className);
  const textText = useI18nText(text);
  const headNode = useI18nText(head as any);

  if (hidden)
      return null;
  if (_.isString(icon))
    icon = <Icon icon={icon as any} size={15} />

  return (
    <div className={classNames} {...rest}>
      <div className='icon'>{icon}</div>
      <div className='left'>{headNode}</div>
      <p>{textText}</p>
      <div className='right'>{tail}</div>
      {children}
    </div>
  );
}

export type CardItemProps = Omit<React.ComponentPropsWithRef<"div">, "title"> & {
  icon?: ExtendedIconName | MaybeElement,
  head?: React.ReactNode | string | [string, object?, string?],
  text?: string | [string, object?, string?],
  tail?: React.ReactNode,
}
