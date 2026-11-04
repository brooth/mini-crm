import _ from "lodash";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

export function useI18nText(text?: string | [string, object?, string?]): string | undefined {
  const { t } = useTranslation();
  return useMemo(() => {
    if (text == null) return undefined;
    if (_.isArray(text)) {
      return t(text[0], text[2] as any, text[1] as any) as string;
    }
    return text;
  }, [text, t]);
}

export function useI18n() {
  const { t } = useTranslation();
  return useCallback((text?: string | [string, object?, string?]) => {
    if (text == null) return undefined;
    if (_.isArray(text)) {
      return t(text[0], text[2] as any, text[1] as any);
    }
    return text;
  }, [t]);
}
