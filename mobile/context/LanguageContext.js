import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../lib/api";

// Mobile port of web/context/LanguageContext.js — same idea (fetch which
// languages are enabled from the backend, persist the user's pick, expose
// `lang`/`setLang`/`t`-ready state via context) adapted for React Native:
// AsyncStorage instead of localStorage, an AppState listener instead of the
// DOM `visibilitychange` event, no socket.io-client dependency in this app.
const LANG_KEY = "qurbanet_lang";

export const LANGUAGES = [
  { code: "az", label: "AZ", name: "Azərbaycan" },
  { code: "ru", label: "RU", name: "Русский" },
  { code: "en", label: "EN", name: "English" },
];

const DEFAULT_ENABLED = ["az", "en", "ru"];

const LanguageContext = createContext({
  lang: "az",
  setLang: () => {},
  multiLanguageEnabled: false,
  enabledLanguages: DEFAULT_ENABLED,
  availableLanguages: LANGUAGES,
  isReady: false,
});

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState("az");
  const [enabledLanguages, setEnabledLanguages] = useState(DEFAULT_ENABLED);
  const [multiLanguageEnabled, setMultiLanguageEnabled] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const langRef = useRef(lang);
  langRef.current = lang;

  const applySettings = useCallback((codes) => {
    const valid = Array.isArray(codes) && codes.length > 0 ? codes : ["az"];
    setEnabledLanguages(valid);
    setMultiLanguageEnabled(valid.length > 1);
    return valid;
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get("/app-config/settings");
      const codes = res.data?.data?.enabledLanguages;
      const validCodes = Array.isArray(codes) && codes.length > 0 ? codes : DEFAULT_ENABLED;
      applySettings(validCodes);
      const saved = await AsyncStorage.getItem(LANG_KEY);
      if (saved && validCodes.includes(saved)) {
        setLangState(saved);
      } else if (!validCodes.includes(langRef.current)) {
        setLangState("az");
      }
    } catch {
      // Backend unreachable — keep whatever was already persisted locally.
      try {
        const saved = await AsyncStorage.getItem(LANG_KEY);
        if (saved && LANGUAGES.some((l) => l.code === saved)) setLangState(saved);
      } catch {
        // ignore
      }
    } finally {
      setIsReady(true);
    }
  }, [applySettings]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Re-fetch when the app returns to the foreground — RN equivalent of the
  // web version's `visibilitychange` listener, so an admin-side language
  // toggle is picked up without forcing a full app restart.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") fetchSettings();
    });
    return () => sub.remove();
  }, [fetchSettings]);

  const setLang = useCallback(
    (code) => {
      if (!enabledLanguages.includes(code)) return;
      setLangState(code);
      AsyncStorage.setItem(LANG_KEY, code).catch(() => {});
    },
    [enabledLanguages],
  );

  const availableLanguages = LANGUAGES.filter((l) => enabledLanguages.includes(l.code));

  return (
    <LanguageContext.Provider
      value={{ lang, setLang, multiLanguageEnabled, enabledLanguages, availableLanguages, isReady }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
