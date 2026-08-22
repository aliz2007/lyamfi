import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { callRpc } from "@/lib/rpc";
import type { LiveQuote } from "@/lib/quotes.functions";

/**
 * Historique de cours détenu par Lyamfi.
 *
 * `stock_prices`, la table héritée, est SYNTHÉTIQUE : la migration initiale la
 * remplit avec une sinusoïde calculée sur md5(ticker). Elle convient à un
 * exemple pédagogique, pas à un graphique de cours présenté comme réel.
 *
 * `stock_quotes_daily` accumule les vraies clôtures, une par séance, à partir
 * des cotations que l'application récupère déjà. L'historique se construit donc
 * dans le temps : court au démarrage, complet ensuite.
 */

export type DailyQuote = { ticker: string; date: string; close: number };

type QuotesTable = {
  select: (cols: string) => {
    eq: (
      col: string,
      val: string,
    ) => {
      order: (
        col: string,
        opts: { ascending: boolean },
      ) => Promise<{ data: DailyQuote[] | null; error: { message: string } | null }>;
    };
  };
};

const table = () => supabase.from("stock_quotes_daily" as never) as unknown as QuotesTable;

/** Série journalière d'une valeur, de la plus ancienne à la plus récente. */
export const quoteHistoryQuery = (ticker: string) => ({
  queryKey: ["quote-history", ticker],
  queryFn: async (): Promise<DailyQuote[]> => {
    const { data, error } = await table()
      .select("ticker, date, close")
      .eq("ticker", ticker.toUpperCase())
      .order("date", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({ ...r, close: Number(r.close) }));
  },
  staleTime: 5 * 60_000,
});

/**
 * Dépose la clôture du jour pour toutes les valeurs cotées.
 *
 * La base ignore un couple (valeur, jour) déjà enregistré, donc appeler cette
 * fonction plusieurs fois par jour ne coûte rien et n'écrase jamais rien.
 */
export async function recordDailyQuotes(quotes: LiveQuote[]): Promise<number> {
  const payload = quotes
    .filter((q) => q.ticker && Number.isFinite(q.price) && q.price > 0)
    .slice(0, 300)
    .map((q) => ({
      ticker: q.ticker.toUpperCase(),
      close: q.price,
      change_pct: Number.isFinite(q.changePct) ? q.changePct : null,
    }));
  if (payload.length === 0) return 0;
  return callRpc<number>("record_daily_quotes", { quotes: payload });
}

/**
 * Historique récent de TOUTES les valeurs, en une seule requête.
 * La liste `/bourse` affiche 81 vignettes : une requête par valeur serait
 * absurde, on récupère donc la fenêtre entière et on regroupe côté client.
 */
export const recentHistoryQuery = (days = 60) => ({
  queryKey: ["quote-history-all", days],
  queryFn: async (): Promise<Map<string, number[]>> => {
    const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
    const q = supabase.from("stock_quotes_daily" as never) as unknown as {
      select: (cols: string) => {
        gte: (
          col: string,
          val: string,
        ) => {
          order: (
            col: string,
            opts: { ascending: boolean },
          ) => Promise<{ data: DailyQuote[] | null; error: { message: string } | null }>;
        };
      };
    };
    const { data, error } = await q
      .select("ticker, date, close")
      .gte("date", since)
      .order("date", { ascending: true });
    if (error) throw new Error(error.message);

    const byTicker = new Map<string, number[]>();
    for (const row of data ?? []) {
      const key = row.ticker.toUpperCase();
      const series = byTicker.get(key);
      if (series) series.push(Number(row.close));
      else byTicker.set(key, [Number(row.close)]);
    }
    return byTicker;
  },
  staleTime: 5 * 60_000,
});

/**
 * Dépose la clôture du jour, une fois par montage de page.
 *
 * L'appel est sans effet si la journée est déjà enregistrée, donc plusieurs
 * pages peuvent l'utiliser sans se coordonner. Une erreur reste silencieuse :
 * ne pas réussir à archiver un cours ne doit pas dégrader l'écran affiché.
 */
export function useRecordDailyQuotes(quotes: LiveQuote[]): void {
  const done = useRef(false);
  useEffect(() => {
    if (done.current || quotes.length === 0) return;
    done.current = true;
    void recordDailyQuotes(quotes).catch(() => {
      /* archivage best-effort */
    });
  }, [quotes]);
}
