import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../lib/storageKeys';
import { Language, LANGUAGE_NAMES, WEEKDAYS, translations } from './translations';

export type { Language };
export { LANGUAGE_NAMES, WEEKDAYS };

const DEFAULT_LANGUAGE: Language = 'ja';

function resolve(path: string, language: Language): string {
  const parts = path.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let node: any = translations[language];
  for (const part of parts) {
    node = node?.[part];
  }
  if (typeof node === 'string') return node;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fallback: any = translations[DEFAULT_LANGUAGE];
  for (const part of parts) {
    fallback = fallback?.[part];
  }
  return typeof fallback === 'string' ? fallback : path;
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) =>
    key in vars ? String(vars[key]) : match,
  );
}

type ContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<ContextValue>({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.language).then((value) => {
      if (value && value in translations) {
        setLanguageState(value as Language);
      }
    });
  }, []);

  function setLanguage(next: Language) {
    setLanguageState(next);
    AsyncStorage.setItem(STORAGE_KEYS.language, next);
  }

  function t(key: string, vars?: Record<string, string | number>): string {
    return interpolate(resolve(key, language), vars);
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
