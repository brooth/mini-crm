import React from "react";

import "./Grid.css";


export default function Grid({
  className, children, gap = 0, md = 3, sm, xs, ...rest
}: GridProps) {
  // consts
  const classes = ["app-flex-grid", className, `md-${md}`];
  if (sm != null) classes.push(`sm-${sm}`)
  if (xs != null) classes.push(`xs-${xs}`)
  return (
    <div
      className={classes.join(" ")}
      style={gap ? { gap } : {}}
      {...rest}>
      {children}
    </div>
  );
}

export type GridProps = React.ComponentPropsWithRef<"div"> & {
  gap?: number,
  md: 2 | 3 | 4,
  sm?: 1 | 2 | 3,
  xs?: 1 | 2,
}
