'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import api, { BASE_URL } from '../lib/api';

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
  enabledLanguages: ['az', 'en', 'ru'],
  availableLanguages: LANGUAGES,
});

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('az');
  const [enabledLanguages, setEnabledLanguages] = useState(['az', 'en', 'ru']);
  const [multiLanguageEnabled, setMultiLanguageEnabled] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const applySettings = useCallback((codes) => {
    const valid = Array.isArray(codes) && codes.length > 0 ? codes : ['az'];
    setEnabledLanguages(valid);
    setMultiLanguageEnabled(valid.length > 1);
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get('/app-config/settings');
      const codes = res.data?.data?.enabledLanguages;
      const validCodes = Array.isArray(codes) && codes.length > 0 ? codes : ['az', 'en', 'ru'];
      applySettings(validCodes);
      const saved = localStorage.getItem(LANG_KEY);
      setLangState(saved && validCodes.includes(saved) ? saved : 'az');
    } catch (_) {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved && LANGUAGES.find(l => l.code === saved)) setLangState(saved);
    } finally {
      setIsReady(true);
    }
  }, [applySettings]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  // Re-fetch when tab regains focus
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') fetchSettings(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchSettings]);

  // Real-time socket listener
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SOCKET_URL = BASE_URL.replace(/\/api$/, '');
    let sock;
    try {
      sock = io(SOCKET_URL, { transports: ['websocket'], reconnection: true, reconnectionAttempts: 5 });
      sock.on('app_settings_updated', fetchSettings);
    } catch (_) {}
    return () => { try { sock?.disconnect(); } catch (_) {} };
  }, [fetchSettings]);

  useEffect(() => {
    const entry = LANGUAGES.find(l => l.code === lang);
    document.documentElement.dir  = entry?.dir || 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (code) => {
    if (!enabledLanguages.includes(code)) return;
    localStorage.setItem(LANG_KEY, code);
    setLangState(code);
  };

  const dir = LANGUAGES.find(l => l.code === lang)?.dir || 'ltr';
  const availableLanguages = LANGUAGES.filter(l => enabledLanguages.includes(l.code));

  return (
    <LanguageContext.Provider value={{ lang, setLang, dir, multiLanguageEnabled, enabledLanguages, availableLanguages, isReady }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
