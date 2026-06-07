import { createContext, useContext, useState, ReactNode } from "react";
import { en, Translations } from "./i18n/en";
import { es } from "./i18n/es";

export type Lang = "en" | "es";

const STORAGE_KEY = "anchored_lang";
const dict: Record<Lang, Translations> = { en, es };

interface LangContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LangContext = createContext<LangContextType>({ lang: "en", setLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const stored = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
  const initial: Lang = stored === "es" ? "es" : "en";
  const [lang, setLangState] = useState<Lang>(initial);

  const setLang = (next: Lang) => {
    localStorage.setItem(STORAGE_KEY, next);
    setLangState(next);
  };

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

export function useT(): Translations {
  const { lang } = useLang();
  return dict[lang];
}
