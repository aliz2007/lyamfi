import { createServerFn } from "@tanstack/react-start";

export type HistoryPoint = { date: string; close: number };
export type HistoryMap = Record<string, HistoryPoint[]>;

/**
 * Historique de cours, repris de TradingView.
 *
 * TradingView ne publie pas d'API de barres journalières en HTTP simple ; en
 * revanche son screener expose, pour chaque valeur, la performance sur des
 * fenêtres normalisées. À partir du dernier cours on remonte donc le cours
 * passé : cours(t) = clôture / (1 + perf(t) / 100). Les points obtenus sont de
 * vrais cours TradingView, pas une reconstruction inventée.
 *
 * Tout est récupéré en UN appel pour les 81 valeurs : c'est le même point
 * d'entrée, avec le même format de requête, que les cotations en direct qui
 * fonctionnent déjà en production.
 */

const SCANNER = "https://scanner.tradingview.com/morocco/scan";

/**
 * Fenêtres du screener, de la plus ancienne à la plus récente.
 * `days` sert à dater le point ; `ytd` est traité à part, sa date étant le
 * 1er janvier de l'année en cours.
 */
const WINDOWS = [
  { column: "Perf.Y", days: 365 },
  { column: "Perf.6M", days: 182 },
  { column: "Perf.3M", days: 91 },
  { column: "Perf.YTD", days: null },
  { column: "Perf.1M", days: 30 },
  { column: "Perf.W", days: 7 },
] as const;

const COLUMNS = ["name", "close", ...WINDOWS.map((w) => w.column)];

const iso = (d: Date) => d.toISOString().slice(0, 10);

function dateFor(days: number | null, now: Date): string {
  if (days === null) return `${now.getUTCFullYear()}-01-01`;
  return iso(new Date(now.getTime() - days * 86_400_000));
}

/**
 * Transformation pure de la réponse du screener en séries datées.
 * Isolée du fetch pour être testable sans réseau.
 */
export function buildHistory(rows: { d: (string | number | null)[] }[], now: Date): HistoryMap {
  const today = iso(now);
  const out: HistoryMap = {};

  for (const row of rows) {
    const ticker = String(row.d[0] ?? "").toUpperCase();
    const close = Number(row.d[1] ?? 0);
    if (!ticker || !(close > 0)) continue;

    const points: HistoryPoint[] = [];
    WINDOWS.forEach((w, i) => {
      // d[0] et d[1] sont name et close : les performances suivent.
      const perf = row.d[i + 2];
      if (perf === null || perf === undefined) return;
      const pct = Number(perf);
      if (!Number.isFinite(pct) || pct <= -100) return;
      const past = close / (1 + pct / 100);
      if (!Number.isFinite(past) || past <= 0) return;
      points.push({ date: dateFor(w.days, now), close: Number(past.toFixed(2)) });
    });

    points.push({ date: today, close });

    // Le point YTD peut tomber après le point 3 mois selon la date du jour, et
    // deux fenêtres peuvent viser le même jour début janvier : la dernière
    // écriture gagne, puis on trie par date.
    const byDate = new Map(points.map((p) => [p.date, p]));
    const series = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
    if (series.length >= 2) out[ticker] = series;
  }

  return out;
}

export const getPriceHistory = createServerFn({ method: "GET" }).handler(
  async (): Promise<HistoryMap> => {
    const res = await fetch(SCANNER, {
      method: "POST",
      headers: { "content-type": "text/plain;charset=UTF-8" },
      body: JSON.stringify({
        filter: [{ left: "exchange", operation: "equal", right: "CSEMA" }],
        columns: COLUMNS,
        range: [0, 300],
        sort: { sortBy: "market_cap_basic", sortOrder: "desc" },
      }),
    });
    if (!res.ok) throw new Error("Historique indisponible");

    const json = (await res.json()) as { data?: { d: (string | number | null)[] }[] };
    return buildHistory(json.data ?? [], new Date());
  },
);
