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
import { mad } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/budget")({
  head: () => ({
    meta: [
      { title: "Simulateur d'intérêts composés — Lyamfi" },
      {
        name: "description",
        content:
          "Projette ton épargne mensuelle en dirhams et visualise l'effet des intérêts composés selon ton profil de risque.",
      },
      { property: "og:title", content: "Budget & intérêts composés — Lyamfi" },
      { property: "og:description", content: "Versements vs intérêts cumulés, sur 1 à 40 ans." },
    ],
  }),
  component: BudgetPage,
});

const PROFILES = [
  { id: "prudent", label: "Prudent", rate: 3.5, text: "≈ 3–4 % par an" },
  { id: "modere", label: "Modéré", rate: 6.5, text: "≈ 6–7 % par an" },
  { id: "dynamique", label: "Dynamique", rate: 9.5, text: "≈ 9–10 % par an" },
] as const;

function BudgetPage() {
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
      out.push({
        year: y,
        "Avec intérêts composés": Math.round(capital),
        "Épargne simple": versed,
      });
    }
    return out;
  }, [monthly, years, rate]);

  const last = data[data.length - 1]!;
  const final = last["Avec intérêts composés"];
  const versed = last["Épargne simple"];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold sm:text-4xl">Budget & intérêts composés</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Combien peut valoir une épargne régulière au fil du temps ? Les taux proposés sont des
          hypothèses pédagogiques, pas des promesses de rendement.
        </p>
      </header>

      <Disclaimer />

      <section className="surface-card grid gap-7 p-6 sm:p-8 lg:grid-cols-3">
        <div>
          <label className="text-xs text-muted-foreground">Montant investi par mois (MAD)</label>
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
          <label className="text-xs text-muted-foreground">Durée : {years} ans</label>
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
          <p className="text-xs text-muted-foreground">Niveau de risque</p>
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
                {p.label}
                <span className="block text-[10px] opacity-70">{p.text}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="surface-card p-5 sm:p-7">
        <h2 className="text-sm font-semibold">Croissance du capital</h2>
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
                tickFormatter={(v: number) => `${v} a`}
              />
              <YAxis
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={80}
                tickFormatter={(v: number) => `${Math.round(v / 1000)} k`}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v: number) => `${v.toLocaleString("fr-MA")} MAD`}
                labelFormatter={(l) => `Année ${l}`}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area
                type="monotone"
                dataKey="Avec intérêts composés"
                stroke="var(--gold)"
                strokeWidth={2.5}
                fill="url(#compFill)"
              />
              <Area
                type="monotone"
                dataKey="Épargne simple"
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
        <div className="surface-card p-6">
          <p className="text-xs text-muted-foreground">Capital final</p>
          <p className="mt-3 text-3xl font-bold text-gradient-gold">{mad(final, 0)}</p>
        </div>
        <div className="surface-card p-6">
          <p className="text-xs text-muted-foreground">Total versé</p>
          <p className="mt-3 text-3xl font-bold">{mad(versed, 0)}</p>
        </div>
        <div className="surface-card p-6">
          <p className="text-xs text-muted-foreground">Intérêts générés</p>
          <p className="mt-3 text-3xl font-bold text-gradient-gold">{mad(final - versed, 0)}</p>
        </div>
      </section>
    </div>
  );
}
