import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Disclaimer } from "@/components/Disclaimer";
import {
  getMacroSeries,
  MACRO_INDICATORS,
  POLICY_RATE_CHECKED,
  type MacroSeries,
} from "@/lib/macro.functions";
import { EMPTY, useFormat, type Formatter } from "@/lib/format";
import { useI18n, usePageTitle, type Key, type Translate } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/macroeconomie")({
  head: () => ({
    meta: [
      { title: "Indicateurs macroéconomiques du Maroc | Lyamfi" },
      {
        name: "description",
        content:
          "Inflation, croissance du PIB, taux directeur, chômage et emploi au Maroc : les chiffres qui situent la Bourse de Casablanca dans son économie.",
      },
      { property: "og:title", content: "Indicateurs macroéconomiques | Lyamfi" },
      {
        property: "og:description",
        content: "Les grands chiffres de l'économie marocaine, en graphiques.",
      },
    ],
  }),
  component: MacroPage,
});

/** Libellés et lien de repli, dans l'ordre d'affichage. */
const LABELS: Record<string, { label: Key; text: Key }> = {
  inflation: { label: "macro.inflation", text: "macro.inflationText" },
  gdp: { label: "macro.gdp", text: "macro.gdpText" },
  policyRate: { label: "macro.rate", text: "macro.rateText" },
  unemployment: { label: "macro.unemployment", text: "macro.unemploymentText" },
  employment: { label: "macro.employment", text: "macro.employmentText" },
};

function MacroPage() {
  const { t } = useI18n();
  const f = useFormat();
  usePageTitle("macro.title");

  const fetchSeries = useServerFn(getMacroSeries);
  const {
    data: series = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["macro-series"],
    queryFn: () => fetchSeries(),
    // Des séries annuelles ne bougent pas dans la journée.
    staleTime: 12 * 60 * 60_000,
    retry: 1,
  });

  const byId = new Map(series.map((s) => [s.id, s]));

  return (
    <div className="space-y-8">
      <Link
        to="/actualites"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-yellow"
      >
        <ArrowLeft className="h-4 w-4" /> {t("macro.back")}
      </Link>

      <header className="rise">
        <h1 className="text-3xl font-bold sm:text-4xl">{t("macro.title")}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {t("macro.intro")}
        </p>
      </header>

      {error && (
        <p className="glass p-5 text-sm text-destructive">
          {t("macro.error", { reason: (error as Error).message })}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {MACRO_INDICATORS.map((indicator) => (
          <IndicatorCard
            key={indicator.id}
            labels={LABELS[indicator.id]!}
            series={byId.get(indicator.id) ?? null}
            loading={isLoading}
            href={`https://www.tradingview.com/symbols/${indicator.tv}/`}
            // L'avertissement suit la source RÉELLEMENT servie : tant que le
            // FMI répond, la série est automatique et rien n'est à signaler.
            checkedAt={byId.get(indicator.id)?.source === "manual" ? POLICY_RATE_CHECKED : null}
            stepped={indicator.id === "policyRate"}
            t={t}
            f={f}
          />
        ))}
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">{t("macro.source")}</p>

      <Disclaimer />
    </div>
  );
}

/**
 * Une carte par indicateur : la dernière valeur en grand, l'écart avec l'année
 * précédente, puis la série tracée. Le lien TradingView reste offert pour la
 * version mensuelle et interactive, que seul leur site sert.
 */
function IndicatorCard({
  labels,
  series,
  loading,
  href,
  checkedAt,
  stepped,
  t,
  f,
}: {
  labels: { label: Key; text: Key };
  series: MacroSeries | null;
  loading: boolean;
  href: string;
  checkedAt: string | null;
  stepped: boolean;
  t: Translate;
  f: Formatter;
}) {
  const points = series?.points ?? [];
  const last = points[points.length - 1] ?? null;
  const previous = points[points.length - 2] ?? null;
  const delta = last && previous ? last.value - previous.value : null;
  // L'abscisse est l'année, sauf quand la série porte un repère plus fin :
  // le taux directeur bouge trois fois dans une même année.
  const data = points.map((p) => ({ x: p.label ?? String(p.year), value: p.value }));

  return (
    <section className="glass glass-gold overflow-hidden p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-brand-yellow">{t(labels.label)}</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t(labels.text)}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
            {last ? `${f.num(last.value, 1)} %` : EMPTY}
          </p>
          {last && (
            <p className="text-xs tabular-nums text-muted-foreground">
              {t("macro.asOf", { year: last.label ?? String(last.year) })}
            </p>
          )}
        </div>
      </div>

      {delta !== null && (
        <p
          className={`mt-3 text-xs tabular-nums ${
            delta >= 0 ? "text-[var(--success)]" : "text-destructive"
          }`}
        >
          {t("macro.vsPrevious", {
            delta: `${delta > 0 ? "+" : ""}${f.num(delta, 1)}`,
            year: previous!.label ?? String(previous!.year),
          })}
        </p>
      )}

      {loading ? (
        <p className="mt-6 text-xs text-muted-foreground">{t("macro.loading")}</p>
      ) : points.length < 2 ? (
        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
          {t("macro.unavailable")}
        </p>
      ) : (
        <div className="-mx-2 mt-5 h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`macro-${labels.label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="x"
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                minTickGap={28}
              />
              <YAxis
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={44}
                tickFormatter={(v: number) => `${f.num(v, 0)}`}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v: number) => `${f.num(v, 2)} %`}
                labelFormatter={(l) => String(l)}
              />
              <Area
                name={t(labels.label)}
                // Un taux directeur ne glisse pas d'une décision à l'autre : il
                // tient sa valeur puis saute. La courbe le dit.
                type={stepped ? "stepAfter" : "monotone"}
                dataKey="value"
                stroke="var(--gold)"
                strokeWidth={2.5}
                fill={`url(#macro-${labels.label})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {checkedAt && (
        <p className="mt-4 text-[11px] leading-snug text-muted-foreground">
          {t("macro.handMaintained", { date: checkedAt })}
        </p>
      )}

      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className="mt-4 inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-brand-yellow"
      >
        {t("macro.monthlyOnTradingView")}
        <ExternalLink className="h-3 w-3" />
      </a>
    </section>
  );
}
