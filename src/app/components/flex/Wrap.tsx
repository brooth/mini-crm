import React from "react";

import "./Wrap.css";


export default function Wrap({
  className, children, gap, ...rest
}: WrapProps) {
  // consts
  const classes = ["app-flex-wrap", className];
  return (
    <div
      className={classes.join(" ")}
      style={{ gap }}
      {...rest}>
      {children}
    </div>
  );
}

export type WrapProps = React.ComponentPropsWithRef<"div"> & {
  gap?: number,
}
