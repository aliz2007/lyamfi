import { useMemo } from "react";
import { useI18n } from "@/lib/i18n";

/**
 * Formatage des nombres, des montants et des dates.
 *
 * Le séparateur change avec la langue (1 234,50 en français, 1,234.50 en
 * anglais), donc rien n'est figé sur « fr-MA » : les composants passent par
 * `useFormat()`, qui lie le locale courant une fois pour toutes.
 *
 * Les fonctions nues restent exportées pour les rares appels hors composant ;
 * elles prennent le français par défaut.
 */

export type Locale = "fr-MA" | "en-GB";
const DEFAULT: Locale = "fr-MA";

/** Marqueur de valeur absente. Pas de tiret : « N/A » se lit dans les deux langues. */
export const EMPTY = "N/A";

/**
 * Locale utilisée pour les NOMBRES, distincte de celle des dates.
 *
 * ICU fait grouper les milliers par un point en fr-MA : 123 457 s'écrit
 * « 123.457 ». C'est la convention marocaine, mais dans une colonne de
 * montants sans décimales elle se lit « 123 virgule 457 », soit mille fois
 * moins. L'espace de fr-FR lève l'ambiguïté sans changer la virgule décimale.
 */
const NUMBER_LOCALE: Record<Locale, string> = {
  "fr-MA": "fr-FR",
  "en-GB": "en-GB",
};

/**
 * Un nombre qui n'en est pas un ne doit jamais atteindre l'écran.
 *
 * `Intl.NumberFormat.format(NaN)` rend la chaîne « NaN », et un champ absent
 * (schéma plus récent que le client déployé, par exemple) devient alors
 * « NaN MAD » dans un tableau de montants. Mieux vaut afficher « N/A ».
 */
const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

const format = (v: number, digits: number, locale: Locale, minDigits = digits) =>
  new Intl.NumberFormat(NUMBER_LOCALE[locale], {
    minimumFractionDigits: minDigits,
    maximumFractionDigits: digits,
  }).format(v);

export const num = (v: number | null | undefined, digits = 2, locale: Locale = DEFAULT) =>
  finite(v) ? format(v, digits, locale) : EMPTY;

export const mad = (v: number | null | undefined, digits = 2, locale: Locale = DEFAULT) => {
  if (!finite(v)) return EMPTY;
  const n = format(v, digits, locale);
  return locale === "en-GB" ? `MAD ${n}` : `${n} MAD`;
};

export const pct = (v: number | null | undefined, digits = 2, locale: Locale = DEFAULT) =>
  finite(v) ? `${v > 0 ? "+" : ""}${format(v, digits, locale)} %` : EMPTY;

export const compact = (v: number | null | undefined, locale: Locale = DEFAULT) => {
  if (!finite(v)) return EMPTY;
  const bn = locale === "en-GB" ? "bn MAD" : "Md MAD";
  if (v >= 1e9) return `${format(v / 1e9, 1, locale)} ${bn}`;
  if (v >= 1e6) return `${format(v / 1e6, 0, locale)} M MAD`;
  return format(v, 0, locale);
};

/** Cours affiché sans forcer de décimales, comme le fait la cote. */
export const price = (v: number | null | undefined, locale: Locale = DEFAULT) =>
  finite(v) ? format(v, 2, locale, 0) : EMPTY;

export const shortDate = (v: string | null | undefined, locale: Locale = DEFAULT) =>
  v
    ? new Date(v).toLocaleDateString(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : EMPTY;

/**
 * Date tout en chiffres, jour d'abord : « 27/08/2026 ».
 *
 * Les deux locales du produit placent le jour en tête, donc le même appel
 * convient aux deux : c'est le format demandé pour la date de publication des
 * actualités, plus compact que le mois abrégé de `shortDate`.
 */
export const numericDate = (v: string | null | undefined, locale: Locale = DEFAULT) =>
  v
    ? new Date(v).toLocaleDateString(locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : EMPTY;

export const longDate = (v: string | null | undefined, locale: Locale = DEFAULT) =>
  v
    ? new Date(v).toLocaleDateString(locale, { day: "2-digit", month: "long", year: "numeric" })
    : EMPTY;

export const dateTime = (v: string | null | undefined, locale: Locale = DEFAULT) =>
  v
    ? new Date(v).toLocaleString(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : EMPTY;

export type Formatter = {
  locale: Locale;
  mad: (v: number | null | undefined, digits?: number) => string;
  num: (v: number | null | undefined, digits?: number) => string;
  pct: (v: number | null | undefined, digits?: number) => string;
  compact: (v: number | null | undefined) => string;
  price: (v: number | null | undefined) => string;
  shortDate: (v: string | null | undefined) => string;
  numericDate: (v: string | null | undefined) => string;
  longDate: (v: string | null | undefined) => string;
  dateTime: (v: string | null | undefined) => string;
};

/** Formateurs liés à la langue affichée. */
export function useFormat(): Formatter {
  const { locale } = useI18n();
  const l = (locale === "en-GB" ? "en-GB" : "fr-MA") as Locale;
  return useMemo<Formatter>(
    () => ({
      locale: l,
      mad: (v, d = 2) => mad(v, d, l),
      num: (v, d = 2) => num(v, d, l),
      pct: (v, d = 2) => pct(v, d, l),
      compact: (v) => compact(v, l),
      price: (v) => price(v, l),
      shortDate: (v) => shortDate(v, l),
      numericDate: (v) => numericDate(v, l),
      longDate: (v) => longDate(v, l),
      dateTime: (v) => dateTime(v, l),
    }),
    [l],
  );
}
