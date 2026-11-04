import React, { useMemo } from "react";

import "./Content.css";


export default function CardContent({
  className, children, ...rest
}: CardContentProps) {
  const classes = useMemo(() => {
    const cls = ["app-card-content"];
    if (className) cls.push(className);
    return cls.join(' ').trim();
  }, [className]);

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}

export type CardContentProps = React.ComponentPropsWithRef<"div"> & {
}
