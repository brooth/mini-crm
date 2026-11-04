import { Spinner, SpinnerProps } from "@blueprintjs/core";

import "./ActivityIndicator.css";
import { useMemo } from "react";


export default function BackActivityIndicator({
  className, hidden, height, fadeInAnimation = true, size = 40, compact, ...rest
}: BackActivityIndicatorProps) {
  if (hidden) return null;

  const classes = useMemo(() => {
    const classes = ["app-back-activity-indicator", className];
    if (fadeInAnimation) classes.push("app-back-activity-indicator-fade-in-animation")
    if (compact) classes.push("app-back-activity-indicator-compact");
    return classes.join(' ').trim();
  }, [className, compact]);

  return (
    <Spinner
      className={classes}
      size={size}
      style={{ height }}
      {...rest} />
  );
}

export type BackActivityIndicatorProps = SpinnerProps & {
  hidden?: boolean,
  height?: number,
  size?: number,
  compact?: boolean,
  fadeInAnimation?: boolean,
}
