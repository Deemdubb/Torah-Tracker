import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { STRINGS, translateTitle, leafLabel, rangeLabel } from './i18n';

const LanguageContext = createContext(null);
const STORAGE_KEY = 'torah_lang_mode';

export function LanguageProvider({ children }) {
  const [mode, setModeState] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || 'he'; } catch { return 'he'; }
  });

  const setMode = (m) => {
    setModeState(m);
    try { localStorage.setItem(STORAGE_KEY, m); } catch { /* ignore */ }
  };

  const ui = mode === 'he' ? 'he' : 'en';
  const titleLang = mode === 'en' ? 'en' : 'he';
  const dir = mode === 'he' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = ui === 'he' ? 'he' : 'en';
  }, [dir, ui]);

  const value = useMemo(() => ({
    mode, setMode, ui, titleLang, dir,
    t: (key) => STRINGS[ui][key] ?? key,
    tr: (name) => translateTitle(titleLang, name),
    leafLabel: (leafType, idx) => leafLabel(titleLang, leafType, idx),
    rangeLabel: (s, e) => rangeLabel(titleLang, s, e),
  }), [mode, ui, titleLang, dir]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  return useContext(LanguageContext);
}
