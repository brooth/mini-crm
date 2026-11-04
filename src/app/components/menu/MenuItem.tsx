import * as Blueprint from "@blueprintjs/core";
import { MaybeElement } from "@blueprintjs/core";
import _ from 'lodash';

import { useTranslation } from 'react-i18next';
import { normalizeIconName, type ExtendedIconName } from "utils";
import "./MenuItem.css";


export default function ({
  className, hidden, text, icon, children, ...rest
}: MenuItemProps) {
  if (hidden)
    return null;
  const { t } = useTranslation();
  const classes = ["app-menu-menu-item", className];
  const textValue = _.isArray(text) ? t(text[0], text[2] as any, text[1] as any) as string : text;
  // Only normalize if icon is a string, otherwise pass through JSX elements
  const normalizedIcon = typeof icon === 'string' ? normalizeIconName(icon) : icon;
  return (
    <Blueprint.MenuItem
      className={classes.join(" ")}
      text={textValue}
      icon={normalizedIcon}
      {...rest}>
      {children}
    </Blueprint.MenuItem>
  );
}

export type MenuItemProps = Omit<Blueprint.MenuItemProps, 'icon'> & {
  hidden?: boolean;
  text?: string | [string, object?, string?],
  icon?: ExtendedIconName | MaybeElement;
}
