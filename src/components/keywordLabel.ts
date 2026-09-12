import type { Key } from "@/lib/i18n";
import { companyNameForTicker, parseKeywordId, type ThemeId } from "@/lib/news-keywords";

/**
 * Libellés des mots-clés d'actualités, côté interface.
 *
 * Un id « c:<TICKER> » se libelle par la raison sociale de la table de la
 * cote (le ticker en repli si la société n'y figure pas) ; un id « t:<theme> »
 * par une clé du dictionnaire, traduite dans la langue de l'interface. Toute
 * autre forme est ignorée : la base revalide déjà les ids, ceci est la
 * deuxième ligne de défense contre une puce sans libellé.
 */

/** Clé i18n du libellé de chaque thème. */
export const THEME_KEY: Record<ThemeId, Key> = {
  marche: "newsfeed.kwMarche",
  resultats: "newsfeed.kwResultats",
  dividendes: "newsfeed.kwDividendes",
  ipo: "newsfeed.kwIpo",
  opa: "newsfeed.kwOpa",
  taux: "newsfeed.kwTaux",
  inflation: "newsfeed.kwInflation",
  petrole: "newsfeed.kwPetrole",
  change: "newsfeed.kwChange",
  banques: "newsfeed.kwBanques",
  assurances: "newsfeed.kwAssurances",
  immobilier: "newsfeed.kwImmobilier",
  mines: "newsfeed.kwMines",
  energie: "newsfeed.kwEnergie",
  tourisme: "newsfeed.kwTourisme",
  agriculture: "newsfeed.kwAgriculture",
  regulation: "newsfeed.kwRegulation",
  international: "newsfeed.kwInternational",
};

/**
 * Le libellé d'un mot-clé pour l'interface : raison sociale pour une société
 * cotée, clé i18n pour un thème, null si l'id est incompréhensible (la puce
 * correspondante ne s'affiche tout simplement pas).
 */
export function keywordLabel(
  id: string,
): { kind: "company"; text: string } | { kind: "theme"; key: Key } | null {
  const parsed = parseKeywordId(id);
  if (!parsed) return null;
  if (parsed.kind === "company") {
    return { kind: "company", text: companyNameForTicker(parsed.ticker) ?? parsed.ticker };
  }
  return { kind: "theme", key: THEME_KEY[parsed.theme] };
}
