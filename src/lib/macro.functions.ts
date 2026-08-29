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

export type MacroPoint = {
  year: number;
  value: number;
  /** Abscisse à afficher quand l'année ne suffit pas, ex. « 2022-09 ». */
  label?: string;
};

export type MacroSeries = {
  /** Identifiant interne de l'indicateur, cf. `MACRO_INDICATORS`. */
  id: string;
  /** Du plus ancien au plus récent, valeurs manquantes retirées. */
  points: MacroPoint[];
  /**
   * D'où vient la série. `manual` signale un repli sur la table écrite à la
   * main : l'interface avertit alors, au lieu de laisser croire à une donnée
   * tenue à jour toute seule.
   */
  source: "worldbank" | "imf" | "manual";
};

/**
 * Les cinq indicateurs, dans l'ordre d'affichage.
 *
 * `code` est le code Banque mondiale, ou `null` pour la série tenue à la main.
 */
export const MACRO_INDICATORS = [
  { id: "inflation", code: "FP.CPI.TOTL.ZG", tv: "ECONOMICS-MAIRMM" },
  { id: "gdp", code: "NY.GDP.MKTP.KD.ZG", tv: "ECONOMICS-MAGDPQQ" },
  { id: "policyRate", code: null, tv: "ECONOMICS-MAINTR" },
  { id: "unemployment", code: "SL.UEM.TOTL.ZS", tv: "ECONOMICS-MAUR" },
  { id: "employment", code: "SL.EMP.TOTL.SP.ZS", tv: "ECONOMICS-MAER" },
] as const;

/**
 * Taux directeur de Bank Al-Maghrib : FILET DE SÉCURITÉ, pas la source.
 *
 * La source est le FMI (voir `fetchPolicyRate`), qui publie le taux directeur
 * marocain au mois et se met donc à jour tout seul. Cette table ne sert que si
 * le FMI est injoignable ou cesse de publier la série : la carte affiche alors
 * quelque chose plutôt que rien, en disant clairement qu'elle est tenue à la
 * main et jusqu'à quand.
 *
 * La Banque mondiale, elle, ne publie pas ce taux du tout : `FR.INR.RINR` est
 * le taux d'intérêt RÉEL, une autre grandeur, et revient vide pour le Maroc.
 *
 * ⚠️ À ne mettre à jour que si l'avertissement « série tenue à la main »
 * apparaît sur la carte en production. Tant qu'il n'apparaît pas, le FMI
 * répond et cette liste n'est jamais lue.
 */
export const POLICY_RATE: { date: string; value: number }[] = [
  { date: "2012-03", value: 3.0 },
  { date: "2014-09", value: 2.75 },
  { date: "2014-12", value: 2.5 },
  { date: "2016-03", value: 2.25 },
  { date: "2020-03", value: 2.0 },
  { date: "2020-06", value: 1.5 },
  { date: "2022-09", value: 2.0 },
  { date: "2022-12", value: 2.5 },
  { date: "2023-03", value: 3.0 },
  { date: "2024-06", value: 2.75 },
  { date: "2024-12", value: 2.5 },
  { date: "2025-03", value: 2.25 },
];

/** Jusqu'où le filet ci-dessus a été vérifié. Affiché en cas de repli. */
export const POLICY_RATE_CHECKED = "2025-03";

/**
 * Ne garde qu'un point par changement de valeur.
 *
 * Le FMI publie le taux directeur tous les mois, donc cent quatre-vingts
 * points dont l'immense majorité répète le précédent. Un taux directeur se lit
 * par ses décisions : on ne conserve que les mois où il bouge, plus le dernier
 * connu pour que la courbe aille jusqu'à aujourd'hui.
 */
export function keepChanges(points: MacroPoint[]): MacroPoint[] {
  if (points.length === 0) return [];

  // Chaque valeur qui diffère de la précédente retenue est une décision.
  const out: MacroPoint[] = [points[0]!];
  for (const p of points.slice(1)) {
    if (p.value !== out[out.length - 1]!.value) out.push(p);
  }

  // Le dernier mois publié ferme la courbe, même s'il ne change rien : sans
  // lui, le tracé s'arrêterait à la dernière décision et donnerait à croire
  // que la série n'est plus tenue.
  const last = points[points.length - 1]!;
  if (out[out.length - 1] !== last) out.push(last);
  return out;
}

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

/** La suite de décisions, mise à la forme commune des autres séries. */
export function policyRateSeries(): MacroPoint[] {
  return POLICY_RATE.map((d) => ({
    year: Number(d.date.slice(0, 4)),
    value: d.value,
    label: d.date,
  }));
}

/**
 * Le taux directeur, tel que le FMI le publie.
 *
 * `IFS` est la base des Statistiques financières internationales ; la clé se lit
 * fréquence.pays.indicateur, soit mensuel, Maroc, taux directeur. Service libre,
 * sans clé ni quota.
 *
 * La réponse est du SDMX enveloppé en JSON, dont la forme varie : `Series` peut
 * être un objet ou un tableau, `Obs` aussi, et les valeurs arrivent en chaînes.
 * D'où un extracteur défensif, testé à part.
 */
export function parseImfSeries(json: unknown): MacroPoint[] {
  const asRecord = (v: unknown): Record<string, unknown> =>
    typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {};

  const dataset = asRecord(asRecord(asRecord(json)["CompactData"])["DataSet"]);
  const rawSeries = dataset["Series"];
  const series = Array.isArray(rawSeries) ? rawSeries : [rawSeries];

  const out: MacroPoint[] = [];
  for (const one of series) {
    const rawObs = asRecord(one)["Obs"];
    for (const obs of Array.isArray(rawObs) ? rawObs : [rawObs]) {
      const row = asRecord(obs);
      const period = String(row["@TIME_PERIOD"] ?? "");
      // La valeur arrive en chaîne : on refuse le vide AVANT de convertir, sans
      // quoi `Number("")` vaudrait zéro et se tracerait comme un taux nul.
      const raw = row["@OBS_VALUE"];
      if (raw === null || raw === undefined || String(raw).trim() === "") continue;
      const value = Number(raw);
      const year = Number(period.slice(0, 4));
      if (!Number.isFinite(value) || !Number.isInteger(year) || year < 1900) continue;
      out.push({ year, value, label: period });
    }
  }
  return out.sort((a, b) => (a.label ?? "").localeCompare(b.label ?? ""));
}

async function fetchPolicyRate(): Promise<MacroPoint[]> {
  const url =
    "https://dataservices.imf.org/REST/SDMX_JSON.svc/CompactData/IFS/M.MA.FPOLM_PA" +
    "?startPeriod=2010";
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`FMI : ${res.status}`);
  return keepChanges(parseImfSeries(await res.json()));
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
      MACRO_INDICATORS.map(async (indicator): Promise<MacroSeries> => {
        if (indicator.code) {
          return {
            id: indicator.id,
            points: await fetchSeries(indicator.code).catch(() => []),
            source: "worldbank",
          };
        }
        // Le FMI d'abord ; la table écrite à la main seulement s'il ne répond
        // pas ou ne publie plus rien d'exploitable.
        const imf = await fetchPolicyRate().catch(() => []);
        return imf.length >= 2
          ? { id: indicator.id, points: imf, source: "imf" }
          : { id: indicator.id, points: policyRateSeries(), source: "manual" };
      }),
    ),
);
