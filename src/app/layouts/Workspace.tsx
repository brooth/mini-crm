import { useState } from "react";
import { Outlet } from "react-router-dom";

import { Button, Popover, ResizeSensor } from "app/components";
import Sidebar from "../containers/Sidebar";
import Topbar from "../containers/Topbar";
import "./Workspace.css";


const displayMenuAsPopupWidth = 1000;

export default function WorkspaceLayout({
  className, ...rest
}: WorkspaceLayoutProps) {
  const classes = ["app-workspace", className];

  const [sidebarAsPopup, showSidebarAsPopup] =
    useState(window.innerWidth < displayMenuAsPopupWidth);

  const onResize = (entries: ResizeObserverEntry[]) => {
    let displaySidebarAsPopup = false;
    entries.forEach((e) => {
      if (e.contentRect.width < displayMenuAsPopupWidth) {
        displaySidebarAsPopup = true;
      }
    });
    if (displaySidebarAsPopup !== sidebarAsPopup) {
      showSidebarAsPopup(displaySidebarAsPopup);
    }
  };

  return (
    <ResizeSensor onResize={onResize}>
      <div className={classes.join(" ")} {...rest}>
        <Topbar
          menuButton={!sidebarAsPopup ? undefined :
            <Popover
              placement="bottom-end"
              interactionKind="click"
              content={<Sidebar />}>
              <Button icon="menu" />
            </Popover>
          }
        />
        <div className="app-workspace-body">
          {sidebarAsPopup ? undefined :
            <Sidebar className="app-workspace-sidebar" />
          }
          <div className="app-workspace-content">
            <Outlet />
          </div>
        </div>
      </div>
    </ResizeSensor>
  );
}

export type WorkspaceLayoutProps = React.ComponentPropsWithRef<"div"> & {
}
