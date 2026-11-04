import _ from "lodash";

import logger from "loglevel";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { FormProps as EntityFormProps } from "app/components/form/Form";
import Toast from "app/components/notifications/Toast";
import { ApiCallState, isFailed } from "utils/api-state";
import { diffs } from "utils/objects";
import { OnChangeEventHandler } from "utils/types";


export function useInitial() {
  const firstRender = useRef(true);
  useEffect(() => {
    firstRender.current = false;
  }, []);
  return firstRender.current;
}

export function useApiErrors<S = any>(state: ApiCallState<S>, setFormErrors?: React.Dispatch<React.SetStateAction<any>>) {
  const initial = useInitial();
  useEffect(() => {
    if (!initial) {
      if (isFailed(state)) {
        if (state.error?.code === 'validation-error') {
          const fn = (value: any): any => {
            if (_.isArray(value)) {
              return [`Constraints.${value[0]}`, value[1] || {}];
            } else if (_.isObject(value)) {
              const obj: Record<string, any> = {};
              for (const prop of Object.getOwnPropertyNames(value))
                obj[prop] = fn((value as Record<string, any>)[prop]);
              return obj;
            } else {
              logger.error('invalid constraint value', value);
            }
          }
          if (setFormErrors) {
            setFormErrors(_.transform(state.error!.constraints,
              (result: Record<string, any>, value: any, key: string) => {
                result[key] = fn(value);
              }, {} as Record<string, any>));
          }
        }
        Toast.showApiError(state.error!);
      }
    }
  }, [state]);
}

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
};

type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

export function useFormData<V extends {}>(origin: DeepPartial<V> | null | undefined, defaults: DeepPartial<V> | (() => DeepPartial<V>) | null | undefined, deps?: any[]) {
  const orDefaults = useCallback(() => _.isFunction(defaults) ? defaults() : defaults, [defaults])
  const [formData, setFormData] = useState(() => origin as V || orDefaults()! as V || {} as V);
  const [formErrors, setFormErrors] = useState({} as { [K in keyof V]?: any });
  const changes = useMemo<Partial<V>>(() => diffs(formData, (origin || {}) as V) as Partial<V>, [origin, formData])

  useEffect(() =>
    setFormData(origin as V || orDefaults()! as V || {} as V),
    deps)

  const onChange: OnChangeEventHandler<unknown> = (...events) => {
    const data = _.cloneDeep(formData);
    for (const { target } of events) {
      if (_.get(formErrors, target.name)) {
        setFormErrors(_.omit(formErrors, target.name) as any);
      }
      _.set(data, target.name, target.value)
    }
    setFormData(data);
  };

  return {
    formData,
    setFormData,
    changes,
    formErrors,
    setFormErrors,
    onChange,
  }
}

export function useFieldName(formProps: Pick<EntityFormProps<any>, "name">) {
  return useCallback((fieldName: string) =>
    _.isEmpty(formProps.name) ? fieldName : (formProps.name + '.' + fieldName),
    [formProps.name]);
}

export function useIsFieldHidden(formProps: Pick<EntityFormProps<any>, "name" | "visibleFields" | "hiddenFields">) {
  return useCallback((shortName: string) =>
    formProps.visibleFields?.includes(shortName) === false ||
    formProps.hiddenFields?.includes(shortName) === true,
    [formProps.visibleFields, formProps.hiddenFields]);
}

export function useIsFieldReadOnly(formProps: Pick<EntityFormProps<any>, "name" | "readOnly" | "readOnlyFields">) {
  const fullName = useFieldName(formProps);
  return useCallback((shortName: string) =>
    formProps.readOnly || formProps.readOnlyFields?.includes(fullName(shortName)) === true,
    [formProps.readOnlyFields]);
}

export function useClassNames(...classNames: Array<string | undefined>) {
  return useMemo(() =>
    classNames.filter(className => className?.length).join(" "),
    classNames);
}

export function useLocalSearch<T>(
  items: T[] | null | undefined,
  query: string,
  setQuery: (q: string) => void,
  storageKey?: string,
) {
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (!storageKey) return [];
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : [];
    } catch {
      return [];
    }
  });

  const commitSearch = useCallback((q: string) => {
    if (!storageKey) return;
    const trimmed = q.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const next = [trimmed, ...prev.filter((r) => r !== trimmed)].slice(0, 10);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // ignore quota or access errors
      }
      return next;
    });
  }, [storageKey]);

  const filtered = useMemo(() => {
    if (!items) return undefined;
    if (!query) return items;
    const match = (value: any): boolean => {
      if (value == null) return false;
      if (typeof value === 'string') return value.toLowerCase().includes(query);
      if (typeof value === 'number') return String(value).includes(query);
      if (Array.isArray(value)) return value.some(match);
      if (typeof value === 'object') return Object.values(value).some(match);
      return false;
    };
    return items.filter(match);
  }, [items, query]);

  return { setQuery, filtered, recentSearches, commitSearch };
}
