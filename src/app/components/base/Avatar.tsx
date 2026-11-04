import { useMemo } from "react";

import "./Avatar.css";


export default function Avatar({
  className, hidden, name, picture, size = 40, grayscale, style, ...rest
}: AvatarProps) {
  if (hidden) return null;

  const classes = useMemo(() => {
    const classes = ["app-base-avatar", className]
    if (grayscale)
      classes.push("app-base-avatar-grayscale")
    return classes.join(" ").trim();
  }, [className, grayscale]);

  return (
    <div className={classes} {...rest}
      style={{ width: size!, height: size!, ...style }}>
      {name &&
        <span style={{ fontSize: Math.min(size! * 0.40, 17) }}>{name.split(' ').map(part => part ? part[0].toUpperCase() : '').splice(0, 2)}</span>
      }
      {picture &&
        <img alt="" src={picture} width={size! - 1} height={size! - 1}
          onError={(event: any) => event.target.style.display = 'none'} />
      }
    </div>
  );
}

export type AvatarProps = React.ComponentPropsWithRef<"div"> & {
  className?: string;
  name?: string;
  picture?: string;
  size?: number;
  hidden?: boolean;
  grayscale?: boolean;
};
