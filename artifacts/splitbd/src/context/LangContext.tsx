import { createContext, useContext, useState } from "react";
import { en, bn, type Translations } from "@/lib/i18n";

type Lang = "en" | "bn";

interface LangContextType {
  lang: Lang;
  toggleLang: () => void;
  T: Translations;
}

const LangContext = createContext<LangContextType>({ lang: "en", toggleLang: () => {}, T: en });

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    return (localStorage.getItem("hisab-lang") as Lang) || "en";
  });

  function toggleLang() {
    setLang((prev) => {
      const next = prev === "en" ? "bn" : "en";
      localStorage.setItem("hisab-lang", next);
      return next;
    });
  }

  const T = lang === "en" ? en : bn;

  return <LangContext.Provider value={{ lang, toggleLang, T }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
