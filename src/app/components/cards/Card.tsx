import * as Blueprint from "@blueprintjs/core";
import { useMemo } from "react";

import "./Card.css";


export default function Card({
  className, animating = false, height, style, children, ...rest
}: CardProps) {
  const classes = useMemo(() => {
    const classes = ["app-card", className];
    if (animating) classes.push("app-card-animating");
    if (height != null) classes.push("app-card-grid");
    return classes.join(' ');
  }, [className, animating, height]);

  const mergedStyle = useMemo(() => (
    height != null ? { height, ...style } : style
  ), [height, style]);

  return (
    <Blueprint.Card className={classes} style={mergedStyle} {...rest}>
      {children}
    </Blueprint.Card>
  );
}

export type CardProps = Omit<Blueprint.CardProps, "title"> & {
  animating?: boolean,
  height?: number,
}
