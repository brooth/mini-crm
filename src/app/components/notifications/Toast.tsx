import _ from "lodash";

import * as Blueprint from "@blueprintjs/core";
import { Translation } from "react-i18next";

import { ApiError } from "utils";

import "./toast.css";


export type ToastProps = Omit<Blueprint.ToastProps, "message"> & {
  message: string | [string, object?, string?]
}

class ToasterWrapper {
  private toaster: Blueprint.Toaster | null = null;
  private pending: Blueprint.ToastProps[] = [];

  constructor() {
    Blueprint.OverlayToaster.create({
      className: "app-toast",
      maxToasts: 1,
    }).then((instance) => {
      this.toaster = instance;
      this.pending.forEach((props) => instance.show(props));
      this.pending = [];
    });
  }

  public showApiError = (error: ApiError, { ...rest } = {}) => {
    const params = _.omit(error, "code", "message");
    const message: [string, object?, string?] =
      [`ApiErrors.${error.code}`, params, error.message || error.code];
    const icon = error.code === "http-error" || error.code === "ws-error"
      ? "offline" : "warning-sign";
    this.show({
      icon,
      intent: "danger",
      message,
      ...rest,
    });
  };

  public showSuccess(props: ToastProps, key?: string | undefined) {
    this.show({
      icon: "confirm",
      intent: "success",
      ...props,
    }, key);
  };

  public showWarning(props: ToastProps, key?: string | undefined) {
    this.show({
      icon: "confirm",
      intent: "warning",
      ...props,
    }, key);
  };

  public showInfo(props: ToastProps, key?: string | undefined) {
    this.show({
      icon: "confirm",
      intent: "none",
      ...props,
    }, key);
  };

  public showPrimary(props: ToastProps, key?: string | undefined) {
    this.show({
      icon: "confirm",
      intent: "primary",
      ...props,
    }, key);
  };

  public showDanger(props: ToastProps, key?: string | undefined) {
    this.show({
      icon: "confirm",
      intent: "danger",
      ...props,
    }, key);
  };

  private show(props: ToastProps, key?: string | undefined) {
    const message = _.isArray(props.message) ? (
      <Translation>
        {t => t(props.message[0], props.message[2] as any, props.message[1] as any) as any}
      </Translation>
    ) : <span>{props.message}</span>;
    const toastProps = { ...props, message };
    if (this.toaster) {
      this.toaster.show(toastProps, key);
    } else {
      this.pending.push(toastProps);
    }
  }
}

const Toast = new ToasterWrapper();

export default Toast;
