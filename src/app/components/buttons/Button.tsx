import * as BluePrint from "@blueprintjs/core";
import { MaybeElement } from "@blueprintjs/core";
import { CSSProperties, useMemo } from "react";

import { useI18nText } from "i18n/hooks";
import { normalizeIconName, type ExtendedIconName } from "utils";

import "./Button.css";


export default function Button({
  id, className, text, icon, hidden, animateVisibility = true, loading,
  loadingAnimation = "waves", style, ...rest
}: ButtonProps) {
  if (hidden && !animateVisibility) return null;

  const buttonText = useI18nText(text);
  // Only normalize if icon is a string, otherwise pass through JSX elements
  const normalizedIcon = typeof icon === 'string' ? normalizeIconName(icon) : icon;
  const classes = useMemo(() => {
    const cls = ["app-buttons-button"];
    if (className) cls.push(className);
    if (loading && loadingAnimation === "waves") cls.push("app-buttons-button-loading")
    if (hidden && animateVisibility)
      cls.push("app-buttons-button-hidden");
    return cls.join(" ").trim();
  }, [className, hidden, loading, animateVisibility]);

  return (
    <BluePrint.Button
      id={id}
      className={classes}
      style={style}
      icon={normalizedIcon}
      loading={loadingAnimation === "circle" && loading}
      hidden={hidden}
      {...rest}>
      {buttonText}
    </BluePrint.Button>
  );
}


export type ButtonProps = Omit<BluePrint.ButtonProps, "text" | "hidden" | "icon"> & {
  id?: string,
  className?: string,
  text?: string | [string, object?, string?],
  icon?: ExtendedIconName | MaybeElement,
  hidden?: boolean,
  animateVisibility?: boolean,
  loadingAnimation?: "waves" | "circle",
  style?: CSSProperties,
}
