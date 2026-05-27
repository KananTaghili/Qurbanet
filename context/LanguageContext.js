'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const LANG_KEY = 'qurbanet_lang';

export const LANGUAGES = [
  { code: 'az', label: 'AZ', name: 'Azərbaycan', dir: 'ltr' },
  { code: 'ru', label: 'RU', name: 'Русский',     dir: 'ltr' },
  { code: 'en', label: 'EN', name: 'English',      dir: 'ltr' },
];

const LanguageContext = createContext({
  lang: 'az',
  setLang: () => {},
  dir: 'ltr',
  multiLanguageEnabled: true,
});

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('az');
  const [multiLanguageEnabled, setMultiLanguageEnabled] = useState(false);

  useEffect(() => {
    api.get('/app-config/settings')
      .then((res) => {
        const enabled = res.data?.data?.multiLanguageEnabled !== false;
        setMultiLanguageEnabled(enabled);
        if (!enabled) {
          setLangState('az');
          return;
        }
        const saved = localStorage.getItem(LANG_KEY);
        if (saved && LANGUAGES.find(l => l.code === saved)) {
          setLangState(saved);
        }
      })
      .catch(() => {
        const saved = localStorage.getItem(LANG_KEY);
        if (saved && LANGUAGES.find(l => l.code === saved)) {
          setLangState(saved);
        }
      });
  }, []);

  useEffect(() => {
    const entry = LANGUAGES.find(l => l.code === lang);
    document.documentElement.dir  = entry?.dir  || 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (code) => {
    if (!multiLanguageEnabled) return;
    if (!LANGUAGES.find(l => l.code === code)) return;
    localStorage.setItem(LANG_KEY, code);
    setLangState(code);
  };

  const dir = LANGUAGES.find(l => l.code === lang)?.dir || 'ltr';

  return (
    <LanguageContext.Provider value={{ lang, setLang, dir, multiLanguageEnabled }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
