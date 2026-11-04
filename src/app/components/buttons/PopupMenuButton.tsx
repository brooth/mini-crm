import { Menu, Popover, PopoverProps } from "@blueprintjs/core";

import Button, { ButtonProps } from "./Button";


export default function PopupMenuButton({
  popoverProps, children, ...buttonProps
}: PopupMenuButtonProps) {
  return (
    <Popover
      placement="bottom-end"
      interactionKind="click"
      content={
        <Menu>
          {children}
        </Menu>
      }
      {...popoverProps}>
      <Button variant="minimal" endIcon="menu" {...buttonProps} />
    </Popover>
  );
}


export type PopupMenuButtonProps = ButtonProps & {
  popoverProps?: PopoverProps,
}
