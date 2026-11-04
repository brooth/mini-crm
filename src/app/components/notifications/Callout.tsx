import _ from "lodash";

import * as Blueprint from "@blueprintjs/core";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useClassNames } from "utils";

import "./Callout.css";


export default function (
  { action, className, children, ...rest }: CalloutProps
) {
  const { t } = useTranslation();
  const classNames = useClassNames("app-notifications-callout", "callout", className);

  children = useMemo(() => {
    if (_.isArray(children))
      return t(children[0], children[2] as any, children[1] as any) as string;
    return children;
  }, [children]);

  return (
    <Blueprint.Callout className={classNames} {...rest}>
      <div className={"app-notifications-callout-actions"}>
        {action}
      </div>
      {children}
    </Blueprint.Callout>
  );
}

export type CalloutProps = Blueprint.CalloutProps & {
  action?: JSX.Element,
}
