import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { leaderboardQuery, type LeaderboardRow } from "@/lib/leaderboard";
import { GoldenGoat } from "@/components/GoldenGoat";
import { EMPTY, useFormat } from "@/lib/format";
import { useI18n, usePageTitle } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/classement")({
  head: () => ({
    meta: [
      { title: "Classement des portefeuilles | Lyamfi" },
      {
        name: "description",
        content:
          "Classement des portefeuilles virtuels Lyamfi, du meilleur rendement au moins bon.",
      },
      { property: "og:title", content: "Classement | Lyamfi" },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const { t } = useI18n();
  const f = useFormat();
  usePageTitle("lb.title");

  const { data: rows = [], isLoading, error } = useQuery(leaderboardQuery);
  const you = rows.find((r) => r.is_self) ?? null;

  return (
    <div className="space-y-8">
      <header className="rise">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-[var(--brand-yellow)]" />
          <h1 className="text-3xl font-bold sm:text-4xl">{t("lb.title")}</h1>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t("lb.subtitle")}
        </p>
      </header>

      {error && (
        <p className="glass p-5 text-sm text-destructive">
          {t("lb.error", { reason: (error as Error).message })}
        </p>
      )}

      {!error && rows.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-2">
          <Kpi label={t("lb.participants")} value={String(rows.length)} />
          <Kpi
            label={t("lb.yourRank")}
            value={you ? `#${you.rank}` : EMPTY}
            hint={you ? f.pct(you.performance) : t("lb.emptyHint")}
          />
        </section>
      )}

      <section className="glass overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">{t("lb.loading")}</p>
        ) : rows.length === 0 ? (
          <div className="space-y-2 p-8 text-center">
            <p className="text-sm font-medium">{t("lb.empty")}</p>
            <p className="text-xs text-muted-foreground">{t("lb.emptyHint")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b border-white/10">
                  <th className="w-16 px-5 py-3 text-left font-medium sm:px-6">
                    {t("lb.colRank")}
                  </th>
                  <th className="px-3 py-3 text-left font-medium">{t("lb.colName")}</th>
                  <th className="px-3 py-3 text-right font-medium">{t("lb.colTrades")}</th>
                  <th className="px-5 py-3 text-right font-medium sm:px-6">{t("lb.colPerf")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <Row
                    key={`${row.rank}-${row.name}`}
                    row={row}
                    youLabel={t("lb.you")}
                    goatLabel={t("lb.goat")}
                    pct={f.pct}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs leading-relaxed text-muted-foreground">{t("lb.note")}</p>
    </div>
  );
}

function Row({
  row,
  youLabel,
  goatLabel,
  pct,
}: {
  row: LeaderboardRow;
  youLabel: string;
  goatLabel: string;
  pct: (v: number, digits?: number) => string;
}) {
  // Les trois premiers portent l'or de la marque, le premier un peu plus fort.
  const podium = row.rank <= 3;
  const first = row.rank === 1;

  return (
    <tr
      className={`border-b border-white/[0.06] last:border-0 ${
        row.is_self ? "bg-[var(--brand-yellow)]/[0.06]" : ""
      }`}
    >
      <td className="px-5 py-4 sm:px-6">
        <span
          className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold tabular-nums ${
            first
              ? "bg-gradient-gold text-primary-foreground"
              : podium
                ? "border border-[var(--brand-yellow)]/50 text-brand-yellow"
                : "border border-border text-muted-foreground"
          }`}
        >
          {row.rank}
        </span>
      </td>
      <td className="px-3 py-4">
        <span className={`font-medium ${podium ? "text-brand-yellow" : ""}`}>{row.name}</span>
        {first && <GoldenGoat className="ml-2" />}
        {first && <span className="sr-only">{goatLabel}</span>}
        {row.is_self && (
          <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
            {youLabel}
          </span>
        )}
      </td>
      <td className="px-3 py-4 text-right tabular-nums text-muted-foreground">{row.trades}</td>
      <td
        className={`px-5 py-4 text-right font-semibold tabular-nums sm:px-6 ${
          row.performance >= 0 ? "text-[var(--success)]" : "text-destructive"
        }`}
      >
        {pct(row.performance)}
      </td>
    </tr>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="glass p-6">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-3 text-2xl font-bold tabular-nums text-brand-yellow">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
