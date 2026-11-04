export type OnChangeEventTarget<V> = { name: string, value: V };
export type OnChangeEvent<V> = { target: OnChangeEventTarget<V> };
export type OnChangeEventHandler<V> = (...event: Array<OnChangeEvent<V>>) => void;


/** Recursively builds dot-notation paths for nested object fields. */
export type KeysDeep<T> = T extends object
  ? {
    [K in keyof T & string]: NonNullable<T[K]> extends (Date | Array<unknown>)
    ? K
    : NonNullable<T[K]> extends object
    ? K | `${K}.${KeysDeep<NonNullable<T[K]>>}`
    : K;
  }[keyof T & string]
  : never;