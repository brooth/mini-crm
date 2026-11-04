import * as Blueprint from "@blueprintjs/core";


export default function ResizeSensor({ ...rest }: ResizeSensorProps) {
  return <Blueprint.ResizeSensor {...rest} />;
}

export type ResizeSensorProps = Blueprint.ResizeSensorProps;
