import * as Blueprint from "@blueprintjs/core";

import "./Menu.css";


export default function ({
  className, hidden, children, ...rest
}: MenuProps) {
  if (hidden)
    return null;

  const classes = ["app-menu-menu", className];
  return (
    <Blueprint.Menu className={classes.join(" ")} {...rest}>
      {children}
    </Blueprint.Menu>
  );
}

export type MenuProps = Blueprint.MenuProps & {
  hidden?: boolean;
}
