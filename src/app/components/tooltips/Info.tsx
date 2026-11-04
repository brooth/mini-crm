import { Icon, IconProps, Tooltip, TooltipProps } from "@blueprintjs/core";

import { useClassNames } from "utils";
import { useI18nText } from "i18n/hooks";

import "./Info.css";


export default function ({ className, iconProps, content, ...rest }: InfoTooltipProps) {
  const classNames = useClassNames("app-tooltips-info", className);
  const contentText = useI18nText(content);

  return (
    <Tooltip className={classNames} content={contentText} {...rest}>
      <Icon icon='help' size={12} {...iconProps} />
    </Tooltip>
  );
}

export type InfoTooltipProps = Omit<TooltipProps, "content"> & {
  iconProps?: Partial<IconProps>,
  content: string | [string, object?, string?],
}
