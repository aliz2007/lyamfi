import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Search } from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Disclaimer } from "@/components/Disclaimer";
import { supabase } from "@/integrations/supabase/client";
import { getLiveQuotes, type LiveQuote } from "@/lib/quotes.functions";
import { mad, num } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/portefeuille")({
  head: () => ({
    meta: [
      { title: "Portefeuille virtuel BVC en temps réel — Lyamfi" },
      {
        name: "description",
        content:
          "Achète et vends des actions de la Bourse de Casablanca aux cours en direct avec 100 000 MAD virtuels, et compare ta performance au MASI.",
      },
      { property: "og:title", content: "Portefeuille virtuel — Lyamfi" },
      {
        property: "og:description",
        content: "Trading simulé aux cours en direct, plus/moins-values et comparaison au MASI.",
      },
    ],
  }),
  component: PortfolioPage,
});

const START_CAPITAL = 100000;

type Holding = { id: string; ticker: string; quantity: number; avg_price: number };

function PortfolioPage() {
  const qc = useQueryClient();
  const fetchQuotes = useServerFn(getLiveQuotes);

  const { data: quotes = [], isLoading: quotesLoading } = useQuery({
    queryKey: ["cse-quotes"],
    queryFn: () => fetchQuotes(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const quoteMap = useMemo(() => {
    const m = new Map<string, LiveQuote>();
    quotes.forEach((q) => m.set(q.ticker.toUpperCase(), q));
    return m;
  }, [quotes]);

  const masi = quoteMap.get("MASI")?.price ?? null;

  const { data: pf } = useQuery({
    queryKey: ["vportfolio"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Session expirée");

      let { data: p } = await supabase
        .from("portfolios")
        .select("id, cash")
        .eq("user_id", uid)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!p) {
        const { data: created, error } = await supabase
          .from("portfolios")
          .insert({ user_id: uid, cash: START_CAPITAL })
          .select("id, cash")
          .single();
        if (error) throw error;
        p = created;
      }

      const [{ data: holdings }, { data: trades }, { data: snaps }, { data: orders }] =
        await Promise.all([
          supabase
            .from("portfolio_holdings")
            .select("id, ticker, quantity, avg_price")
            .eq("portfolio_id", p.id),
          supabase
            .from("portfolio_trades")
            .select("id, ticker, side, quantity, price, created_at")
            .eq("portfolio_id", p.id)
            .order("created_at", { ascending: false })
            .limit(20),
          supabase
            .from("portfolio_snapshots")
            .select("date, value, masi")
            .eq("portfolio_id", p.id)
            .order("date", { ascending: true }),
          supabase
            .from("portfolio_orders")
            .select("id, ticker, side, quantity, limit_price, status, created_at")
            .eq("portfolio_id", p.id)
            .eq("status", "pending")
            .order("created_at", { ascending: false }),
        ]);

      return {
        id: p.id,
        cash: Number(p.cash),
        holdings: (holdings ?? [])
          .map((h) => ({
            id: h.id,
            ticker: h.ticker,
            quantity: Number(h.quantity),
            avg_price: Number(h.avg_price),
          }))
          .filter((h) => h.quantity > 0) as Holding[],
        trades: trades ?? [],
        orders: (orders ?? []).map((o) => ({
          id: o.id,
          ticker: o.ticker,
          side: o.side as "buy" | "sell",
          quantity: Number(o.quantity),
          limit_price: Number(o.limit_price),
          created_at: o.created_at,
        })),
        snapshots: (snaps ?? []).map((s) => ({
          date: s.date,
          value: Number(s.value),
          masi: s.masi === null ? null : Number(s.masi),
        })),
      };
    },
  });


  const rows = (pf?.holdings ?? []).map((h) => {
    const q = quoteMap.get(h.ticker.toUpperCase());
    const last = q?.price ?? h.avg_price;
    const cost = h.quantity * h.avg_price;
    const value = h.quantity * last;
    return { ...h, name: q?.name ?? h.ticker, last, cost, value, pnl: value - cost, pnlPct: cost ? ((value - cost) / cost) * 100 : 0, dayPct: q?.changePct ?? 0 };
  });

  const invested = rows.reduce((a, r) => a + r.value, 0);
  const cash = pf?.cash ?? START_CAPITAL;
  const totalValue = invested + cash;
  const totalPnl = totalValue - START_CAPITAL;
  const totalPnlPct = (totalPnl / START_CAPITAL) * 100;

  // Enregistre un point de performance par jour (valeur du portefeuille + MASI).
  useEffect(() => {
    if (!pf?.id || quotesLoading || !masi) return;
    const today = new Date().toISOString().slice(0, 10);
    const existing = pf.snapshots.find((s) => s.date === today);
    if (existing && Math.abs(existing.value - totalValue) < 0.01) return;
    void supabase
      .from("portfolio_snapshots")
      .upsert(
        { portfolio_id: pf.id, date: today, value: totalValue, masi },
        { onConflict: "portfolio_id,date" },
      )
      .then(() => qc.invalidateQueries({ queryKey: ["vportfolio"] }));
  }, [pf?.id, pf?.snapshots, totalValue, masi, quotesLoading, qc]);

  const perfData = useMemo(() => {
    const snaps = pf?.snapshots ?? [];
    if (!snaps.length) return [];
    const baseMasi = snaps.find((s) => s.masi)?.masi ?? null;
    return snaps.map((s) => ({
      date: s.date.slice(5),
      portefeuille: Number(((s.value / START_CAPITAL) * 100).toFixed(2)),
      masi: baseMasi && s.masi ? Number(((s.masi / baseMasi) * 100).toFixed(2)) : null,
    }));
  }, [pf?.snapshots]);

  const trade = useMutation({
    mutationFn: async ({
      ticker,
      side,
      quantity,
      price,
    }: {
      ticker: string;
      side: "buy" | "sell";
      quantity: number;
      price: number;
    }) => {
      if (!pf?.id) throw new Error("Portefeuille introuvable");
      if (!(quantity > 0)) throw new Error("Quantité invalide");
      const amount = quantity * price;
      const existing = pf.holdings.find((h) => h.ticker === ticker);

      if (side === "buy") {
        if (amount > pf.cash + 1e-9) throw new Error("Liquidités insuffisantes");
        const newQty = (existing?.quantity ?? 0) + quantity;
        const newAvg = ((existing?.quantity ?? 0) * (existing?.avg_price ?? 0) + amount) / newQty;
        const { error } = await supabase
          .from("portfolio_holdings")
          .upsert(
            { portfolio_id: pf.id, ticker, quantity: newQty, avg_price: newAvg, updated_at: new Date().toISOString() },
            { onConflict: "portfolio_id,ticker" },
          );
        if (error) throw error;
        const { error: cErr } = await supabase
          .from("portfolios")
          .update({ cash: pf.cash - amount })
          .eq("id", pf.id);
        if (cErr) throw cErr;
      } else {
        if (!existing || quantity > existing.quantity + 1e-9)
          throw new Error("Quantité détenue insuffisante");
        const newQty = existing.quantity - quantity;
        const { error } = await supabase
          .from("portfolio_holdings")
          .update({ quantity: newQty, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) throw error;
        const { error: cErr } = await supabase
          .from("portfolios")
          .update({ cash: pf.cash + amount })
          .eq("id", pf.id);
        if (cErr) throw cErr;
      }

      const { error: tErr } = await supabase
        .from("portfolio_trades")
        .insert({ portfolio_id: pf.id, ticker, side, quantity, price });
      if (tErr) throw tErr;
    },
    onSuccess: (_d, v) => {
      toast.success(
        `${v.side === "buy" ? "Achat" : "Vente"} de ${v.quantity} ${v.ticker} à ${num(v.price)} MAD`,
      );
      qc.invalidateQueries({ queryKey: ["vportfolio"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reset = useMutation({
    mutationFn: async () => {
      if (!pf?.id) return;
      await supabase.from("portfolio_holdings").delete().eq("portfolio_id", pf.id);
      await supabase.from("portfolio_trades").delete().eq("portfolio_id", pf.id);
      await supabase.from("portfolio_snapshots").delete().eq("portfolio_id", pf.id);
      await supabase.from("portfolios").update({ cash: START_CAPITAL }).eq("id", pf.id);
    },
    onSuccess: () => {
      toast.success("Portefeuille réinitialisé à 100 000 MAD");
      qc.invalidateQueries({ queryKey: ["vportfolio"] });
    },
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold sm:text-4xl">Portefeuille virtuel</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Tu démarres avec 100 000 MAD fictifs. Les ordres sont exécutés au dernier cours connu de
          la Bourse de Casablanca (TradingView), rafraîchi chaque minute.
        </p>
      </header>

      <Disclaimer />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Valeur totale" value={mad(totalValue, 0)} />
        <Kpi label="Liquidités" value={mad(cash, 0)} />
        <Kpi label="Investi (valorisé)" value={mad(invested, 0)} />
        <Kpi
          label="Plus/moins-value"
          value={`${totalPnl >= 0 ? "+" : ""}${num(totalPnl, 0)} MAD`}
          hint={`${totalPnl >= 0 ? "+" : ""}${num(totalPnlPct, 2)} %`}
          positive={totalPnl >= 0}
        />
      </section>

      <TradePanel
        quotes={quotes}
        loading={quotesLoading}
        cash={cash}
        holdings={pf?.holdings ?? []}
        onTrade={(v) => trade.mutate(v)}
        pending={trade.isPending}
      />

      <section className="surface-card overflow-hidden">
        <div className="flex items-center justify-between p-5 sm:p-7 sm:pb-4">
          <h2 className="text-sm font-semibold">Mes positions</h2>
          <button
            onClick={() => reset.mutate()}
            className="text-xs text-muted-foreground underline-offset-4 hover:text-destructive hover:underline"
          >
            Réinitialiser
          </button>
        </div>

        {rows.length === 0 ? (
          <p className="px-5 pb-6 text-sm text-muted-foreground sm:px-7">
            Aucune position. Passe un premier ordre d'achat ci-dessus.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-y border-border">
                  <th className="px-5 py-3 text-left font-medium sm:px-7">Valeur</th>
                  <th className="px-3 py-3 text-right font-medium">Qté</th>
                  <th className="px-3 py-3 text-right font-medium">Cours d'achat</th>
                  <th className="px-3 py-3 text-right font-medium">Cours actuel</th>
                  <th className="px-3 py-3 text-right font-medium">Valorisation</th>
                  <th className="px-5 py-3 text-right font-medium sm:px-7">+/- value</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border/60 last:border-0">
                    <td className="px-5 py-4 sm:px-7">
                      <p className="font-medium">{r.ticker}</p>
                      <p className="truncate text-xs text-muted-foreground">{r.name}</p>
                    </td>
                    <td className="px-3 py-4 text-right">{num(r.quantity, 0)}</td>
                    <td className="px-3 py-4 text-right">{num(r.avg_price)}</td>
                    <td className="px-3 py-4 text-right">
                      {num(r.last)}
                      <span
                        className={`ml-2 text-xs ${
                          r.dayPct >= 0 ? "text-[var(--success)]" : "text-destructive"
                        }`}
                      >
                        {r.dayPct >= 0 ? "+" : ""}
                        {num(r.dayPct, 2)} %
                      </span>
                    </td>
                    <td className="px-3 py-4 text-right">{num(r.value, 0)}</td>
                    <td
                      className={`px-5 py-4 text-right font-semibold sm:px-7 ${
                        r.pnl >= 0 ? "text-[var(--success)]" : "text-destructive"
                      }`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {r.pnl >= 0 ? (
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5" />
                        )}
                        {num(r.pnl, 0)} MAD
                      </span>
                      <p className="text-xs font-normal">
                        {r.pnl >= 0 ? "+" : ""}
                        {num(r.pnlPct, 2)} %
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="surface-card p-5 sm:p-7">
        <h2 className="text-sm font-semibold">Performance du portefeuille vs MASI (base 100)</h2>
        {perfData.length < 2 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            La courbe se construit jour après jour : un point est enregistré à chaque visite. Reviens
            demain pour comparer ta performance à celle de l'indice MASI.
          </p>
        ) : (
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={perfData}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={32}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  name="Portefeuille"
                  type="monotone"
                  dataKey="portefeuille"
                  stroke="var(--gold)"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  name="MASI"
                  type="monotone"
                  dataKey="masi"
                  stroke="var(--muted-foreground)"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {(pf?.trades ?? []).length > 0 && (
        <section className="surface-card p-5 sm:p-7">
          <h2 className="text-sm font-semibold">Derniers ordres</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {pf!.trades.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 border-b border-border/50 pb-2 last:border-0">
                <span>
                  <span className={t.side === "buy" ? "text-[var(--success)]" : "text-destructive"}>
                    {t.side === "buy" ? "Achat" : "Vente"}
                  </span>{" "}
                  {num(Number(t.quantity), 0)} × {t.ticker}
                </span>
                <span className="text-muted-foreground">
                  {num(Number(t.price))} MAD ·{" "}
                  {new Date(t.created_at).toLocaleDateString("fr-MA")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function TradePanel({
  quotes,
  loading,
  cash,
  holdings,
  onTrade,
  pending,
}: {
  quotes: LiveQuote[];
  loading: boolean;
  cash: number;
  holdings: Holding[];
  onTrade: (v: { ticker: string; side: "buy" | "sell"; quantity: number; price: number }) => void;
  pending: boolean;
}) {
  const [q, setQ] = useState("");
  const [ticker, setTicker] = useState("");
  const [qty, setQty] = useState(10);

  const list = useMemo(
    () =>
      quotes
        .filter((s) => s.ticker !== "MASI")
        .filter(
          (s) =>
            !q ||
            s.ticker.toLowerCase().includes(q.toLowerCase()) ||
            s.name.toLowerCase().includes(q.toLowerCase()),
        )
        .sort((a, b) => a.name.localeCompare(b.name, "fr"))
        .slice(0, 40),
    [quotes, q],
  );

  const selected = quotes.find((s) => s.ticker === ticker) ?? null;
  const held = holdings.find((h) => h.ticker === ticker)?.quantity ?? 0;
  const amount = selected ? selected.price * qty : 0;

  return (
    <section className="surface-card p-5 sm:p-7">
      <h2 className="text-sm font-semibold">Passer un ordre</h2>

      <div className="relative mt-4">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher une action (nom ou ticker)"
          className="w-full rounded-xl border border-input bg-background py-3 pl-11 pr-4 text-sm outline-none focus:border-primary"
        />
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Chargement des cours en direct…</p>
      ) : (
        <div className="mt-4 max-h-56 space-y-1 overflow-y-auto pr-1">
          {list.map((s) => (
            <button
              key={s.ticker}
              onClick={() => setTicker(s.ticker)}
              className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border px-4 py-2.5 text-left transition-colors ${
                ticker === s.ticker
                  ? "border-primary/60 bg-accent"
                  : "border-transparent hover:border-border"
              }`}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{s.name}</span>
                <span className="text-xs text-muted-foreground">{s.ticker}</span>
              </span>
              <span className="text-right">
                <span className="block text-sm font-semibold">{num(s.price)}</span>
                <span
                  className={`text-xs ${
                    s.changePct >= 0 ? "text-[var(--success)]" : "text-destructive"
                  }`}
                >
                  {s.changePct >= 0 ? "+" : ""}
                  {num(s.changePct, 2)} %
                </span>
              </span>
            </button>
          ))}
          {list.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune valeur ne correspond.</p>
          )}
        </div>
      )}

      {selected && (
        <div className="mt-5 rounded-xl border border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{selected.name}</p>
              <p className="text-xs text-muted-foreground">
                Cours en direct : {num(selected.price)} MAD · détenu : {num(held, 0)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground" htmlFor="qty">
                Quantité
              </label>
              <input
                id="qty"
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                className="w-24 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Montant de l'ordre : <span className="font-semibold text-foreground">{mad(amount, 2)}</span>{" "}
            · liquidités disponibles : {mad(cash, 2)}
          </p>

          <div className="mt-4 flex gap-3">
            <button
              disabled={pending || amount > cash}
              onClick={() => onTrade({ ticker: selected.ticker, side: "buy", quantity: qty, price: selected.price })}
              className="flex-1 rounded-full bg-gradient-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              Acheter
            </button>
            <button
              disabled={pending || held < qty}
              onClick={() => onTrade({ ticker: selected.ticker, side: "sell", quantity: qty, price: selected.price })}
              className="flex-1 rounded-full border border-border px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              Vendre
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function Kpi({
  label,
  value,
  hint,
  positive,
}: {
  label: string;
  value: string;
  hint?: string;
  positive?: boolean;
}) {
  return (
    <div className="surface-card p-6">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`mt-3 text-2xl font-bold sm:text-3xl ${
          positive === undefined
            ? "text-gradient-gold"
            : positive
              ? "text-[var(--success)]"
              : "text-destructive"
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
