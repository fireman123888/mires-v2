"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DEFAULT_LOCALE, LOCALES, Locale, translate } from "@/lib/messages";

const STORAGE_KEY = "mires-locale";

interface I18nContextValue {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key) => translate(DEFAULT_LOCALE, key),
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // Load saved locale once on mount; also detect browser language as fallback.
  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) as Locale | null;
    if (saved && LOCALES.includes(saved)) {
      setLocaleState(saved);
      document.documentElement.lang = saved === "zh" ? "zh-CN" : "en";
      return;
    }
    if (typeof navigator !== "undefined") {
      const navLang = navigator.language.toLowerCase();
      const guessed: Locale = navLang.startsWith("zh") ? "zh" : "en";
      setLocaleState(guessed);
      document.documentElement.lang = guessed === "zh" ? "zh-CN" : "en";
    }
  }, []);

  const setLocale = useCallback((loc: Locale) => {
    setLocaleState(loc);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, loc);
      document.documentElement.lang = loc === "zh" ? "zh-CN" : "en";
    }
  }, []);

  const t = useCallback((key: string) => translate(locale, key), [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useT() {
  return useContext(I18nContext);
}
