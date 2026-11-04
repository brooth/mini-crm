import _ from 'lodash';
import { useTranslation } from "react-i18next";

import { ApiError } from "utils";
import { Button } from '../buttons';
import Backout, { BackoutProps } from './Backout';


export default function ({
  error, onTryAgain, ...rest
}: BackoutApiErrorProps) {
  const { t } = useTranslation();
  const params = _.omit(error, "code", "message");
  const titleText = t(`ApiErrors.${error.code}`, error.code, params);
  const msgText = (import.meta.env.VITE_DEBUG === 'true' ? error.message : null)
    ?? t(`ApiErrors.${error.code}_msg`, '', params);
  const icon = error.code === "http-error" || error.code === "ws-error"
    ? "offline" : "warning-sign";
  return (
    <Backout
      icon={icon}
      title={String(titleText)}
      message={String(msgText)}
      action={onTryAgain &&
        <Button
          outlined
          text={["tryAgain"]}
          onClick={onTryAgain} />}
      {...rest}
    />
  );
}

export type BackoutApiErrorProps = BackoutProps & {
  error: ApiError,
  onTryAgain?: () => void,
}
