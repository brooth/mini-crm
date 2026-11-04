import _ from "lodash";

export interface ApiError {
  code: string,
  message?: string,
  [key: string]: any,
}

export interface ApiCallState<V, E = ApiError> {
  value?: V | null,
  error?: E | null,
  isLoading?: boolean,
}

export function failed<V>(error: any, value?: V): ApiCallState<V> {
  if (/failed to fetch|network/i.test(error?.message ?? '')) {
    return {
      error: {
        code: 'http-error',
      },
      isLoading: false,
      value,
    };
  }
  if (error.type === 'TransportError') {
    return {
      error: {
        code: 'ws-error',
      },
      isLoading: false,
      value,
    };
  }
  // supabase errors: PostgrestError { code, message, details, hint } / AuthError { code?, message }
  if (error.code == null || !_.isString(error.code) || error.code === '')
    return {
      error: {
        code: 'server-error',
        message: error?.message,
      },
      isLoading: false,
      value,
    }
  return { error, value, isLoading: false };
}

export function loading<V>(value?: V | null): ApiCallState<V> {
  return { value, isLoading: true };
}

export function success<V>(value: V): ApiCallState<V> {
  return { value, isLoading: false, error: null };
}

export function empty<V>(): ApiCallState<V> {
  return { value: null, error: null, isLoading: false };
}

export const isLoading = (state?: ApiCallState<any>) => state?.isLoading === true;
export const isNotLoading = (state?: ApiCallState<any>) => !isLoading(state);
export const isSuccessful = (state?: ApiCallState<any>) => !isLoading(state) && state?.error == null && state?.value != null;
export const isNotSuccessful = (state?: ApiCallState<any>) => !isSuccessful(state);
export const isFailed = (state?: ApiCallState<any>) => !isLoading(state) && state?.error != null && state.value == null;
export const isEmpty = (state?: ApiCallState<any>) => _.isEmpty(state);
export const isUseless = (state?: ApiCallState<any>) => isEmpty(state) || isFailed(state);
export const isComplete = (state?: ApiCallState<any>) => isSuccessful(state) || isFailed(state);
export const isNotComplete = (state?: ApiCallState<any>) => !isComplete(state);

export function ApiCallStateBuilder<V>({
  state, onValueNull, onValueEmpty, onValueNotEmpty, onValue, onSuccess, onError, onLoading, orElse,
}: ApiCallStateBuilderProps<V>) {
  if (state) {
    if (onLoading != null && isLoading(state)) {
      return onLoading();
    }
    if (onError != null && isFailed(state)) {
      return onError(state.error!);
    }
    if (onValueNull != null && state.value === null) {
      return onValueNull();
    }
    if (onValueEmpty != null && _.isEmpty(state.value)) {
      return onValueEmpty();
    }
    if (onValueNotEmpty != null && _.isEmpty(state.value) === false) {
      return onValueNotEmpty(state.value!);
    }
    if (onValue != null && state.value != null) {
      return onValue(state.value);
    }
    if (onSuccess != null && isSuccessful(state)) {
      return onSuccess(state.value);
    }
  }
  if (orElse != null) return orElse();
  return null;
};

export type ApiCallStateBuilderProps<V> = {
  state: ApiCallState<V>,
  onValueNull?: () => JSX.Element | null,
  onValueEmpty?: () => JSX.Element | null,
  onValueNotEmpty?: (value: V) => JSX.Element | null,
  onValue?: (value: V) => JSX.Element | null,
  onSuccess?: (value?: V | null) => JSX.Element | null,
  onLoading?: (value?: V | null) => JSX.Element | null,
  onError?: (error: ApiError, value?: V) => JSX.Element | null,
  orElse?: () => JSX.Element | null,
}
