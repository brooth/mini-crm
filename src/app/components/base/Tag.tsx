import * as Blueprint from "@blueprintjs/core";
import _ from 'lodash';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import "./Tag.css";


export default function Tag({
  className, children, ...rest
}: TagProps) {
  const { t } = useTranslation();
  const classes = ["app-base-tag", className];
  children = useMemo(() => {
    if (_.isArray(children))
      return t(children[0], children[2] as any, children[1] as any) as string;
    return children;
  }, [children]);
  return (
    <Blueprint.Tag className={classes.join(" ")} {...rest}>
      {children}
    </Blueprint.Tag>
  );
}

export type TagProps = Blueprint.TagProps & {
}
