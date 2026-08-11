import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search } from "lucide-react";
import { getLiveQuotes } from "@/lib/quotes.functions";
import { fundamentalsQuery, stocksQuery } from "@/lib/market";
import { compact, num, pct } from "@/lib/format";
import { tvSymbol } from "@/lib/cse-symbols";

/**
 * Section « Valeurs les plus liquides » : fondamentaux 2025 / 2026e (BPA, DPA, PER, D/Y)
 * avec PER et capitalisation recalculés en direct à partir du cours TradingView.
 */
export function LiquidStocks() {
  const { data: fundamentals = [] } = useQuery(fundamentalsQuery);
  const { data: stocks = [] } = useQuery(stocksQuery);
  const fetchQuotes = useServerFn(getLiveQuotes);
  const { data: quotes = [] } = useQuery({
    queryKey: ["cse-quotes"],
    queryFn: () => fetchQuotes(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const [q, setQ] = useState("");

  const dbByTv = useMemo(
    () => new Map(stocks.map((s) => [tvSymbol(s.ticker).split(":")[1]!, s.ticker])),
    [stocks],
  );
  const quoteByTicker = useMemo(
    () => new Map(quotes.map((x) => [x.ticker.toUpperCase(), x])),
    [quotes],
  );

  const rows = useMemo(() => {
    const list = fundamentals.map((f) => {
      const live = quoteByTicker.get(f.ticker.toUpperCase());
      const price = live?.price ?? null;
      const shares = Number(f.shares_m) * 1e6;
      const per = (bpa: number | null) =>
        price && bpa && bpa > 0 ? price / bpa : null;
      const dy = (dpa: number | null) =>
        price && dpa !== null && price > 0 ? (dpa / price) * 100 : null;
      return {
        ...f,
        slug: dbByTv.get(f.ticker.toUpperCase()) ?? null,
        price,
        changePct: live?.changePct ?? null,
        marketCap: price ? price * shares : null,
        perLive25: per(f.bpa_2025 === null ? null : Number(f.bpa_2025)),
        perLive26: per(f.bpa_2026e === null ? null : Number(f.bpa_2026e)),
        dyLive25: dy(f.dpa_2025 === null ? null : Number(f.dpa_2025)),
        dyLive26: dy(f.dpa_2026e === null ? null : Number(f.dpa_2026e)),
      };
    });
    const needle = q.trim().toLowerCase();
    return list
      .filter(
        (r) =>
          !needle ||
          r.name.toLowerCase().includes(needle) ||
          r.ticker.toLowerCase().includes(needle),
      )
      .sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0));
  }, [fundamentals, quoteByTicker, dbByTv, q]);

  if (fundamentals.length === 0) return null;

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-xl font-semibold sm:text-2xl">
          Actions les plus importantes / liquides
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Fondamentaux 2025 et 2026 estimés (BPA, DPA, PER, rendement) pour {fundamentals.length}{" "}
          valeurs. Le PER, le rendement et la capitalisation sont recalculés en continu à partir du
          cours en direct TradingView.
        </p>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher parmi les valeurs liquides"
          className="w-full rounded-xl border border-input bg-card py-2.5 pl-11 pr-4 text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="surface-card overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Valeur</th>
              <th className="px-3 py-3 text-right font-medium">Cours</th>
              <th className="px-3 py-3 text-right font-medium">Var.</th>
              <th className="px-3 py-3 text-right font-medium">Cap. boursière</th>
              <th className="px-3 py-3 text-right font-medium">Nb actions (M)</th>
              <th className="px-3 py-3 text-right font-medium">BPA 25 / 26e</th>
              <th className="px-3 py-3 text-right font-medium">DPA 25 / 26e</th>
              <th className="px-3 py-3 text-right font-medium">PER 25 / 26e</th>
              <th className="px-4 py-3 text-right font-medium">D/Y 25 / 26e</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.ticker} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3">
                  {r.slug ? (
                    <Link
                      to="/bourse/$ticker"
                      params={{ ticker: r.slug }}
                      className="font-medium transition-colors hover:text-primary"
                    >
                      {r.name}
                    </Link>
                  ) : (
                    <span className="font-medium">{r.name}</span>
                  )}
                  <span className="ml-2 text-xs text-muted-foreground">{r.ticker}</span>
                </td>
                <td className="px-3 py-3 text-right font-medium">
                  {r.price ? r.price.toLocaleString("fr-MA") : "—"}
                </td>
                <td
                  className={`px-3 py-3 text-right ${
                    (r.changePct ?? 0) >= 0 ? "text-[var(--success)]" : "text-destructive"
                  }`}
                >
                  {r.changePct === null ? "—" : pct(r.changePct)}
                </td>
                <td className="px-3 py-3 text-right">
                  {r.marketCap ? compact(r.marketCap) : "—"}
                </td>
                <td className="px-3 py-3 text-right text-muted-foreground">
                  {num(Number(r.shares_m), 1)}
                </td>
                <td className="px-3 py-3 text-right">
                  {num(r.bpa_2025 === null ? null : Number(r.bpa_2025), 1)} /{" "}
                  {num(r.bpa_2026e === null ? null : Number(r.bpa_2026e), 1)}
                </td>
                <td className="px-3 py-3 text-right">
                  {num(r.dpa_2025 === null ? null : Number(r.dpa_2025), 1)} /{" "}
                  {num(r.dpa_2026e === null ? null : Number(r.dpa_2026e), 1)}
                </td>
                <td className="px-3 py-3 text-right font-medium">
                  {num(r.perLive25, 1)}x / {num(r.perLive26, 1)}x
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {num(r.dyLive25, 1)} % / {num(r.dyLive26, 1)} %
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-muted-foreground">
                  Aucune valeur ne correspond à la recherche.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Prévisions BPA / DPA issues d'un consensus d'analystes ; PER, rendement et capitalisation
        recalculés au cours du jour. Outil pédagogique, ne constitue pas un conseil en
        investissement.
      </p>
    </section>
  );
}
