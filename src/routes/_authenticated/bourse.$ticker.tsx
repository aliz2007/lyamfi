import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { getLiveQuotes } from "@/lib/quotes.functions";
import { stocksQuery } from "@/lib/market";
import { detailGroups, metricsQuery, LIVE_METRICS, type Metric } from "@/lib/metrics";
import { formatMetric } from "@/components/MetricValue";
import { EMPTY, useFormat, type Formatter } from "@/lib/format";
import { Disclaimer } from "@/components/Disclaimer";
import { TradingViewWidget } from "@/components/TradingViewWidget";
import { CSE_SYMBOLS, tvSymbol } from "@/lib/cse-symbols";
import { ytdOf } from "@/lib/quotation";
import { ShareholdingCard } from "@/components/ShareholdingCard";
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
  const { t, locale } = useI18n();
  const f = useFormat();

  // La route est indexée sur le code de la cote, pas sur le ticker de la table
  // `stocks` : les 81 valeurs ont donc une fiche, et pas seulement les 20 qui
  // sont couvertes par le consensus d'analystes.
  const code = tvSymbol(ticker).split(":")[1]!.toUpperCase();

  const { data: stocks = [] } = useQuery(stocksQuery);
  const { data: metricsByCode } = useQuery(metricsQuery);
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
  const metrics = metricsByCode?.get(code);
  const live = quotes.find((q) => q.ticker.toUpperCase() === code) ?? null;

  const listed = NAME_BY_CODE.has(code);
  // Le libellé de la cote fait foi : la table `stocks` porte encore des raisons
  // sociales périmées, et le classeur est en capitales.
  const name = NAME_BY_CODE.get(code) ?? metrics?.company ?? stock?.name ?? code;
  const price = live?.price ?? (stock ? Number(stock.price) : null);
  const changePct = live?.changePct ?? (stock ? Number(stock.change_pct) : null);
  // ⚠️ La performance annuelle se calcule sur le cours EN DIRECT, jamais sur le
  // repli `stocks.price` que les deux lignes au-dessus acceptent : cette
  // colonne est une graine de juillet 2026 (cf. §5 du HANDOFF), et un écart
  // mesuré depuis le 31/12 contre un cours vieux de deux mois serait un chiffre
  // faux présenté comme une mesure. Sans cotation du jour, pas de ligne.
  const ytd = ytdOf(code, live?.price);

  if (!listed && !stock) {
    return (
      <div className="space-y-4">
        <Back t={t} />
        <p className="text-sm text-muted-foreground">{t("stock.notFound")}</p>
      </div>
    );
  }

  const groups = detailGroups(metrics, price);

  return (
    <div className="space-y-6 sm:space-y-8">
      <Back t={t} />

      <header className="rise flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">
            {code}
            {stock?.sector ? ` · ${stock.sector}` : " · BVC"}
          </p>
          <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{name}</h1>
        </div>
        <div className="text-end">
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
          {/* Le même repère que sur la vignette de la cote, au même endroit et
              avec la même discrétion : trier la liste par performance annuelle
              puis ouvrir la fiche ne doit pas faire disparaître le chiffre qui
              a servi au classement. */}
          {ytd !== null && (
            <p
              title={t("bourse.ytdLabel")}
              aria-label={t("bourse.ytdLabel")}
              className="mt-0.5 whitespace-nowrap text-[11px] tabular-nums text-muted-foreground"
            >
              {f.pct(ytd)} {t("bourse.ytdSuffix")}
            </p>
          )}
        </div>
      </header>

      {/* Fiche en deux colonnes sur grand écran : le graphique garde huit
          douzièmes, l'actionnariat se pose en barre latérale à droite.
          `min-w-0` sur les deux pistes : un nom d'actionnaire long a la même
          vertu expansive qu'un nom de société (cf. §9i), et la colonne de
          droite ne doit pas élargir la page. Les fondamentaux et la
          description ne vivent PAS dans cette grille : logés dans la colonne
          de huit, ils laissaient un vide mort sous la carte d'actionnariat ;
          ils suivent la grille, en pleine largeur. Sur téléphone, tout
          repasse en une seule colonne. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="min-w-0 space-y-6 sm:space-y-8 lg:col-span-8">
          {/* -------------------------------------------------- graphique */}
          {/*
        Graphique TradingView, chargé dans la page. Il apporte l'historique
        complet et les outils d'analyse, ce qu'une série reconstruite depuis
        les fenêtres de performance ne pouvait pas égaler.

        Le reproche d'origine portait sur la LISTE : cliquer une valeur y
        renvoyait vers tradingview.com au lieu d'ouvrir une fiche. Ce point
        reste réglé, les vignettes mènent bien ici.
      */}
          <section className="glass glass-gold overflow-hidden p-2 sm:p-3">
            <TradingViewWidget
              key={`${code}-${locale}`}
              widget="advanced-chart"
              className="h-[460px] w-full sm:h-[520px]"
              config={{
                symbol: `CSEMA:${code}`,
                interval: "D",
                range: "12M",
                timezone: "Africa/Casablanca",
                theme: "dark",
                style: "3",
                locale: locale === "en-GB" ? "en" : locale === "ar-MA" ? "ar" : "fr",
                backgroundColor: "rgba(0, 0, 0, 0)",
                gridColor: "rgba(255, 255, 255, 0.05)",
                hide_side_toolbar: true,
                hide_top_toolbar: false,
                allow_symbol_change: false,
                withdateranges: true,
                save_image: false,
                autosize: true,
              }}
            />
          </section>

          <p className="-mt-4 text-xs text-muted-foreground">{t("stock.historySource")}</p>
        </div>

        {/* Actionnariat : barre latérale sur grand écran, dernière section
            sur téléphone. La carte se suffit à elle-même : sans données
            d'actionnariat pour la valeur, elle affiche sa mention discrète
            et ne casse jamais la page (cf. §9i pour le `min-w-0`). */}
        <div className="min-w-0 lg:col-span-4">
          <ShareholdingCard code={code} />
        </div>
      </div>

      {/* --------------------------------------------- données fondamentales */}
      {/* Pleine largeur, sous la grille : quatre cartes par rangée dès xl. */}
      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold">{t("metric.title")}</h2>
          {groups.length > 0 && (
            <p className="text-xs text-muted-foreground">{t("metric.liveNote")}</p>
          )}
        </div>

        {groups.length === 0 ? (
          <p className="glass mt-4 p-5 text-sm leading-relaxed text-muted-foreground">
            {t("metric.none")}
          </p>
        ) : (
          <div className="mt-5 space-y-7">
            {/* Un groupe vide n'est pas produit, donc pas de titre orphelin. */}
            {groups.map((group) => (
              <div key={group.title}>
                <p className="eyebrow">{t(group.title)}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {group.metrics.map((metric) => (
                    <MetricCard key={metric.label} metric={metric} label={t(metric.label)} f={f} />
                  ))}
                </div>
              </div>
            ))}
          </div>
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

/** Une carte du tableau de bord. Le point jaune marque ce qui suit le cours. */
function MetricCard({ metric, label, f }: { metric: Metric; label: string; f: Formatter }) {
  const live = LIVE_METRICS.has(metric.label);
  return (
    <div className="glass card-hover p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs leading-snug text-muted-foreground">{label}</p>
        {live && (
          <span
            aria-hidden="true"
            className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand-yellow)]"
          />
        )}
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums text-brand-yellow">
        {formatMetric(metric, f)}
      </p>
    </div>
  );
}

function Back({ t }: { t: Translate }) {
  return (
    <Link
      to="/bourse"
      className="press -mx-2 inline-flex min-h-9 items-center gap-1.5 px-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t("stock.back")}
    </Link>
  );
}

// Référencé pour que le typage des clés reste vérifié à la compilation.
export type _Keys = Key;
