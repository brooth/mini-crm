import * as Blueprint from "@blueprintjs/core";


export default function Navbar({
  className, ...rest
}: NavbarProps) {
  const classes = ["app-base-navbar", className].join(" ");
  return <Blueprint.Navbar className={classes} {...rest} />;
}

export const NavbarGroup = Blueprint.Navbar.Group;
export const NavbarHeading = Blueprint.Navbar.Heading;
export const NavbarDivider = Blueprint.Navbar.Divider;
export type NavbarProps = Blueprint.NavbarProps;
