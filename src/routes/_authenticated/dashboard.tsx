import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  ExternalLink,
  GraduationCap,
  LineChart,
  PieChart,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { buildLevelProgress, lessonsQuery, progressQuery } from "@/lib/market";
import { useFormat, type Formatter } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { getLiveQuotes, type LiveQuote } from "@/lib/quotes.functions";
import { isIndexTicker, MASI20_TICKER, MASI_TICKER, tradingViewUrl } from "@/lib/cse-symbols";
import { useAuth } from "@/hooks/useAuth";
import { greetingName, myProfileQuery } from "@/lib/profile";
import { useRecordDailyQuotes } from "@/lib/quotes.history";
import { useI18n, usePageTitle, type Key, type Translate } from "@/lib/i18n";
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
  { to: "/simulateurs", icon: LineChart, label: "dash.q4", text: "dash.q4Text" },
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
      // Les indices ne sont pas des valeurs : ils n'ont rien à faire dans un
      // palmarès de hausses et de baisses.
      .filter((q) => !isIndexTicker(q.ticker) && Number.isFinite(q.changePct) && q.changePct !== 0)
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
  const masi = quoteMap.get(MASI_TICKER);
  const masi20 = quoteMap.get(MASI20_TICKER);

  return (
    <div className="space-y-7 sm:space-y-10">
      <header className="rise">
        <p className="eyebrow">{t("dash.hello")}</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("dash.subtitle")}</p>
      </header>

      <section className="surface-raised relative overflow-hidden p-5 sm:p-7">
        <div className="aurora" aria-hidden="true" />
        {/* Le libellé et l'action tiennent la même ligne, le montant occupe la
            suivante. À l'inverse, le bouton passait à la ligne derrière un
            nombre de 250 px et se retrouvait posé seul sous le total, sans
            plus rien à quoi se rattacher. */}
        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">{t("dash.portfolioLive")}</p>
            <Link
              to="/portefeuille"
              className="press inline-flex min-h-9 shrink-0 items-center whitespace-nowrap rounded-full border border-border px-4 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              {t("dash.manage")}
            </Link>
          </div>
          <p className="mt-2 text-[32px] font-bold leading-tight tabular-nums text-gradient-gold sm:text-4xl">
            {portfolio ? f.mad(portfolio.value, 0) : "…"}
          </p>
        </div>
        {/* Sur téléphone les trois chiffres se lisent en lignes libellé /
            valeur, comme une fiche : empilés en blocs, ils occupaient à eux
            seuls la moitié de l'écran avant qu'on ait vu quoi que ce soit
            d'autre. La colonne revient dès qu'il y a la largeur. */}
        <div className="relative mt-6 grid gap-2 sm:mt-7 sm:gap-5 sm:grid-cols-3">
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

      {/* Les deux indices de la cote, entre la valeur du portefeuille et les
          mouvements du jour. Ils sortent du produit : le clic ouvre le
          graphique complet sur TradingView, dans un nouvel onglet. */}
      <section className="grid gap-4 sm:grid-cols-2">
        <IndexCard
          label={t("dash.masi")}
          caption={t("dash.masiFull")}
          quote={masi ?? null}
          href={tradingViewUrl(MASI_TICKER)}
          f={f}
          t={t}
        />
        <IndexCard
          label={t("dash.masi20")}
          caption={t("dash.masi20Full")}
          quote={masi20 ?? null}
          href={tradingViewUrl(MASI20_TICKER)}
          f={f}
          t={t}
        />
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
                  // Le palmarès n'était qu'un affichage : voir une valeur bouger
                  // sans pouvoir l'ouvrir obligeait à la retrouver à la main dans
                  // la cote. Chaque ligne mène désormais à sa fiche.
                  <li key={q.ticker}>
                    <Link
                      to="/bourse/$ticker"
                      params={{ ticker: q.ticker }}
                      className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent/50"
                    >
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
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        ))}
      </section>

      <section className="surface-raised p-5 sm:p-7">
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">{t("dash.progressTitle")}</p>
            <Link
              to="/academie"
              className="press inline-flex min-h-9 shrink-0 items-center whitespace-nowrap rounded-full border border-border px-4 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              {t("dash.seeModules")}
            </Link>
          </div>
          <p className="mt-2 text-[32px] font-bold leading-tight tabular-nums text-gradient-gold sm:text-4xl">
            {ratio}%
          </p>
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

      <section>
        <h2 className="text-lg font-semibold">{t("dash.quickAccess")}</h2>
        {/* Deux tuiles par ligne sur téléphone : quatre raccourcis empilés
            faisaient de la fin du tableau de bord un couloir. */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {QUICK.map((c) => (
            <Link key={c.to} to={c.to} className="surface-raised card-hover group p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-primary/25 bg-accent">
                  <c.icon className="h-4 w-4 text-primary" />
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
              <p className="mt-4 text-[15px] font-medium sm:mt-5 sm:text-base">{t(c.label)}</p>
              <p className="mt-1 text-xs leading-snug text-muted-foreground">{t(c.text)}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

/**
 * Un indice de la cote, cliquable vers son graphique TradingView.
 *
 * La carte reste affichée même sans cotation : le MASI 20 n'est pas un symbole
 * documenté chez TradingView, et une carte vide qui dit « indisponible » se lit
 * mieux qu'un bloc qui disparaît sans explication. Le lien vers le graphique,
 * lui, fonctionne dans tous les cas.
 */
function IndexCard({
  label,
  caption,
  quote,
  href,
  f,
  t,
}: {
  label: string;
  caption: string;
  quote: LiveQuote | null;
  href: string;
  f: Formatter;
  t: Translate;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      title={t("dash.openOnTradingView")}
      className="surface-raised card-hover group block p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-3 text-4xl font-bold text-gradient-gold">
            {quote ? f.price(quote.price) : "…"}
          </p>
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-primary/25 bg-accent">
          <Activity className="h-4 w-4 text-primary" />
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{caption}</span>
        <span
          className={`tabular-nums ${
            !quote
              ? "text-muted-foreground"
              : quote.changePct >= 0
                ? "text-[var(--success)]"
                : "text-destructive"
          }`}
        >
          {quote ? f.pct(quote.changePct) : t("dash.indexUnavailable")}
        </span>
      </div>
      <span className="mt-3 inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors group-hover:text-foreground">
        TradingView
        <ExternalLink className="h-3 w-3" />
      </span>
    </a>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/40 pb-2 last:border-0 last:pb-0 sm:block sm:border-0 sm:pb-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`shrink-0 whitespace-nowrap text-sm font-semibold tabular-nums sm:mt-1.5 ${
          tone === "up" ? "text-[var(--success)]" : tone === "down" ? "text-destructive" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
