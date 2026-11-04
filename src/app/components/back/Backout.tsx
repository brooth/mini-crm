import { NonIdealState, NonIdealStateProps, MaybeElement } from "@blueprintjs/core";
import { useMemo } from "react";

import { useI18nText } from "i18n/hooks";
import { normalizeIconName, type ExtendedIconName } from "utils";

import "./Backout.css";


export default function Backout({
  className, title, message, icon, children, compact, medium, ...rest
}: BackoutProps) {
  const classes = useMemo(() => {
    const classes = ["app-back-backout", className];
    if (compact) classes.push("app-back-backout-compact");
    if (medium) classes.push("app-back-backout-medium");
    return classes.join(' ').trim();
  }, [className, compact]);

  // i18n
  const titleText = useI18nText(title);
  const msgText = useI18nText(message);
  // Only normalize if icon is a string, otherwise pass through JSX elements
  const normalizedIcon = typeof icon === 'string' ? normalizeIconName(icon) : icon;

  return (
    <NonIdealState
      className={classes}
      title={titleText}
      description={msgText}
      icon={normalizedIcon}
      {...rest}>
      {children}
    </NonIdealState>
  );
}

export type BackoutProps = Omit<NonIdealStateProps, "title" | "description" | "icon"> & {
  title?: string | [string, object?, string?],
  message?: string | [string, object?, string?],
  icon?: ExtendedIconName | MaybeElement,
  compact?: boolean;
  medium?: boolean;
}
