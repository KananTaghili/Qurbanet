'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { BASE_URL } from '../lib/api';

const LANG_KEY = 'qurbanet_lang';

const ALL_LANGUAGES = [
  { code: 'az', label: 'AZ', name: 'Azərbaycan', dir: 'ltr' },
  { code: 'ru', label: 'RU', name: 'Русский',     dir: 'ltr' },
  { code: 'en', label: 'EN', name: 'English',      dir: 'ltr' },
];

export { ALL_LANGUAGES as LANGUAGES };

const LanguageContext = createContext({
  lang: 'az',
  setLang: () => {},
  dir: 'ltr',
  multiLanguageEnabled: true,
  enabledLanguages: ['az', 'en', 'ru'],
  availableLanguages: ALL_LANGUAGES,
});

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('az');
  const [enabledLanguages, setEnabledLanguages] = useState(['az', 'en', 'ru']);
  const [multiLanguageEnabled, setMultiLanguageEnabled] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const applySettings = useCallback((codes) => {
    const valid = codes?.length > 0 ? codes : ['az'];
    setEnabledLanguages(valid);
    setMultiLanguageEnabled(valid.length > 1);
    if (!valid.includes('az')) valid.unshift('az');
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get('/app-config/settings');
      const codes = res.data?.data?.enabledLanguages || ['az', 'en', 'ru'];
      applySettings(codes);
      const saved = localStorage.getItem(LANG_KEY);
      if (saved && codes.includes(saved)) {
        setLangState(saved);
      } else {
        setLangState('az');
      }
    } catch (_) {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved && ALL_LANGUAGES.find(l => l.code === saved)) {
        setLangState(saved);
      }
    } finally {
      setIsReady(true);
    }
  }, [applySettings]);

  // Initial fetch
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Re-fetch when tab regains focus (covers admin→web switching)
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') fetchSettings(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchSettings]);

  // Real-time: listen for app_settings_updated socket event (no auth needed)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let sock = null;
    const SOCKET_URL = BASE_URL.replace(/\/api$/, '');
    import('socket.io-client').then(({ io }) => {
      sock = io(SOCKET_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 3000,
      });
      sock.on('app_settings_updated', () => {
        fetchSettings();
      });
    }).catch(() => {});
    return () => {
      if (sock) sock.disconnect();
    };
  }, [fetchSettings]);

  useEffect(() => {
    const entry = LANGUAGES.find(l => l.code === lang);
    document.documentElement.dir  = entry?.dir  || 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (code) => {
    if (!enabledLanguages.includes(code)) return;
    localStorage.setItem(LANG_KEY, code);
    setLangState(code);
  };

  const dir = ALL_LANGUAGES.find(l => l.code === lang)?.dir || 'ltr';
  const availableLanguages = ALL_LANGUAGES.filter(l => enabledLanguages.includes(l.code));

  return (
    <LanguageContext.Provider value={{ lang, setLang, dir, multiLanguageEnabled, enabledLanguages, availableLanguages, isReady }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
