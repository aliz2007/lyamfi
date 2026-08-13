import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";
import { ArrowUpRight, BarChart3, GraduationCap, LineChart, PieChart, TrendingDown, TrendingUp } from "lucide-react";
import { buildLevelProgress, lessonsQuery, progressQuery, stocksQuery } from "@/lib/market";
import { compact, mad, pct } from "@/lib/format";
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

  const { levels, done, total, ratio } = buildLevelProgress(lessons, progress);
  const movers = [...stocks].sort((a, b) => Number(b.change_pct) - Number(a.change_pct)).slice(0, 4);

  return (
    <div className="space-y-10">
      <header className="reveal">
        <p className="text-sm text-muted-foreground">Bonjour</p>
        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
          {user?.email?.split("@")[0] ?? "Investisseur"}
        </h1>
      </header>

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
          <p className="text-xs text-muted-foreground">Portefeuille simulé</p>
          <p className="mt-3 text-4xl font-bold text-gradient-gold">100 000</p>
          <p className="mt-4 text-xs text-muted-foreground">
            Capital virtuel de départ (MAD) —{" "}
            <Link to="/portefeuille" className="text-primary">
              construire
            </Link>
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

      <section>
        <h2 className="text-lg font-semibold">Plus fortes hausses du jour</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {movers.map((s) => (
            <Link
              key={s.id}
              to="/bourse/$ticker"
              params={{ ticker: s.ticker }}
              className="surface-card p-5 transition-colors hover:border-primary/50"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold">{s.ticker}</span>
                <span
                  className={
                    Number(s.change_pct) >= 0
                      ? "text-xs text-[var(--success)]"
                      : "text-xs text-destructive"
                  }
                >
                  {pct(Number(s.change_pct))}
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">{s.name}</p>
              <p className="mt-4 text-xl font-semibold">{Number(s.price).toLocaleString("fr-MA")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{compact(Number(s.market_cap))}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
