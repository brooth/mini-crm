import React, { useMemo } from "react";

import "./Content.css";


export default function CardContent({
  className, flush = false, children, ...rest
}: CardContentProps) {
  const classes = useMemo(() => {
    const cls = ["app-card-content"];
    if (flush) cls.push("app-card-content-flush");
    if (className) cls.push(className);
    return cls.join(' ').trim();
  }, [className, flush]);

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}

export type CardContentProps = React.ComponentPropsWithRef<"div"> & {
  /** No padding: content (e.g. a table) spans the card edge to edge and is clipped to its bottom corners */
  flush?: boolean,
}
