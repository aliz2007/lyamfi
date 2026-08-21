import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { en } from "@/lib/locales/en";
import { fr } from "@/lib/locales/fr";
import {
  I18nContext,
  detectLang,
  interpolate,
  LANG_STORAGE_KEY,
  type Ctx,
  type Dict,
  type Lang,
} from "@/lib/i18n";

const DICTS: Record<Lang, Dict> = { fr, en };

/**
 * Fournit la langue choisie à toute l'application.
 *
 * Séparé de `@/lib/i18n` parce que le rafraîchissement rapide de Vite ne suit
 * un fichier que s'il n'exporte que des composants : les hooks et les types
 * vivent donc à côté, dans un module sans JSX.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  // On démarre en français côté serveur ET au premier rendu client : lire
  // localStorage pendant le rendu initial produirait un HTML différent de
  // celui du serveur, et React signalerait une erreur d'hydratation.
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    const initial = detectLang();
    if (initial !== "fr") setLangState(initial);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // Stockage refusé (navigation privée) : le choix reste valable pour la
      // session en cours, il ne survivra simplement pas au rechargement.
    }
  }, []);

  const value = useMemo<Ctx>(() => {
    const dict = DICTS[lang];
    return {
      lang,
      setLang,
      locale: lang === "en" ? "en-GB" : "fr-MA",
      // Repli sur le français si une clé manque à l'exécution : mieux vaut un
      // libellé dans l'autre langue qu'une clé brute affichée à l'écran.
      t: (key, vars) => interpolate(dict[key] ?? fr[key] ?? String(key), vars),
    };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
