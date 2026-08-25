import { supabase } from "@/integrations/supabase/client";
import type { Key } from "@/lib/i18n";

/**
 * Fondamentaux des valeurs cotées.
 *
 * La table `stock_metrics` ne contient que ce qui ne dépend pas du cours :
 * nombre d'actions, BPA, DPA, capitaux propres par action, chiffre d'affaires
 * par action, FCF par action, et les ratios de rentabilité de l'exercice clos.
 * Tout ce qui se calcule à partir du cours (capitalisation, PER, rendement,
 * P/B, P/S, P/FCF) est dérivé à l'affichage, sinon ce serait périmé dès la
 * séance suivante.
 *
 * ⚠️ Règle stricte : la base est volontairement incomplète. Un indicateur qui
 * ne peut pas être calculé n'est pas affiché DU TOUT, pas même sous forme de
 * « N/A ». Une carte absente se lit comme « non publié » ; une carte affichant
 * zéro se lirait comme une mesure réelle.
 */

export type StockMetrics = {
  ticker: string;
  company: string;
  shares: number | null;
  eps_26: number | null;
  eps_27e: number | null;
  dps_26: number | null;
  dps_27e: number | null;
  book_value_25: number | null;
  sales_per_share_25: number | null;
  fcf_per_share_25: number | null;
  roe_25: number | null;
  roa_25: number | null;
  payout_25: number | null;
  net_margin_25: number | null;
  ebitda_margin_25: number | null;
};

const COLUMNS =
  "ticker, company, shares, eps_26, eps_27e, dps_26, dps_27e, book_value_25, " +
  "sales_per_share_25, fcf_per_share_25, roe_25, roa_25, payout_25, net_margin_25, ebitda_margin_25";

type MetricsTable = {
  select: (cols: string) => Promise<{
    data: StockMetrics[] | null;
    error: { message: string } | null;
  }>;
};

/** Un nombre exploitable : ni null, ni NaN, ni ±Infinity. */
const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** PostgREST renvoie les `numeric` en chaîne : on normalise à la lecture. */
const toNumber = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export const metricsQuery = {
  queryKey: ["stock-metrics"],
  queryFn: async (): Promise<Map<string, StockMetrics>> => {
    const table = supabase.from("stock_metrics" as never) as unknown as MetricsTable;
    const { data, error } = await table.select(COLUMNS);
    if (error) throw new Error(error.message);

    const out = new Map<string, StockMetrics>();
    for (const row of data ?? []) {
      const ticker = String(row.ticker).toUpperCase();
      out.set(ticker, {
        ticker,
        company: String(row.company ?? ""),
        shares: toNumber(row.shares),
        eps_26: toNumber(row.eps_26),
        eps_27e: toNumber(row.eps_27e),
        dps_26: toNumber(row.dps_26),
        dps_27e: toNumber(row.dps_27e),
        book_value_25: toNumber(row.book_value_25),
        sales_per_share_25: toNumber(row.sales_per_share_25),
        fcf_per_share_25: toNumber(row.fcf_per_share_25),
        roe_25: toNumber(row.roe_25),
        roa_25: toNumber(row.roa_25),
        payout_25: toNumber(row.payout_25),
        net_margin_25: toNumber(row.net_margin_25),
        ebitda_margin_25: toNumber(row.ebitda_margin_25),
      });
    }
    return out;
  },
  staleTime: 60 * 60_000,
};

/** Produit / quotient qui renvoie null dès qu'une opérande manque ou que le résultat dérape. */
const times = (a: number | null, b: number | null): number | null =>
  finite(a) && finite(b) && Number.isFinite(a * b) ? a * b : null;

const over = (a: number | null, b: number | null): number | null =>
  finite(a) && finite(b) && b !== 0 && Number.isFinite(a / b) ? a / b : null;

/**
 * Comment un indicateur se met en forme. Le rendu reste à l'appelant, qui seul
 * connaît la langue courante.
 */
export type MetricKind = "money" | "compact" | "multiple" | "percent" | "ratioPercent";

export type Metric = { label: Key; value: number; kind: MetricKind };

/** N'ajoute l'indicateur que s'il a une valeur exploitable. */
function push(list: Metric[], label: Key, value: number | null, kind: MetricKind) {
  if (finite(value)) list.push({ label, value, kind });
}

/**
 * Un cours absent ou nul n'est pas un cours.
 *
 * Sans cette normalisation, une valeur non cotée du jour passe à zéro et le
 * PER devient `0 / BPA`, soit 0 : un ratio parfaitement fini, affiché comme
 * « 0,0x », et parfaitement faux. Ramené à null, l'indicateur disparaît, ce
 * qui est le comportement voulu.
 */
const usablePrice = (price: number | null): number | null =>
  finite(price) && price > 0 ? price : null;

/**
 * Vrai si le classeur publie au moins un résultat par action pour cette valeur.
 *
 * La capitalisation seule ne suffit pas : elle ne demande que le nombre
 * d'actions, connu pour toute la cote, et classerait donc « suivies » des
 * valeurs dont aucun fondamental n'est publié.
 */
export function hasFundamentals(m: StockMetrics | undefined): boolean {
  if (!m) return false;
  return [m.eps_26, m.eps_27e, m.dps_26, m.dps_27e, m.book_value_25, m.roe_25].some(finite);
}

/**
 * Indicateurs affichés sur la vignette de la cote : ce qui situe la valeur
 * d'un coup d'œil, sans noyer la carte.
 */
export function summaryMetrics(m: StockMetrics | undefined, rawPrice: number | null): Metric[] {
  const out: Metric[] = [];
  if (!m) return out;
  const price = usablePrice(rawPrice);
  push(out, "metric.marketCap", times(m.shares, price), "compact");
  push(out, "metric.eps26", m.eps_26, "money");
  push(out, "metric.eps27", m.eps_27e, "money");
  push(out, "metric.dps26", m.dps_26, "money");
  push(out, "metric.dps27", m.dps_27e, "money");
  push(out, "metric.per26", over(price, m.eps_26), "multiple");
  push(out, "metric.per27", over(price, m.eps_27e), "multiple");
  push(out, "metric.dy26", times(over(m.dps_26, price), 100), "percent");
  push(out, "metric.dy27", times(over(m.dps_27e, price), 100), "percent");
  return out;
}

export type MetricGroup = { title: Key; metrics: Metric[] };

/**
 * Tableau de bord complet de la fiche valeur, groupé par famille.
 * Un groupe vide n'est pas renvoyé, donc la page ne rend aucun titre orphelin.
 */
export function detailGroups(m: StockMetrics | undefined, rawPrice: number | null): MetricGroup[] {
  if (!m) return [];
  const price = usablePrice(rawPrice);

  const valuation: Metric[] = [];
  push(valuation, "metric.marketCap", times(m.shares, price), "compact");
  push(valuation, "metric.per26", over(price, m.eps_26), "multiple");
  push(valuation, "metric.per27", over(price, m.eps_27e), "multiple");
  push(valuation, "metric.pb", over(price, m.book_value_25), "multiple");
  push(valuation, "metric.ps", over(price, m.sales_per_share_25), "multiple");
  push(valuation, "metric.pfcf", over(price, m.fcf_per_share_25), "multiple");

  const perShare: Metric[] = [];
  push(perShare, "metric.eps26", m.eps_26, "money");
  push(perShare, "metric.eps27", m.eps_27e, "money");
  push(perShare, "metric.dps26", m.dps_26, "money");
  push(perShare, "metric.dps27", m.dps_27e, "money");
  push(perShare, "metric.bookValue", m.book_value_25, "money");
  push(perShare, "metric.salesPerShare", m.sales_per_share_25, "money");
  push(perShare, "metric.fcfPerShare", m.fcf_per_share_25, "money");

  const returns: Metric[] = [];
  push(returns, "metric.dy26", times(over(m.dps_26, price), 100), "percent");
  push(returns, "metric.dy27", times(over(m.dps_27e, price), 100), "percent");
  // Le classeur exprime ces ratios en fraction : 0,163 vaut 16,3 %.
  push(returns, "metric.roe", m.roe_25, "ratioPercent");
  push(returns, "metric.roa", m.roa_25, "ratioPercent");
  push(returns, "metric.payout", m.payout_25, "ratioPercent");
  push(returns, "metric.netMargin", m.net_margin_25, "ratioPercent");
  push(returns, "metric.ebitdaMargin", m.ebitda_margin_25, "ratioPercent");

  return (
    [
      { title: "metric.valuation", metrics: valuation },
      { title: "metric.perShare", metrics: perShare },
      { title: "metric.profitability", metrics: returns },
    ] as MetricGroup[]
  ).filter((g) => g.metrics.length > 0);
}

/** Les indicateurs qui bougent avec le cours, signalés comme tels dans l'interface. */
export const LIVE_METRICS = new Set<Key>([
  "metric.marketCap",
  "metric.per26",
  "metric.per27",
  "metric.dy26",
  "metric.dy27",
  "metric.pb",
  "metric.ps",
  "metric.pfcf",
]);
