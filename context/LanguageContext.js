'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const LANG_KEY = 'qurbanet_lang';

export const LANGUAGES = [
  { code: 'az', label: 'AZ', name: 'Azərbaycan', dir: 'ltr' },
  { code: 'ru', label: 'RU', name: 'Русский',     dir: 'ltr' },
  { code: 'en', label: 'EN', name: 'English',      dir: 'ltr' },
];

const LanguageContext = createContext({ lang: 'az', setLang: () => {}, dir: 'ltr' });

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('az');

  useEffect(() => {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && LANGUAGES.find(l => l.code === saved)) {
      setLangState(saved);
    }
  }, []);

  useEffect(() => {
    const entry = LANGUAGES.find(l => l.code === lang);
    document.documentElement.dir  = entry?.dir  || 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (code) => {
    if (!LANGUAGES.find(l => l.code === code)) return;
    localStorage.setItem(LANG_KEY, code);
    setLangState(code);
  };

  const dir = LANGUAGES.find(l => l.code === lang)?.dir || 'ltr';

  return (
    <LanguageContext.Provider value={{ lang, setLang, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
