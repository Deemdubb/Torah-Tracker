import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { t as tt, displayName, leafLabel, rangeLabel, dirOf, uiLang, titleLang } from './i18n';

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
  const dir = dirOf(mode);
  const ui = uiLang(mode);

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = ui;
  }, [dir, ui]);

  const value = useMemo(() => ({
    mode, setMode, ui, titleLang: titleLang(mode), dir,
    t: (key) => tt(mode, key),
    name: (row) => displayName(mode, row),
    leafLabel: (leafType, n) => leafLabel(mode, leafType, n),
    rangeLabel: (s, e) => rangeLabel(mode, s, e),
  }), [mode, ui, dir]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  return useContext(LanguageContext);
}
