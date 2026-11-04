import * as Blueprint from "@blueprintjs/core";


export default function Popover({ ...rest }: PopoverProps) {
  return <Blueprint.Popover {...rest} />;
}

export type PopoverProps = Blueprint.PopoverProps;
