import { createContext, useContext, useEffect } from "react";
import { fr } from "@/lib/locales/fr";
import { en } from "@/lib/locales/en";

/**
 * Bilingue français / anglais.
 *
 * Le français est la langue source : `fr` définit le type du dictionnaire et
 * `en` doit le satisfaire, donc une clé ajoutée d'un côté et oubliée de
 * l'autre casse la compilation plutôt que d'afficher une clé brute à l'écran.
 *
 * Le choix est conservé dans localStorage et appliqué à <html lang> pour que
 * la césure, la correction orthographique et les lecteurs d'écran suivent.
 */

export type Lang = "fr" | "en";
export type Key = keyof typeof fr;
/** Les valeurs sont élargies à `string` : `en` n'a pas à répéter les libellés français. */
export type Dict = Record<Key, string>;

export const LANGS: { id: Lang; label: string; short: string }[] = [
  { id: "fr", label: "Français", short: "FR" },
  { id: "en", label: "English", short: "EN" },
];

export const LANG_STORAGE_KEY = "lyamfi.lang";

/** Langue par défaut : français, sauf navigateur explicitement anglophone. */
export function detectLang(): Lang {
  if (typeof window === "undefined") return "fr";
  try {
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === "fr" || saved === "en") return saved;
  } catch {
    // Navigation privée ou stockage bloqué : on retombe sur la détection.
  }
  const nav = window.navigator?.language?.toLowerCase() ?? "";
  return nav.startsWith("en") ? "en" : "fr";
}

export type Vars = Record<string, string | number>;

/** Remplace les jetons {nom} par leur valeur. */
export function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in vars ? String(vars[name]) : whole,
  );
}

export type Translate = (key: Key, vars?: Vars) => string;

export type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: Translate; locale: string };

export const I18nContext = createContext<Ctx | null>(null);

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n doit être utilisé dans <LanguageProvider>");
  return ctx;
}

/** Raccourci quand seule la fonction de traduction est nécessaire. */
export function useT(): Translate {
  return useI18n().t;
}

/**
 * Titre de l'onglet, synchronisé avec la langue choisie.
 *
 * Les métadonnées déclarées dans `head()` sont évaluées hors de React et ne
 * peuvent donc pas suivre un état : elles restent en français, ce qui convient
 * au référencement (le public visé est francophone). Ce hook prend le relais
 * côté client pour l'onglet réellement affiché.
 */
export function usePageTitle(key: Key, vars?: Vars): void {
  const { t, lang } = useI18n();
  const title = t(key, vars);
  useEffect(() => {
    if (typeof document !== "undefined") document.title = title;
  }, [title, lang]);
}
