import React from "react";

import "./Content.css";


export default function PageContent({
  className, hidden, children, ...rest
}: PageContentProps) {
  if (hidden) return null;

  const classes = ["app-page-content", className].join(" ");

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}

export type PageContentProps = {
  className?: string,
  hidden?: boolean,
  children?: React.ReactNode,
}
