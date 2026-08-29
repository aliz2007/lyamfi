import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Landmark, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Disclaimer } from "@/components/Disclaimer";
import { simulateCredit } from "@/lib/credit";
import { EMPTY, useFormat } from "@/lib/format";
import { useI18n, usePageTitle, type Key } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/simulateurs")({
  head: () => ({
    meta: [
      { title: "Simulateurs : intérêts composés et crédit | Lyamfi" },
      {
        name: "description",
        content:
          "Projette ton épargne avec les intérêts composés, et calcule le coût réel d'un crédit au Maroc : mensualité, coût total et TAEG.",
      },
      { property: "og:title", content: "Simulateurs | Lyamfi" },
      {
        property: "og:description",
        content: "Intérêts composés sur 1 à 40 ans, et la véritable facture d'un crédit.",
      },
    ],
  }),
  component: SimulatorsPage,
});

const PROFILES = [
  { id: "prudent", label: "budget.prudent", rate: 3.5, text: "budget.prudentRate" },
  { id: "modere", label: "budget.balanced", rate: 6.5, text: "budget.balancedRate" },
  { id: "dynamique", label: "budget.dynamic", rate: 9.5, text: "budget.dynamicRate" },
] as const satisfies readonly { id: string; label: Key; rate: number; text: Key }[];

function SimulatorsPage() {
  const { t } = useI18n();
  const f = useFormat();
  usePageTitle("sim.title");

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
        <h1 className="text-3xl font-bold sm:text-4xl">{t("sim.title")}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t("sim.intro")}
        </p>
      </header>

      <Disclaimer />

      {/* ------------------------------------------- intérêts composés */}
      <div className="flex items-center gap-2 pt-2">
        <TrendingUp className="h-5 w-5 text-[var(--brand-yellow)]" />
        <h2 className="text-xl font-semibold sm:text-2xl">{t("sim.investTitle")}</h2>
      </div>
      <p className="-mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        {t("budget.intro")}
      </p>

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

      <div className="hairline" aria-hidden="true" />

      <CreditSimulator />
    </div>
  );
}

/* ------------------------------------------------------ simulateur de crédit */

/** Moyenne de marché marocaine pour l'assurance et les frais de dossier. */
const DEFAULT_FEES = 300;

function CreditSimulator() {
  const { t } = useI18n();
  const f = useFormat();

  const [amount, setAmount] = useState(300000);
  const [rate, setRate] = useState(5);
  const [years, setYears] = useState(20);
  const [fees, setFees] = useState(DEFAULT_FEES);

  const result = useMemo(
    () => simulateCredit({ amount, annualRate: rate, years, monthlyFees: fees }),
    [amount, rate, years, fees],
  );

  // La part « capital » est en or : c'est la seule qui n'est pas un coût, et la
  // comparer d'un coup d'œil au reste est tout l'intérêt du graphique.
  const slices = result
    ? [
        { key: "sim.partCapital", value: amount, color: "var(--gold)" },
        { key: "sim.partInterest", value: result.totalInterest, color: "var(--destructive)" },
        { key: "sim.partFees", value: result.totalFees, color: "var(--muted-foreground)" },
      ].filter((s) => s.value > 0)
    : [];

  return (
    <>
      <div className="flex items-center gap-2 pt-2">
        <Landmark className="h-5 w-5 text-[var(--brand-yellow)]" />
        <h2 className="text-xl font-semibold sm:text-2xl">{t("sim.creditTitle")}</h2>
      </div>

      {/* Le propos avant l'outil : sans lui, un TAEG plus élevé que le taux
          affiché passe pour une erreur de calcul plutôt que pour le sujet. */}
      <section className="surface-raised glass-gold -mt-4 p-5 sm:p-7">
        <p className="max-w-4xl text-sm leading-relaxed text-muted-foreground">
          {t("sim.creditIntro")}
        </p>
      </section>

      <section className="surface-raised grid gap-6 p-6 sm:p-8 lg:grid-cols-4">
        <Field
          id="credit-amount"
          label={t("sim.amount")}
          value={amount}
          min={10000}
          max={5000000}
          step={10000}
          onChange={setAmount}
          suffix="MAD"
        />
        <Field
          id="credit-rate"
          label={t("sim.rate")}
          value={rate}
          min={0}
          max={20}
          step={0.1}
          onChange={setRate}
          suffix="%"
        />
        <Field
          id="credit-years"
          label={t("sim.duration")}
          value={years}
          min={1}
          max={30}
          step={1}
          onChange={setYears}
          suffix={t("sim.yearsUnit")}
        />
        <Field
          id="credit-fees"
          label={t("sim.fees")}
          value={fees}
          min={0}
          max={3000}
          step={50}
          onChange={setFees}
          suffix="MAD"
          hint={t("sim.feesHint", { amount: String(DEFAULT_FEES) })}
        />
      </section>

      {result && (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <Result
              label={t("sim.monthlyAllIn")}
              value={f.mad(result.monthlyAllIn, 0)}
              hint={t("sim.monthlyDetail", {
                loan: f.mad(result.monthly, 0),
                fees: f.mad(fees, 0),
              })}
            />
            <Result
              label={t("sim.totalCost")}
              value={f.mad(result.totalCost, 0)}
              hint={t("sim.costRatio", { pct: f.num(result.costRatioPct, 1) })}
              tone="cost"
            />
            <Result
              label={t("sim.apr")}
              value={result.aprPct === null ? EMPTY : `${f.num(result.aprPct, 2)} %`}
              hint={t("sim.aprHint", { nominal: f.num(rate, 2) })}
            />
          </section>

          <section className="surface-raised grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div>
              <h3 className="text-sm font-semibold">{t("sim.breakdown")}</h3>
              <dl className="mt-5 space-y-3 text-sm">
                {slices.map((s) => (
                  <div
                    key={s.key}
                    className="flex items-center justify-between gap-4 border-b border-border/40 pb-2.5 last:border-0"
                  >
                    <dt className="flex items-center gap-2.5 text-muted-foreground">
                      <span
                        aria-hidden="true"
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      {t(s.key as Key)}
                    </dt>
                    <dd className="tabular-nums font-medium">{f.mad(s.value, 0)}</dd>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-4 pt-1">
                  <dt className="font-medium">{t("sim.totalPaid")}</dt>
                  <dd className="text-lg font-bold tabular-nums text-gradient-gold">
                    {f.mad(result.totalPaid, 0)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slices.map((s) => ({ name: t(s.key as Key), value: s.value }))}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="58%"
                    outerRadius="88%"
                    paddingAngle={2}
                    stroke="var(--background)"
                    strokeWidth={2}
                  >
                    {slices.map((s) => (
                      <Cell key={s.key} fill={s.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => f.mad(v, 0)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}
    </>
  );
}

/** Champ chiffré du simulateur : saisie libre doublée d'un curseur. */
function Field({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
  suffix,
  hint,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  suffix: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground" htmlFor={id}>
        {label}
      </label>
      <div className="mt-2 flex items-center gap-2">
        <input
          id={id}
          type="number"
          min={min}
          step={step}
          value={value}
          // Le curseur borne la saisie, pas le clavier : quelqu'un qui simule un
          // crédit hors des bornes courantes doit pouvoir taper son chiffre.
          onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))}
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
        />
        <span className="shrink-0 text-xs text-muted-foreground">{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={Math.min(value, max)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full accent-[var(--gold)]"
        aria-label={label}
      />
      {hint && <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Result({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "cost";
}) {
  return (
    <div className="surface-raised p-6">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`mt-3 text-3xl font-bold tabular-nums ${
          tone === "cost" ? "text-destructive" : "text-gradient-gold"
        }`}
      >
        {value}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{hint}</p>
    </div>
  );
}
