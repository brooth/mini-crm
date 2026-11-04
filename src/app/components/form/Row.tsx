import React from "react";

import "./Row.css";


export default function FormRow({
  className, children, ...rest
}: FormRowProps) {
  // consts
  const classes = ["app-form-row", className].join(" ");

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}

export type FormRowProps = React.ComponentPropsWithRef<"div"> & {

}
