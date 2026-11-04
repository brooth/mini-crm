import _ from "lodash";

import * as Blueprint from "@blueprintjs/core";
import { useTranslation } from "react-i18next";

import "./MenuDivider.css";


export default function ({
  className, hidden, title, children, ...rest
}: MenuDividerProps) {
  if (hidden)
    return null;

  const { t } = useTranslation();
  const classes = ["app-menu-menu-divider", className];
  const titleText = _.isArray(title) ? t(title[0], title[2] as any, title[1] as any) as string : title;

  return (
    <Blueprint.MenuDivider
      className={classes.join(" ")}
      title={titleText}
      {...rest}>
      {children}
    </Blueprint.MenuDivider>
  );
}

export type MenuDividerProps = Blueprint.MenuDividerProps & {
  hidden?: boolean;
}
