import * as Blueprint from "@blueprintjs/core";


export default function HtmlTable({
  className, ...rest
}: HtmlTableProps) {
  const classes = ["app-base-html-table", className].join(" ");
  return <Blueprint.HTMLTable className={classes} {...rest} />;
}

export type HtmlTableProps = Blueprint.HTMLTableProps;
