import { Property } from 'csstype';

import "./Row.css";


export default function Row({
  className, gap, mainAxis, crossAxis, children,
  innerRef, style, ...rest
}: RowProps) {
  return (
    <div
      ref={innerRef}
      className={["app-flex-row", "flex-row", className].join(" ").trim()}
      style={{ gap, justifyContent: mainAxis, alignItems: crossAxis, ...style }}
      {...rest}>
      {children}
    </div>
  );
}
export type RowProps = React.ComponentPropsWithRef<"div"> & {
  gap?: number,
  mainAxis?: Property.JustifyContent;
  crossAxis?: Property.AlignItems;
  innerRef?: React.LegacyRef<HTMLDivElement>,
}
