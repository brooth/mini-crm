import { useLocation, useNavigate } from "react-router-dom";

import { Menu, MenuItem } from "app/components";
import type { MenuProps } from "app/components/menu/Menu";
import { useHasRole } from "auth/auth.hooks";
import { useClassNames } from "utils";

import "./Sidebar.css";


export default function Sidebar({
  className, ...rest
}: AppSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const classes = useClassNames("app-sidebar", className);
  const isManager = useHasRole('manager');

  const isSelected = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <Menu className={classes} {...rest}>
      <MenuItem
        icon={isManager ? 'clipboard' : '@myTasks'}
        onClick={() => navigate('/my-tasks')}
        active={isSelected('/my-tasks')}
        text="Мои задачи"
      />
      <MenuItem
        icon="@object"
        onClick={() => navigate('/objects')}
        active={isSelected('/objects')}
        text="Объекты"
      />
    </Menu>
  );
}

export type AppSidebarProps = Omit<MenuProps, "children"> & {
}
