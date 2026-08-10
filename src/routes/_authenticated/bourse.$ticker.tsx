import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLiveQuotes } from "@/lib/quotes.functions";
import { ArrowLeft } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { stockQuery } from "@/lib/market";
import { compact, mad, num, pct } from "@/lib/format";
import { Disclaimer } from "@/components/Disclaimer";
import { TradingViewWidget } from "@/components/TradingViewWidget";
import { hasCseQuote, tvSymbol } from "@/lib/cse-symbols";

export const Route = createFileRoute("/_authenticated/bourse/$ticker")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.ticker} — fiche valeur BVC | Lyamfi` },
      {
        name: "description",
        content: `Cours, PER, BPA, rendement et cours cible de ${params.ticker} à la Bourse de Casablanca.`,
      },
      { property: "og:title", content: `${params.ticker} — fiche valeur | Lyamfi` },
      { property: "og:description", content: "Valorisation fondamentale et évolution du cours." },
    ],
  }),
  component: StockPage,
});

function StockPage() {
  const { ticker } = Route.useParams();
  const { data, isLoading } = useQuery(stockQuery(ticker));
  const fetchQuotes = useServerFn(getLiveQuotes);
  const { data: quotes = [] } = useQuery({
    queryKey: ["cse-quotes"],
    queryFn: () => fetchQuotes(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const stock = data?.stock;

  if (isLoading) return <p className="text-sm text-muted-foreground">Chargement…</p>;
  if (!stock)
    return (
      <div>
        <p className="text-sm text-muted-foreground">Valeur introuvable.</p>
        <Link to="/bourse" className="mt-3 inline-block text-sm text-primary">
          Retour aux valeurs
        </Link>
      </div>
    );

  const live = quotes.find(
    (q) => q.ticker.toUpperCase() === tvSymbol(stock.ticker).split(":")[1],
  );
  const price = live?.price ?? Number(stock.price);
  const changePct = live?.changePct ?? Number(stock.change_pct);
  const target = Number(stock.target_price ?? 0);
  const upside = target ? ((target - price) / price) * 100 : 0;
  const chart = (data?.prices ?? []).map((p) => ({
    date: p.date,
    close: Number(p.close),
  }));

  const metrics = [
    { label: "PER", value: num(Number(stock.per), 1), hint: "Cours / bénéfice par action" },
    { label: "BPA", value: num(Number(stock.bpa), 2), hint: "Bénéfice par action (MAD)" },
    {
      label: "Rendement (DY)",
      value: `${num(Number(stock.dividend_yield), 2)} %`,
      hint: "Dividende / cours",
    },
    { label: "PEG", value: num(Number(stock.peg), 2), hint: "PER / croissance" },
    { label: "Cours cible", value: mad(target), hint: "Hypothèse pédagogique" },
    { label: "Upside", value: pct(upside), hint: "Écart au cours cible" },
  ];

  return (
    <div className="space-y-8">
      <Link
        to="/bourse"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Valeurs
      </Link>

      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">
            {stock.ticker} · {stock.sector}
          </p>
          <h1 className="mt-1 truncate text-3xl font-bold sm:text-4xl">{stock.name}</h1>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-gradient-gold sm:text-4xl">
            {price.toLocaleString("fr-MA")}
          </p>
          <p
            className={`mt-1 text-sm ${
              Number(stock.change_pct) >= 0 ? "text-[var(--success)]" : "text-destructive"
            }`}
          >
            {pct(Number(stock.change_pct))}
          </p>
        </div>
      </header>

      {stock.description && (
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {stock.description} Capitalisation : {compact(Number(stock.market_cap))}.
        </p>
      )}

      {hasCseQuote(stock.ticker) && (
        <section className="surface-card overflow-hidden p-2 sm:p-4">
          <h2 className="px-2 pb-2 pt-1 text-sm font-semibold">Cours en direct (TradingView)</h2>
          <TradingViewWidget
            widget="advanced-chart"
            className="h-[420px] w-full"
            config={{
              symbol: tvSymbol(stock.ticker),
              interval: "D",
              timezone: "Africa/Casablanca",
              theme: "dark",
              style: "3",
              locale: "fr",
              hide_side_toolbar: true,
              allow_symbol_change: false,
              withdateranges: true,
              autosize: true,
            }}
          />
        </section>
      )}

      <section className="surface-card p-5 sm:p-7">
        <h2 className="text-sm font-semibold">Historique pédagogique (12 mois)</h2>

        <div className="mt-5 h-64 w-full sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                minTickGap={48}
                tickFormatter={(d: string) => d.slice(5)}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={56}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  color: "var(--popover-foreground)",
                  fontSize: 12,
                }}
                formatter={(v: number) => [`${v} MAD`, "Cours"]}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke="var(--gold)"
                strokeWidth={2}
                fill="url(#goldFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Valorisation fondamentale</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((m) => (
            <div key={m.label} className="surface-card p-5">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className="mt-2 text-2xl font-bold text-gradient-gold">{m.value}</p>
              <p className="mt-2 text-xs text-muted-foreground">{m.hint}</p>
            </div>
          ))}
        </div>
      </section>

      <Disclaimer />
    </div>
  );
}
