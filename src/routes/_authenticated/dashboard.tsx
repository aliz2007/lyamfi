import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";
import {
  ArrowUpRight,
  BarChart3,
  GraduationCap,
  LineChart,
  PieChart,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { buildLevelProgress, lessonsQuery, progressQuery, stocksQuery } from "@/lib/market";
import { useFormat } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { getLiveQuotes, type LiveQuote } from "@/lib/quotes.functions";
import { useAuth } from "@/hooks/useAuth";
import { greetingName, myProfileQuery } from "@/lib/profile";
import { useRecordDailyQuotes } from "@/lib/quotes.history";
import { useI18n, usePageTitle, type Key } from "@/lib/i18n";
import { levelKey } from "@/lib/levels";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Tableau de bord | Lyamfi" },
      {
        name: "description",
        content: "Ta progression, ton portefeuille simulé et tes accès rapides.",
      },
      { property: "og:title", content: "Tableau de bord | Lyamfi" },
      { property: "og:description", content: "Suis ta progression sur Lyamfi." },
    ],
  }),
  component: Dashboard,
});

const QUICK = [
  { to: "/bourse", icon: BarChart3, label: "dash.q1", text: "dash.q1Text" },
  { to: "/portefeuille", icon: PieChart, label: "dash.q2", text: "dash.q2Text" },
  { to: "/academie", icon: GraduationCap, label: "dash.q3", text: "dash.q3Text" },
  { to: "/budget", icon: LineChart, label: "dash.q4", text: "dash.q4Text" },
] as const satisfies readonly {
  to: string;
  icon: typeof BarChart3;
  label: Key;
  text: Key;
}[];

function Dashboard() {
  const { t } = useI18n();
  const f = useFormat();
  usePageTitle("nav.dashboard");

  const { user } = useAuth();
  const { data: profile } = useQuery(myProfileQuery);
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

  // Le tableau de bord est la première page après connexion : c'est le point
  // le plus fiable pour archiver la clôture du jour.
  useRecordDailyQuotes(quotes);

  const quoteMap = useMemo(() => {
    const m = new Map<string, LiveQuote>();
    quotes.forEach((q) => m.set(q.ticker.toUpperCase(), q));
    return m;
  }, [quotes]);

  const { gainers, losers } = useMemo(() => {
    const list = quotes
      .filter(
        (q) =>
          q.ticker.toUpperCase() !== "MASI" && Number.isFinite(q.changePct) && q.changePct !== 0,
      )
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
    return {
      value: pf.cash + market,
      cash: pf.cash,
      market,
      pl: market - cost,
      plPct: cost > 0 ? ((market - cost) / cost) * 100 : 0,
      count: pf.holdings.length,
    };
  }, [pf, quoteMap]);

  const { levels, done, total, ratio } = buildLevelProgress(lessons, progress);
  const name = greetingName(profile, user?.email) ?? t("dash.fallbackName");
  const masi = quoteMap.get("MASI");

  return (
    <div className="space-y-10">
      <header className="rise">
        <p className="eyebrow">{t("dash.hello")}</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("dash.subtitle")}</p>
      </header>

      <section className="surface-raised relative overflow-hidden p-6 sm:p-7">
        <div className="aurora" aria-hidden="true" />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">{t("dash.portfolioLive")}</p>
            <p className="mt-2 text-4xl font-bold text-gradient-gold">
              {portfolio ? f.mad(portfolio.value, 0) : "…"}
            </p>
          </div>
          <Link
            to="/portefeuille"
            className="rounded-full border border-border px-4 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            {t("dash.manage")}
          </Link>
        </div>
        <div className="relative mt-7 grid gap-5 sm:grid-cols-3">
          <Metric label={t("dash.cash")} value={portfolio ? f.mad(portfolio.cash, 0) : "…"} />
          <Metric
            label={t("dash.holdings", { count: portfolio?.count ?? 0 })}
            value={portfolio ? f.mad(portfolio.market, 0) : "…"}
          />
          <Metric
            label={t("dash.unrealised")}
            value={portfolio ? `${f.mad(portfolio.pl, 0)} (${f.pct(portfolio.plPct)})` : "…"}
            tone={(portfolio?.pl ?? 0) >= 0 ? "up" : "down"}
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {[
          { title: t("dash.topGainers"), rows: gainers, up: true },
          { title: t("dash.topLosers"), rows: losers, up: false },
        ].map((block) => (
          <div key={block.title} className="surface-raised p-6">
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
                <li className="py-3 text-xs text-muted-foreground">{t("dash.loadingQuotes")}</li>
              ) : block.rows.length === 0 ? (
                <li className="py-3 text-xs text-muted-foreground">{t("dash.noQuotes")}</li>
              ) : (
                block.rows.map((q) => (
                  <li key={q.ticker} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{q.ticker}</p>
                      <p className="truncate text-xs text-muted-foreground">{q.name}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold tabular-nums">{f.price(q.price)}</p>
                      <p
                        className={`text-xs tabular-nums ${
                          q.changePct >= 0 ? "text-[var(--success)]" : "text-destructive"
                        }`}
                      >
                        {f.pct(q.changePct)}
                      </p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        ))}
      </section>

      <section className="surface-raised p-6 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">{t("dash.progressTitle")}</p>
            <p className="mt-2 text-4xl font-bold text-gradient-gold">{ratio}%</p>
          </div>
          <Link
            to="/academie"
            className="rounded-full border border-border px-4 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            {t("dash.seeModules")}
          </Link>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-gold transition-[width] duration-700"
            style={{ width: `${ratio}%` }}
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {t("dash.modulesDone", { done, total })}
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {levels.map((l) => (
            <div key={l.level}>
              <div className="flex items-center justify-between text-xs">
                <span className={l.unlocked ? "text-foreground" : "text-muted-foreground"}>
                  {t(levelKey(l.level))}
                  {!l.unlocked && ` ${t("dash.locked")}`}
                </span>
                <span className="tabular-nums text-muted-foreground">
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
        <div className="surface-raised p-6">
          <p className="text-xs text-muted-foreground">{t("dash.tracked")}</p>
          <p className="mt-3 text-4xl font-bold text-gradient-gold">{stocks.length}</p>
          <p className="mt-4 text-xs text-muted-foreground">{t("dash.exchange")}</p>
        </div>
        <div className="surface-raised p-6">
          <p className="text-xs text-muted-foreground">{t("dash.masi")}</p>
          <p className="mt-3 text-4xl font-bold text-gradient-gold">
            {masi ? f.price(masi.price) : "…"}
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            {masi ? f.pct(masi.changePct) : t("dash.liveQuote")}
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">{t("dash.quickAccess")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK.map((c) => (
            <Link key={c.to} to={c.to} className="surface-raised card-hover group p-6">
              <div className="flex items-start justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-primary/25 bg-accent">
                  <c.icon className="h-4 w-4 text-primary" />
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
              <p className="mt-5 font-medium">{t(c.label)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t(c.text)}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`mt-1.5 text-sm font-semibold tabular-nums ${
          tone === "up" ? "text-[var(--success)]" : tone === "down" ? "text-destructive" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
