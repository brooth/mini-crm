import _ from "lodash";
import { useState } from "react";

import { copyToClipboard } from "utils/clipboard";
import Button, { ButtonProps } from "./Button";

import "./ClipboardButton.css";


export default function ClipboardButton({
  textToCopy, intent, ...rest
}: ClipboardButtonProps) {
  if (_.isEmpty(textToCopy)) return null;
  const [okayIcon, showOkayIcon] = useState(false);
  const [errorIcon, showErrorIcon] = useState(false);

  return (
    <Button
      variant="minimal"
      className="clipboardButton"
      icon={okayIcon ? "tick-circle" : errorIcon ? "error" : "clipboard"}
      intent={okayIcon ? "primary" : errorIcon ? "danger" : intent}
      onClick={(e) => {
        e.stopPropagation();
        if (copyToClipboard(textToCopy!)) {
          setTimeout(() => showOkayIcon(true), 100);
          setTimeout(() => showOkayIcon(false), 1000);
        } else {
          setTimeout(() => showErrorIcon(true), 100);
          setTimeout(() => showErrorIcon(false), 1000);
        }
      }}
      {...rest}
    />
  );
}


export type ClipboardButtonProps = ButtonProps & {
  textToCopy?: string,
}
