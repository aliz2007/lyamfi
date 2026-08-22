import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";
import { ArrowLeft, LineChart } from "lucide-react";
import { getLiveQuotes } from "@/lib/quotes.functions";
import { fundamentalsQuery, stocksQuery } from "@/lib/market";
import { quoteHistoryQuery } from "@/lib/quotes.history";
import { EMPTY, useFormat } from "@/lib/format";
import { Disclaimer } from "@/components/Disclaimer";
import { PriceChart } from "@/components/PriceChart";
import { CSE_SYMBOLS, tvSymbol } from "@/lib/cse-symbols";
import { useI18n, type Key, type Translate } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/bourse/$ticker")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.ticker} : fiche valeur BVC | Lyamfi` },
      {
        name: "description",
        content: `Cours, PER, BPA, DPA et rendement de ${params.ticker} à la Bourse de Casablanca.`,
      },
      { property: "og:title", content: `${params.ticker} : fiche valeur | Lyamfi` },
      {
        property: "og:description",
        content: "Graphique interactif et valorisation fondamentale.",
      },
    ],
  }),
  component: StockPage,
});

const NAME_BY_CODE = new Map(
  CSE_SYMBOLS.map(([symbol, title]) => [symbol.split(":")[1]!.toUpperCase(), title]),
);

function StockPage() {
  const { ticker } = Route.useParams();
  const { t } = useI18n();
  const f = useFormat();

  // La route est indexée sur le code de la cote, pas sur le ticker de la table
  // `stocks` : les 81 valeurs ont donc une fiche, et pas seulement les 20 qui
  // sont couvertes par le consensus d'analystes.
  const code = tvSymbol(ticker).split(":")[1]!.toUpperCase();

  const { data: stocks = [] } = useQuery(stocksQuery);
  const { data: fundamentals = [] } = useQuery(fundamentalsQuery);
  const { data: history = [], isLoading: historyLoading } = useQuery(quoteHistoryQuery(code));

  const fetchQuotes = useServerFn(getLiveQuotes);
  const { data: quotes = [] } = useQuery({
    queryKey: ["cse-quotes"],
    queryFn: () => fetchQuotes(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const stock = useMemo(
    () => stocks.find((s) => tvSymbol(s.ticker).split(":")[1]!.toUpperCase() === code) ?? null,
    [stocks, code],
  );
  const fund = useMemo(
    () => fundamentals.find((x) => x.ticker.toUpperCase() === code) ?? null,
    [fundamentals, code],
  );
  const live = quotes.find((q) => q.ticker.toUpperCase() === code) ?? null;

  const listed = NAME_BY_CODE.has(code);
  const name = stock?.name ?? fund?.name ?? NAME_BY_CODE.get(code) ?? code;
  const price = live?.price ?? (stock ? Number(stock.price) : null);
  const changePct = live?.changePct ?? (stock ? Number(stock.change_pct) : null);

  if (!listed && !stock) {
    return (
      <div className="space-y-4">
        <Back t={t} />
        <p className="text-sm text-muted-foreground">{t("stock.notFound")}</p>
      </div>
    );
  }

  // Tout ce qui dépend du cours est recalculé au prix du jour : PER, rendement
  // et capitalisation bougent avec le marché, seuls BPA et DPA sont figés.
  const n = (v: unknown) => (v === null || v === undefined ? null : Number(v));
  const bpa25 = n(fund?.bpa_2025);
  const bpa26 = n(fund?.bpa_2026e);
  const dpa25 = n(fund?.dpa_2025);
  const dpa26 = n(fund?.dpa_2026e);
  const per = (bpa: number | null) => (price && bpa && bpa > 0 ? price / bpa : null);
  const dy = (dpa: number | null) =>
    price && price > 0 && dpa !== null ? (dpa / price) * 100 : null;
  const marketCap = fund && price ? price * Number(fund.shares_m) * 1e6 : null;

  const chartData = history.map((h) => ({ date: h.date, close: h.close }));
  const enoughHistory = chartData.length >= 2;

  return (
    <div className="space-y-8">
      <Back t={t} />

      <header className="rise flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">
            {code}
            {stock?.sector ? ` · ${stock.sector}` : " · BVC"}
          </p>
          <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{name}</h1>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold tabular-nums text-brand-yellow sm:text-4xl">
            {price === null ? EMPTY : f.price(price)}
          </p>
          <p
            className={`mt-1 text-sm tabular-nums ${
              (changePct ?? 0) >= 0 ? "text-[var(--success)]" : "text-destructive"
            }`}
          >
            {changePct === null ? EMPTY : f.pct(changePct)}
          </p>
        </div>
      </header>

      {/* ------------------------------------------------------- graphique */}
      <section className="glass glass-gold overflow-hidden p-4 sm:p-5">
        {enoughHistory ? (
          <PriceChart data={chartData} label={name} />
        ) : (
          <EmptyChart loading={historyLoading} points={chartData.length} t={t} />
        )}
      </section>

      {/* --------------------------------------------- données fondamentales */}
      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold">{t("stock.valuation")}</h2>
          <p className="text-xs text-muted-foreground">{t("stock.liveNote")}</p>
        </div>

        {fund ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Metric
              label={t("stock.marketCap")}
              value={marketCap ? f.compact(marketCap) : EMPTY}
              live
            />
            <Metric label={t("stock.eps25")} value={f.num(bpa25)} />
            <Metric label={t("stock.eps26")} value={f.num(bpa26)} />
            <Metric label={t("stock.dps25")} value={f.num(dpa25)} />
            <Metric label={t("stock.dps26")} value={f.num(dpa26)} />
            <Metric label={t("stock.per25")} value={fmtX(f.num(per(bpa25), 1))} live />
            <Metric label={t("stock.per26")} value={fmtX(f.num(per(bpa26), 1))} live />
            <Metric label={t("stock.dy25")} value={fmtPct(f.num(dy(dpa25), 2))} live />
            <Metric label={t("stock.dy26")} value={fmtPct(f.num(dy(dpa26), 2))} live />
          </div>
        ) : (
          <p className="glass mt-4 p-5 text-sm leading-relaxed text-muted-foreground">
            {t("stock.noFundamentals")}
          </p>
        )}
      </section>

      {stock?.description && (
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {stock.description}
        </p>
      )}

      <Disclaimer />
    </div>
  );
}

/** Une carte de la grille fondamentale. `live` marque ce qui suit le cours. */
function Metric({ label, value, live }: { label: string; value: string; live?: boolean }) {
  return (
    <div className="glass card-hover p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        {live && (
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand-yellow)]"
          />
        )}
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums text-brand-yellow">{value}</p>
    </div>
  );
}

const fmtX = (v: string) => (v === EMPTY ? v : `${v}x`);
const fmtPct = (v: string) => (v === EMPTY ? v : `${v} %`);

/**
 * L'historique se constitue une séance à la fois. Tant qu'il n'y a pas deux
 * points, mieux vaut le dire que tracer une ligne inventée : la table héritée
 * `stock_prices` est synthétique et n'a rien à faire dans un graphique de cours.
 */
function EmptyChart({ loading, points, t }: { loading: boolean; points: number; t: Translate }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <LineChart className="h-7 w-7 text-muted-foreground" />
      <p className="text-sm font-medium">
        {loading ? t("common.loading") : t("stock.historyBuilding")}
      </p>
      {!loading && (
        <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
          {t("stock.historyExplain", { points })}
        </p>
      )}
    </div>
  );
}

function Back({ t }: { t: Translate }) {
  return (
    <Link
      to="/bourse"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" /> {t("stock.back")}
    </Link>
  );
}

// Référencé pour que le typage des clés reste vérifié à la compilation.
export type _Keys = Key;
