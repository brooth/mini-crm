import * as Blueprint from "@blueprintjs/core";
import { MaybeElement } from "@blueprintjs/core";
import { normalizeIconName, type ExtendedIconName } from "utils";


export default function Icon({ icon, ...rest }: IconProps) {
  // Only normalize if icon is a string, otherwise pass through JSX elements
  const normalizedIcon = typeof icon === 'string' ? normalizeIconName(icon) : icon;
  return <Blueprint.Icon icon={normalizedIcon} {...rest} />;
}

export type IconProps = Omit<Blueprint.IconProps, 'icon'> & {
  icon?: ExtendedIconName | MaybeElement;
};
