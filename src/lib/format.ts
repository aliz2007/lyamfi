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

export const mad = (v: number, digits = 2, locale: Locale = DEFAULT) =>
  locale === "en-GB"
    ? `MAD ${new Intl.NumberFormat(locale, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }).format(v)}`
    : `${new Intl.NumberFormat(locale, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }).format(v)} MAD`;

export const num = (v: number | null | undefined, digits = 2, locale: Locale = DEFAULT) =>
  v === null || v === undefined || !Number.isFinite(v)
    ? EMPTY
    : new Intl.NumberFormat(locale, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }).format(v);

export const pct = (v: number, digits = 2, locale: Locale = DEFAULT) =>
  `${v > 0 ? "+" : ""}${num(v, digits, locale)} %`;

export const compact = (v: number, locale: Locale = DEFAULT) => {
  const bn = locale === "en-GB" ? "bn MAD" : "Md MAD";
  if (v >= 1e9) return `${num(v / 1e9, 1, locale)} ${bn}`;
  if (v >= 1e6) return `${num(v / 1e6, 0, locale)} M MAD`;
  return num(v, 0, locale);
};

/** Cours affiché sans forcer de décimales, comme le fait la cote. */
export const price = (v: number, locale: Locale = DEFAULT) =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(v);

export const shortDate = (v: string | null | undefined, locale: Locale = DEFAULT) =>
  v
    ? new Date(v).toLocaleDateString(locale, {
        day: "2-digit",
        month: "short",
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
  mad: (v: number, digits?: number) => string;
  num: (v: number | null | undefined, digits?: number) => string;
  pct: (v: number, digits?: number) => string;
  compact: (v: number) => string;
  price: (v: number) => string;
  shortDate: (v: string | null | undefined) => string;
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
      longDate: (v) => longDate(v, l),
      dateTime: (v) => dateTime(v, l),
    }),
    [l],
  );
}
