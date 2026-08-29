import { createServerFn } from "@tanstack/react-start";

/**
 * Indicateurs macroéconomiques du Maroc.
 *
 * POURQUOI PAS TRADINGVIEW
 *
 * La page a d'abord incrusté cinq widgets `advanced-chart` sur des symboles
 * `ECONOMICS:MA…`. Ils refusent tous de s'afficher : « Symbole disponible
 * uniquement sur TradingView ». Les séries économiques ne font pas partie de ce
 * que les widgets gratuits ont le droit de servir, quelle que soit la
 * configuration. Ce n'était donc pas un réglage à corriger.
 *
 * CE QUI LES REMPLACE
 *
 * La Banque mondiale publie ces mêmes indicateurs en accès libre, sans clé ni
 * quota, et c'est une source citable. On récupère la série, on la trace avec
 * Recharts comme le reste du site, et le lien vers TradingView reste sur chaque
 * carte pour qui veut la version interactive et mensuelle.
 *
 * La contrepartie est la granularité : la Banque mondiale publie à l'année,
 * TradingView au mois ou au trimestre. Pour situer une économie derrière une
 * cote, l'annuel suffit et se lit même mieux.
 */

export type MacroPoint = { year: number; value: number };

export type MacroSeries = {
  /** Identifiant interne de l'indicateur, cf. `MACRO_INDICATORS`. */
  id: string;
  /** Du plus ancien au plus récent, valeurs manquantes retirées. */
  points: MacroPoint[];
};

/**
 * Les cinq indicateurs, et le code Banque mondiale correspondant.
 *
 * ⚠️ `policyRate` n'est PAS le taux directeur de Bank Al-Maghrib : la Banque
 * mondiale ne le publie pas. `FR.INR.RINR` est le taux d'intérêt réel, qui en
 * est le reflet une fois l'inflation déduite. L'interface le nomme donc pour ce
 * qu'il est, et renvoie vers TradingView pour le taux directeur lui-même.
 */
export const MACRO_INDICATORS = [
  { id: "inflation", code: "FP.CPI.TOTL.ZG", tv: "ECONOMICS-MAIRMM" },
  { id: "gdp", code: "NY.GDP.MKTP.KD.ZG", tv: "ECONOMICS-MAGDPQQ" },
  { id: "policyRate", code: "FR.INR.RINR", tv: "ECONOMICS-MAINTR" },
  { id: "unemployment", code: "SL.UEM.TOTL.ZS", tv: "ECONOMICS-MAUR" },
  { id: "employment", code: "SL.EMP.TOTL.SP.ZS", tv: "ECONOMICS-MAER" },
] as const;

export type MacroId = (typeof MACRO_INDICATORS)[number]["id"];

type WorldBankRow = { date?: unknown; value?: unknown };

/**
 * Extrait la série d'une réponse Banque mondiale.
 *
 * Exportée à part de la requête, comme `buildHistory` l'est dans
 * `lib/history.functions.ts` : la mise en forme se vérifie ainsi sans réseau,
 * et c'est la partie qui casse quand une source change de forme.
 *
 * La réponse est un couple `[métadonnées, lignes]`. Une requête sans résultat
 * ne renvoie que les métadonnées, et les années récentes arrivent souvent avec
 * `value: null` avant publication : tout ce qui n'est pas un nombre exploitable
 * est écarté plutôt que tracé à zéro, qui se lirait comme une mesure.
 */
export function parseWorldBank(json: unknown): MacroPoint[] {
  const rows: WorldBankRow[] =
    Array.isArray(json) && Array.isArray(json[1]) ? (json[1] as WorldBankRow[]) : [];

  const out: MacroPoint[] = [];
  for (const row of rows) {
    // ⚠️ Le tri se fait sur la valeur BRUTE, avant conversion : `Number(null)`
    // vaut zéro, donc une année non encore publiée passerait le filtre et se
    // tracerait comme une inflation nulle. C'est exactement le genre de zéro
    // que le reste du produit refuse d'afficher.
    if (typeof row.value !== "number" || !Number.isFinite(row.value)) continue;
    const year = Number(row.date);
    if (!Number.isInteger(year) || year < 1900) continue;
    out.push({ year, value: row.value });
  }
  return out.sort((a, b) => a.year - b.year);
}

/** Une série, ou une série vide si la source n'a rien à en dire. */
async function fetchSeries(code: string): Promise<MacroPoint[]> {
  const url =
    `https://api.worldbank.org/v2/country/MAR/indicator/${code}` +
    `?format=json&per_page=80&date=1990:2030`;

  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Banque mondiale : ${res.status}`);
  return parseWorldBank(await res.json());
}

/**
 * Les cinq séries, en une fois.
 *
 * Un indicateur qui échoue revient vide plutôt que d'emporter les autres : la
 * page affiche alors sa carte avec le lien vers la source et sans graphique,
 * ce qui reste plus honnête qu'un cadre vide sans explication.
 */
export const getMacroSeries = createServerFn({ method: "GET" }).handler(
  async (): Promise<MacroSeries[]> =>
    Promise.all(
      MACRO_INDICATORS.map(async (indicator) => ({
        id: indicator.id,
        points: await fetchSeries(indicator.code).catch(() => []),
      })),
    ),
);
