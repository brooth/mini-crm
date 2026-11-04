import React, { useMemo } from "react";
import { Property } from 'csstype';

import "./Column.css";


export default function Column({
  className, gap, mainAxis, crossAxis, children, fill, ...rest
}: ColumnProps) {
  const classes = useMemo(() => {
    const cls = ["app-flex-column", "flex-column", className];
    if (fill) cls.push("app-flex-column-fill");
    return cls.join(" ").trim();
  }, [className, fill])
  return (
    <div
      className={classes}
      style={{ gap, justifyContent: mainAxis, alignItems: crossAxis }}
      {...rest}>
      {children}
    </div>
  );
}

export type ColumnProps = React.ComponentPropsWithRef<"div"> & {
  gap?: number,
  mainAxis?: Property.JustifyContent;
  crossAxis?: Property.AlignItems;
  fill?: boolean;
}
