import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { toast } from "sonner";
import { Disclaimer } from "@/components/Disclaimer";
import { supabase } from "@/integrations/supabase/client";
import { stocksQuery, type Stock } from "@/lib/market";
import { num } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/portefeuille")({
  head: () => ({
    meta: [
      { title: "Simulateur de portefeuille BVC — Lyamfi" },
      {
        name: "description",
        content:
          "Construis un portefeuille virtuel de valeurs marocaines et mesure sa diversification, son rendement pondéré et son dividend yield moyen.",
      },
      { property: "og:title", content: "Simulateur de portefeuille — Lyamfi" },
      { property: "og:description", content: "Allocation, concentration sectorielle et performance simulée." },
    ],
  }),
  component: PortfolioPage,
});

const COLORS = ["#F0C24B", "#F5E14C", "#D9A441", "#E8A73F", "#C08A2E", "#FFF0A0", "#A9762A", "#8C5F1F"];

type Row = { stock: Stock; weight: number };

function PortfolioPage() {
  const qc = useQueryClient();
  const { data: stocks = [] } = useQuery(stocksQuery);

  const { data: saved } = useQuery({
    queryKey: ["portfolio"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      const uid = user.user?.id;
      if (!uid) return { id: null as string | null, positions: [] as { stock_id: string; weight: number }[] };
      let { data: pf } = await supabase
        .from("portfolios")
        .select("id")
        .eq("user_id", uid)
        .limit(1)
        .maybeSingle();
      if (!pf) {
        const { data: created, error } = await supabase
          .from("portfolios")
          .insert({ user_id: uid })
          .select("id")
          .single();
        if (error) throw error;
        pf = created;
      }
      const { data: pos } = await supabase
        .from("portfolio_positions")
        .select("stock_id, weight")
        .eq("portfolio_id", pf.id);
      return {
        id: pf.id,
        positions: (pos ?? []).map((p) => ({ stock_id: p.stock_id, weight: Number(p.weight) })),
      };
    },
  });

  const [rows, setRows] = useState<Row[] | null>(null);
  const effectiveRows: Row[] =
    rows ??
    (saved?.positions ?? [])
      .map((p) => {
        const s = stocks.find((x) => x.id === p.stock_id);
        return s ? { stock: s, weight: p.weight } : null;
      })
      .filter((r): r is Row => r !== null);

  const [picker, setPicker] = useState("");

  const total = effectiveRows.reduce((a, r) => a + r.weight, 0);

  const stats = useMemo(() => {
    if (!effectiveRows.length || total === 0) return null;
    const norm = effectiveRows.map((r) => ({ ...r, w: r.weight / total }));
    const dy = norm.reduce((a, r) => a + r.w * Number(r.stock.dividend_yield ?? 0), 0);
    const perf = norm.reduce((a, r) => a + r.w * Number(r.stock.change_pct ?? 0), 0);
    const upside = norm.reduce((a, r) => {
      const p = Number(r.stock.price);
      const t = Number(r.stock.target_price ?? p);
      return a + r.w * ((t - p) / p) * 100;
    }, 0);
    const bySector = new Map<string, number>();
    norm.forEach((r) => bySector.set(r.stock.sector, (bySector.get(r.stock.sector) ?? 0) + r.w));
    const sectors = [...bySector.entries()].sort((a, b) => b[1] - a[1]);
    const hhi = norm.reduce((a, r) => a + r.w * r.w, 0);
    const sectorHHI = sectors.reduce((a, [, w]) => a + w * w, 0);
    const score = Math.round(
      Math.max(0, Math.min(100, (1 - (hhi * 0.5 + sectorHHI * 0.5)) * 125)),
    );
    return { dy, perf, upside, sectors, score, topSector: sectors[0] };
  }, [effectiveRows, total]);

  const pieData = effectiveRows.map((r) => ({
    name: r.stock.ticker,
    value: total ? (r.weight / total) * 100 : 0,
  }));

  const perfData = useMemo(() => {
    const annual = stats ? stats.perf * 12 + stats.dy : 0;
    return Array.from({ length: 11 }, (_, y) => ({
      year: `A${y}`,
      portefeuille: Math.round(100000 * Math.pow(1 + annual / 100, y)),
      neutre: 100000,
    }));
  }, [stats]);

  const save = useMutation({
    mutationFn: async () => {
      if (!saved?.id) throw new Error("Portefeuille introuvable");
      await supabase.from("portfolio_positions").delete().eq("portfolio_id", saved.id);
      if (effectiveRows.length) {
        const { error } = await supabase.from("portfolio_positions").insert(
          effectiveRows.map((r) => ({
            portfolio_id: saved.id!,
            stock_id: r.stock.id,
            weight: r.weight,
          })),
        );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Portefeuille enregistré");
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addStock = (id: string) => {
    const s = stocks.find((x) => x.id === id);
    if (!s || effectiveRows.some((r) => r.stock.id === id)) return;
    setRows([...effectiveRows, { stock: s, weight: 10 }]);
    setPicker("");
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold sm:text-4xl">Simulateur de portefeuille</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Choisis des valeurs de la BVC et leur pondération. Les indicateurs se recalculent
          instantanément.
        </p>
      </header>

      <Disclaimer />

      <section className="surface-card p-5 sm:p-7">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <select
            value={picker}
            onChange={(e) => addStock(e.target.value)}
            className="min-w-0 rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          >
            <option value="">Ajouter une valeur…</option>
            {stocks
              .filter((s) => !effectiveRows.some((r) => r.stock.id === s.id))
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.ticker} — {s.name}
                </option>
              ))}
          </select>
          <span className="shrink-0 rounded-full bg-muted px-3 py-2 text-xs text-muted-foreground">
            <Plus className="mr-1 inline h-3 w-3" />
            {effectiveRows.length} ligne(s)
          </span>
        </div>

        <ul className="mt-6 space-y-4">
          {effectiveRows.map((r) => (
            <li key={r.stock.id} className="rounded-xl border border-border p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.stock.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.stock.ticker} · {r.stock.sector}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="w-14 text-right text-sm font-semibold text-gradient-gold">
                    {r.weight} %
                  </span>
                  <button
                    onClick={() => setRows(effectiveRows.filter((x) => x.stock.id !== r.stock.id))}
                    className="rounded-lg border border-border p-2 text-muted-foreground hover:text-destructive"
                    aria-label="Retirer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={r.weight}
                onChange={(e) =>
                  setRows(
                    effectiveRows.map((x) =>
                      x.stock.id === r.stock.id ? { ...x, weight: Number(e.target.value) } : x,
                    ),
                  )
                }
                className="mt-3 w-full accent-[var(--gold)]"
              />
            </li>
          ))}
          {effectiveRows.length === 0 && (
            <li className="text-sm text-muted-foreground">
              Aucune ligne. Ajoute une première valeur pour lancer la simulation.
            </li>
          )}
        </ul>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <p className="text-xs text-muted-foreground">
            Total pondérations : <span className="font-semibold text-foreground">{total} %</span>
            {total !== 100 && total > 0 && " (normalisé automatiquement dans les calculs)"}
          </p>
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="ml-auto rounded-full bg-gradient-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {save.isPending ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </section>

      {stats && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Score de diversification" value={`${stats.score}/100`} />
            <Kpi label="Dividend yield moyen" value={`${num(stats.dy, 2)} %`} />
            <Kpi label="Rendement pondéré (jour)" value={`${num(stats.perf, 2)} %`} />
            <Kpi label="Upside pondéré" value={`${num(stats.upside, 1)} %`} />
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="surface-card p-5 sm:p-7">
              <h2 className="text-sm font-semibold">Allocation</h2>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="55%"
                      outerRadius="80%"
                      paddingAngle={2}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      formatter={(v: number) => `${v.toFixed(1)} %`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="surface-card p-5 sm:p-7">
              <h2 className="text-sm font-semibold">Concentration sectorielle</h2>
              <ul className="mt-5 space-y-3">
                {stats.sectors.map(([sec, w], i) => (
                  <li key={sec}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="truncate text-muted-foreground">{sec}</span>
                      <span className="font-medium">{(w * 100).toFixed(1)} %</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${w * 100}%`, background: COLORS[i % COLORS.length] }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              {stats.topSector && stats.topSector[1] > 0.5 && (
                <p className="mt-5 text-xs text-destructive">
                  Attention : plus de 50 % du portefeuille sur « {stats.topSector[0]} ».
                </p>
              )}
            </div>
          </section>

          <section className="surface-card p-5 sm:p-7">
            <h2 className="text-sm font-semibold">
              Performance simulée sur 10 ans (hypothèse pédagogique, base 100 000 MAD)
            </h2>
            <div className="mt-5 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={perfData}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="year"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={70}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="portefeuille"
                    stroke="var(--gold)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="neutre"
                    stroke="var(--muted-foreground)"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card p-6">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-3 text-3xl font-bold text-gradient-gold">{value}</p>
    </div>
  );
}
