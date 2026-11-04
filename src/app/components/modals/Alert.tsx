import * as Blueprint from "@blueprintjs/core";

import { useI18nText } from "i18n/hooks";


export default function ({
  confirmButtonText, cancelButtonText, children, ...rest
}: AlertProps) {
  const confirmButtonTextValue = useI18nText(confirmButtonText);
  const cancelButtonTextValue = useI18nText(cancelButtonText);
  return (
    <Blueprint.Alert
      confirmButtonText={confirmButtonTextValue}
      cancelButtonText={cancelButtonTextValue}
      {...rest}>
      {children}
    </Blueprint.Alert>
  );
}

export type AlertProps = Omit<Blueprint.AlertProps,
  "confirmButtonText" |
  "cancelButtonText"> & {
    confirmButtonText?: string | [string, object?, string?],
    cancelButtonText?: string | [string, object?, string?],
  }
