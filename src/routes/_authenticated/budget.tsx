import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Disclaimer } from "@/components/Disclaimer";
import { useFormat } from "@/lib/format";
import { useI18n, usePageTitle, type Key } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/budget")({
  head: () => ({
    meta: [
      { title: "Simulateur d'intérêts composés | Lyamfi" },
      {
        name: "description",
        content:
          "Projette ton épargne mensuelle en dirhams et visualise l'effet des intérêts composés selon ton profil de risque.",
      },
      { property: "og:title", content: "Budget et intérêts composés | Lyamfi" },
      { property: "og:description", content: "Versements et intérêts cumulés, sur 1 à 40 ans." },
    ],
  }),
  component: BudgetPage,
});

const PROFILES = [
  { id: "prudent", label: "budget.prudent", rate: 3.5, text: "budget.prudentRate" },
  { id: "modere", label: "budget.balanced", rate: 6.5, text: "budget.balancedRate" },
  { id: "dynamique", label: "budget.dynamic", rate: 9.5, text: "budget.dynamicRate" },
] as const satisfies readonly { id: string; label: Key; rate: number; text: Key }[];

function BudgetPage() {
  const { t } = useI18n();
  const f = useFormat();
  usePageTitle("budget.title");

  const [monthly, setMonthly] = useState(1000);
  const [years, setYears] = useState(20);
  const [profile, setProfile] = useState<(typeof PROFILES)[number]["id"]>("modere");

  const rate = PROFILES.find((p) => p.id === profile)!.rate;

  const data = useMemo(() => {
    const r = rate / 100 / 12;
    const out = [];
    let capital = 0;
    for (let y = 0; y <= years; y++) {
      if (y > 0) {
        for (let m = 0; m < 12; m++) capital = capital * (1 + r) + monthly;
      }
      const versed = monthly * 12 * y;
      out.push({ year: y, compound: Math.round(capital), plain: versed });
    }
    return out;
  }, [monthly, years, rate]);

  const last = data[data.length - 1]!;
  const final = last.compound;
  const versed = last.plain;

  return (
    <div className="space-y-8">
      <header className="rise">
        <h1 className="text-3xl font-bold sm:text-4xl">{t("budget.title")}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t("budget.intro")}
        </p>
      </header>

      <Disclaimer />

      <section className="surface-raised grid gap-7 p-6 sm:p-8 lg:grid-cols-3">
        <div>
          <label className="text-xs text-muted-foreground">{t("budget.monthly")}</label>
          <input
            type="number"
            min={100}
            step={100}
            value={monthly}
            onChange={(e) => setMonthly(Math.max(0, Number(e.target.value)))}
            className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <input
            type="range"
            min={100}
            max={20000}
            step={100}
            value={monthly}
            onChange={(e) => setMonthly(Number(e.target.value))}
            className="mt-3 w-full accent-[var(--gold)]"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">{t("budget.duration", { years })}</label>
          <input
            type="range"
            min={1}
            max={40}
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="mt-6 w-full accent-[var(--gold)]"
          />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t("budget.riskLevel")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {PROFILES.map((p) => (
              <button
                key={p.id}
                onClick={() => setProfile(p.id)}
                className={`rounded-xl border px-3.5 py-2 text-xs transition-colors ${
                  profile === p.id
                    ? "border-primary/60 bg-accent text-accent-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(p.label)}
                <span className="block text-[10px] opacity-70">{t(p.text)}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="surface-raised p-5 sm:p-7">
        <h2 className="text-sm font-semibold">{t("budget.growth")}</h2>
        <div className="mt-5 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="compFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="year"
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => t("budget.yearShort", { n: v })}
              />
              <YAxis
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={80}
                tickFormatter={(v: number) => `${f.num(Math.round(v / 1000), 0)} k`}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v: number) => f.mad(v, 0)}
                labelFormatter={(l) => t("budget.year", { n: String(l) })}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area
                name={t("budget.withCompound")}
                type="monotone"
                dataKey="compound"
                stroke="var(--gold)"
                strokeWidth={2.5}
                fill="url(#compFill)"
              />
              <Area
                name={t("budget.simpleSaving")}
                type="monotone"
                dataKey="plain"
                stroke="var(--muted-foreground)"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                fill="transparent"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="surface-raised p-6">
          <p className="text-xs text-muted-foreground">{t("budget.finalCapital")}</p>
          <p className="mt-3 text-3xl font-bold tabular-nums text-gradient-gold">
            {f.mad(final, 0)}
          </p>
        </div>
        <div className="surface-raised p-6">
          <p className="text-xs text-muted-foreground">{t("budget.totalPaid")}</p>
          <p className="mt-3 text-3xl font-bold tabular-nums">{f.mad(versed, 0)}</p>
        </div>
        <div className="surface-raised p-6">
          <p className="text-xs text-muted-foreground">{t("budget.interestEarned")}</p>
          <p className="mt-3 text-3xl font-bold tabular-nums text-gradient-gold">
            {f.mad(final - versed, 0)}
          </p>
        </div>
      </section>
    </div>
  );
}
