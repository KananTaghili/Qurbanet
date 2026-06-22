'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
});

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('az');
  const [multiLanguageEnabled, setMultiLanguageEnabled] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const applySettings = useCallback((enabled) => {
    setMultiLanguageEnabled(enabled);
    if (!enabled) {
      setLangState('az');
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get('/app-config/settings');
      const enabled = res.data?.data?.multiLanguageEnabled !== false;
      applySettings(enabled);
      if (enabled) {
        const saved = localStorage.getItem(LANG_KEY);
        if (saved && LANGUAGES.find(l => l.code === saved)) {
          setLangState(saved);
        }
      }
    } catch (_) {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved && LANGUAGES.find(l => l.code === saved)) {
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
    if (!multiLanguageEnabled) return;
    if (!LANGUAGES.find(l => l.code === code)) return;
    localStorage.setItem(LANG_KEY, code);
    setLangState(code);
  };

  const dir = LANGUAGES.find(l => l.code === lang)?.dir || 'ltr';

  return (
    <LanguageContext.Provider value={{ lang, setLang, dir, multiLanguageEnabled, isReady }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
