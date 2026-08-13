import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";
import { ArrowUpRight, BarChart3, GraduationCap, LineChart, PieChart, TrendingDown, TrendingUp } from "lucide-react";
import { buildLevelProgress, lessonsQuery, progressQuery, stocksQuery } from "@/lib/market";
import { mad, pct } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { getLiveQuotes, type LiveQuote } from "@/lib/quotes.functions";
import { useAuth } from "@/hooks/useAuth";


export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — Lyamfi" },
      { name: "description", content: "Ta progression, ton portefeuille simulé et tes accès rapides." },
      { property: "og:title", content: "Tableau de bord — Lyamfi" },
      { property: "og:description", content: "Suis ta progression sur Lyamfi." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const { data: stocks = [] } = useQuery(stocksQuery);
  const { data: lessons = [] } = useQuery(lessonsQuery);
  const { data: progress = [] } = useQuery(progressQuery);

  const fetchQuotes = useServerFn(getLiveQuotes);
  const { data: quotes = [], isLoading: quotesLoading } = useQuery({
    queryKey: ["cse-quotes"],
    queryFn: () => fetchQuotes(),
    refetchOnMount: "always",
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const { data: pf } = useQuery({
    queryKey: ["dashboard-portfolio"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return null;
      const { data: p } = await supabase
        .from("portfolios")
        .select("id, cash")
        .eq("user_id", uid)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!p) return null;
      const { data: holdings } = await supabase
        .from("portfolio_holdings")
        .select("ticker, quantity, avg_price")
        .eq("portfolio_id", p.id);
      return {
        cash: Number(p.cash),
        holdings: (holdings ?? []).map((h) => ({
          ticker: h.ticker,
          quantity: Number(h.quantity),
          avgPrice: Number(h.avg_price),
        })),
      };
    },
    refetchOnMount: "always",
  });

  const quoteMap = useMemo(() => {
    const m = new Map<string, LiveQuote>();
    quotes.forEach((q) => m.set(q.ticker.toUpperCase(), q));
    return m;
  }, [quotes]);

  const { gainers, losers } = useMemo(() => {
    const list = quotes
      .filter((q) => q.ticker.toUpperCase() !== "MASI" && Number.isFinite(q.changePct) && q.changePct !== 0)
      .sort((a, b) => b.changePct - a.changePct);
    return { gainers: list.slice(0, 5), losers: [...list].reverse().slice(0, 5) };
  }, [quotes]);

  const portfolio = useMemo(() => {
    if (!pf) return null;
    let market = 0;
    let cost = 0;
    for (const h of pf.holdings) {
      const price = quoteMap.get(h.ticker.toUpperCase())?.price ?? h.avgPrice;
      market += price * h.quantity;
      cost += h.avgPrice * h.quantity;
    }
    const value = pf.cash + market;
    const pl = market - cost;
    const plPct = cost > 0 ? (pl / cost) * 100 : 0;
    return { value, cash: pf.cash, market, pl, plPct, count: pf.holdings.length };
  }, [pf, quoteMap]);

  const { levels, done, total, ratio } = buildLevelProgress(lessons, progress);

  return (
    <div className="space-y-10">
      <header className="reveal">
        <p className="text-sm text-muted-foreground">Bonjour</p>
        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
          {user?.email?.split("@")[0] ?? "Investisseur"}
        </h1>
      </header>

      <section className="surface-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Portefeuille virtuel (en direct)</p>
            <p className="mt-2 text-4xl font-bold text-gradient-gold">
              {portfolio ? mad(portfolio.value, 0) : "—"}
            </p>
          </div>
          <Link to="/portefeuille" className="text-xs text-primary">
            Gérer
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Liquidités</p>
            <p className="mt-1 text-sm font-semibold">{portfolio ? mad(portfolio.cash, 0) : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Titres ({portfolio?.count ?? 0})</p>
            <p className="mt-1 text-sm font-semibold">{portfolio ? mad(portfolio.market, 0) : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Plus/moins-value latente</p>
            <p
              className={`mt-1 text-sm font-semibold ${
                (portfolio?.pl ?? 0) >= 0 ? "text-[var(--success)]" : "text-destructive"
              }`}
            >
              {portfolio ? `${mad(portfolio.pl, 0)} (${pct(portfolio.plPct)})` : "—"}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {[
          { title: "Top 5 hausses du jour", rows: gainers, up: true },
          { title: "Top 5 baisses du jour", rows: losers, up: false },
        ].map((block) => (
          <div key={block.title} className="surface-card p-6">
            <div className="flex items-center gap-2">
              {block.up ? (
                <TrendingUp className="h-4 w-4 text-[var(--success)]" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              <h2 className="text-sm font-semibold">{block.title}</h2>
            </div>
            <ul className="mt-4 divide-y divide-border/60">
              {quotesLoading && block.rows.length === 0 ? (
                <li className="py-3 text-xs text-muted-foreground">Chargement des cours…</li>
              ) : block.rows.length === 0 ? (
                <li className="py-3 text-xs text-muted-foreground">Cours indisponibles.</li>
              ) : (
                block.rows.map((q) => (
                  <li key={q.ticker} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{q.ticker}</p>
                      <p className="truncate text-xs text-muted-foreground">{q.name}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold">{q.price.toLocaleString("fr-MA")}</p>
                      <p
                        className={`text-xs ${
                          q.changePct >= 0 ? "text-[var(--success)]" : "text-destructive"
                        }`}
                      >
                        {pct(q.changePct)}
                      </p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        ))}
      </section>


      <section className="surface-card p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Progression pédagogique globale</p>
            <p className="mt-2 text-4xl font-bold text-gradient-gold">{ratio}%</p>
          </div>
          <Link to="/academie" className="text-xs text-primary">
            Voir les modules
          </Link>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-gradient-gold" style={{ width: `${ratio}%` }} />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {done} module(s) validé(s) sur {total}
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {levels.map((l) => (
            <div key={l.level}>
              <div className="flex items-center justify-between text-xs">
                <span className={l.unlocked ? "text-foreground" : "text-muted-foreground"}>
                  {l.level}
                  {!l.unlocked && " (verrouillé)"}
                </span>
                <span className="text-muted-foreground">
                  {l.done}/{l.total}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-gold"
                  style={{ width: `${l.total ? (l.done / l.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="surface-card p-6">

          <p className="text-xs text-muted-foreground">Valeurs suivies</p>
          <p className="mt-3 text-4xl font-bold text-gradient-gold">{stocks.length}</p>
          <p className="mt-4 text-xs text-muted-foreground">Bourse de Casablanca</p>
        </div>
        <div className="surface-card p-6">
          <p className="text-xs text-muted-foreground">Indice MASI</p>
          <p className="mt-3 text-4xl font-bold text-gradient-gold">
            {quoteMap.get("MASI")?.price.toLocaleString("fr-MA") ?? "—"}
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            {quoteMap.get("MASI") ? pct(quoteMap.get("MASI")!.changePct) : "Cours en direct"}
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Accès rapide</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { to: "/bourse", icon: BarChart3, label: "Bourse BVC", text: "Fiches valeurs et valorisation" },
            { to: "/portefeuille", icon: PieChart, label: "Portefeuille", text: "Allocation et diversification" },
            { to: "/academie", icon: GraduationCap, label: "Académie", text: "Leçons, quiz et badges" },
            { to: "/budget", icon: LineChart, label: "Budget", text: "Intérêts composés" },
          ].map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className="surface-card group p-6 transition-colors hover:border-primary/50"
            >
              <div className="flex items-start justify-between">
                <c.icon className="h-5 w-5 text-primary" />
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5" />
              </div>
              <p className="mt-5 font-medium">{c.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{c.text}</p>
            </Link>
          ))}
        </div>
      </section>


    </div>
  );
}
