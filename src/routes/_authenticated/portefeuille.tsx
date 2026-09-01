import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Receipt, Search } from "lucide-react";
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
import { MarketSessionBadge } from "@/components/MarketSessionBadge";
import { useSessionStatus } from "@/hooks/useMarketSession";
import { supabase } from "@/integrations/supabase/client";
import { getLiveQuotes, type LiveQuote } from "@/lib/quotes.functions";
import { isIndexTicker } from "@/lib/cse-symbols";
import {
  cancelOrder,
  fillsAt,
  listPendingOrders,
  markOrderFilled,
  placeOrder as insertPendingOrder,
  type OrderSide,
  type OrderType,
} from "@/lib/orders";
import { CAPITAL_GAINS_RATE, saleBreakdown } from "@/lib/tax";
import { EMPTY, useFormat, type Formatter } from "@/lib/format";
import { useI18n, usePageTitle, type Key, type Translate } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/portefeuille")({
  head: () => ({
    meta: [
      { title: "Portefeuille virtuel BVC en temps réel | Lyamfi" },
      {
        name: "description",
        content:
          "Achète et vends des actions de la Bourse de Casablanca aux cours en direct avec 100 000 MAD virtuels, et compare ta performance au MASI.",
      },
      { property: "og:title", content: "Portefeuille virtuel | Lyamfi" },
      {
        property: "og:description",
        content: "Trading simulé aux cours en direct, plus ou moins-values et comparaison au MASI.",
      },
    ],
  }),
  component: PortfolioPage,
});

const START_CAPITAL = 100000;

type Holding = { id: string; ticker: string; quantity: number; avg_price: number };

function PortfolioPage() {
  const { t } = useI18n();
  const f = useFormat();
  usePageTitle("pf.title");

  // Séance de la Bourse de Casablanca. Tant que l'horloge n'a pas été lue
  // (rendu serveur, tout premier rendu), la séance est tenue pour fermée :
  // mettre un ordre en attente se défait, l'exécuter à tort ne se défait pas.
  const session = useSessionStatus();
  const marketOpen = session?.open ?? false;

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
      if (!uid) throw new Error(t("pf.errSession"));

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

      const [{ data: holdings }, { data: trades }, { data: snaps }, orders] = await Promise.all([
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
        listPendingOrders(p.id),
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
        orders,
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
    return {
      ...h,
      name: q?.name ?? h.ticker,
      last,
      cost,
      value,
      pnl: value - cost,
      pnlPct: cost ? ((value - cost) / cost) * 100 : 0,
      dayPct: q?.changePct ?? 0,
    };
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

  /** Exécute réellement un ordre (marché ou limite déclenchée) sur le portefeuille. */
  const applyTrade = async ({
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
    if (!pf?.id) throw new Error(t("pf.errNoPortfolio"));
    if (!(quantity > 0)) throw new Error(t("pf.errQty"));
    const amount = quantity * price;
    const existing = pf.holdings.find((h) => h.ticker === ticker);
    /** Impôt retenu sur cette vente, nul pour un achat comme pour une perte. */
    let taxed = 0;

    if (side === "buy") {
      if (amount > pf.cash + 1e-9) throw new Error(t("pf.errCash"));
      const newQty = (existing?.quantity ?? 0) + quantity;
      const newAvg = ((existing?.quantity ?? 0) * (existing?.avg_price ?? 0) + amount) / newQty;
      const { error } = await supabase.from("portfolio_holdings").upsert(
        {
          portfolio_id: pf.id,
          ticker,
          quantity: newQty,
          avg_price: newAvg,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "portfolio_id,ticker" },
      );
      if (error) throw error;
      const { error: cErr } = await supabase
        .from("portfolios")
        .update({ cash: pf.cash - amount })
        .eq("id", pf.id);
      if (cErr) throw cErr;
    } else {
      if (!existing || quantity > existing.quantity + 1e-9) throw new Error(t("pf.errHeld"));
      const newQty = existing.quantity - quantity;
      const { error } = await supabase
        .from("portfolio_holdings")
        .update({ quantity: newQty, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (error) throw error;
      // Ce sont les liquidités NETTES d'impôt qui rentrent : la plus-value est
      // taxée à 15 %, la moins-value ne l'est pas.
      const { net, tax } = saleBreakdown(quantity, price, existing.avg_price);
      taxed = tax;
      const { error: cErr } = await supabase
        .from("portfolios")
        .update({ cash: pf.cash + net })
        .eq("id", pf.id);
      if (cErr) throw cErr;
    }

    const { error: tErr } = await supabase
      .from("portfolio_trades")
      .insert({ portfolio_id: pf.id, ticker, side, quantity, price });
    if (tErr) throw tErr;

    return { tax: taxed };
  };

  const trade = useMutation({
    mutationFn: applyTrade,
    onSuccess: (result, v) => {
      const vars = { qty: f.num(v.quantity, 0), ticker: v.ticker, price: f.num(v.price) };
      toast.success(
        v.side === "buy"
          ? t("pf.okBuy", vars)
          : result.tax > 0
            ? // L'impôt n'est pas une surprise à découvrir dans le solde : il est
              // annoncé sur la confirmation de la vente qui l'a déclenché.
              t("pf.okSellTaxed", { ...vars, tax: f.num(result.tax) })
            : t("pf.okSell", vars),
      );
      qc.invalidateQueries({ queryKey: ["vportfolio"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /** Dépose un ordre dans le carnet : à cours limité, ou au marché hors séance. */
  const placeOrder = useMutation({
    mutationFn: async (v: {
      ticker: string;
      side: OrderSide;
      type: OrderType;
      quantity: number;
      limitPrice: number | null;
    }) => {
      if (!pf?.id) throw new Error(t("pf.errNoPortfolio"));
      if (!(v.quantity > 0)) throw new Error(t("pf.errQty"));
      if (v.type === "limit" && !(Number(v.limitPrice) > 0)) throw new Error(t("pf.errLimit"));
      await insertPendingOrder({ portfolioId: pf.id, ...v });
    },
    onSuccess: (_d, v) => {
      const qty = f.num(v.quantity, 0);
      toast.success(
        v.type === "market"
          ? t(v.side === "buy" ? "pf.okQueuedBuy" : "pf.okQueuedSell", {
              qty,
              ticker: v.ticker,
            })
          : t(v.side === "buy" ? "pf.okLimitBuy" : "pf.okLimitSell", {
              qty,
              ticker: v.ticker,
              price: f.num(v.limitPrice),
            }),
      );
      qc.invalidateQueries({ queryKey: ["vportfolio"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /**
   * Un ordre au marché s'exécute tout de suite si la séance est ouverte, et
   * rejoint le carnet sinon. C'est le seul endroit qui tranche : la base
   * n'ayant pas de notion d'horaire, la règle vit avec l'horloge du navigateur,
   * comme le bandeau qui l'annonce.
   */
  const submitMarketOrder = (v: {
    ticker: string;
    side: OrderSide;
    quantity: number;
    price: number;
  }) => {
    if (marketOpen) {
      trade.mutate(v);
      return;
    }
    placeOrder.mutate({
      ticker: v.ticker,
      side: v.side,
      type: "market",
      quantity: v.quantity,
      limitPrice: null,
    });
  };

  const dropOrder = useMutation({
    mutationFn: cancelOrder,
    onSuccess: () => {
      toast.success(t("pf.okCancelled"));
      qc.invalidateQueries({ queryKey: ["vportfolio"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /**
   * Moteur d'exécution du carnet.
   *
   * Il ne tourne QUE séance ouverte : hors séance, un ordre au marché comme un
   * ordre limité reste en attente, même si le dernier cours connu franchissait
   * le seuil. C'est le sens de la mise en attente, et cela évite qu'un ordre
   * déposé le samedi parte sur la clôture de vendredi.
   *
   * Un seul ordre par passage, volontairement : `applyTrade` lit les liquidités
   * dans le cache de la requête, donc deux exécutions enchaînées sur le même
   * état écraseraient le solde. L'invalidation qui suit relance le passage
   * suivant sur des données fraîches, et le carnet se vide de proche en proche.
   */
  const [filling, setFilling] = useState(false);
  useEffect(() => {
    const orders = pf?.orders ?? [];
    if (!pf?.id || !marketOpen || filling || orders.length === 0 || quotes.length === 0) return;

    // Le plus ancien d'abord : le carnet se sert dans l'ordre d'arrivée.
    const queue = [...orders].reverse();
    const eligible = queue.find((o) => fillsAt(o, quoteMap.get(o.ticker.toUpperCase())?.price));
    if (!eligible) return;

    const fillPrice = quoteMap.get(eligible.ticker.toUpperCase())!.price;
    setFilling(true);
    void (async () => {
      try {
        const { tax } = await applyTrade({
          ticker: eligible.ticker,
          side: eligible.side,
          quantity: eligible.quantity,
          price: fillPrice,
        });
        await markOrderFilled(eligible.id, fillPrice);
        const vars = {
          qty: f.num(eligible.quantity, 0),
          ticker: eligible.ticker,
          price: f.num(fillPrice),
        };
        toast.success(
          eligible.side === "buy"
            ? t("pf.okFilledBuy", vars)
            : tax > 0
              ? t("pf.okFilledSellTaxed", { ...vars, tax: f.num(tax) })
              : t("pf.okFilledSell", vars),
        );
      } catch (e) {
        await cancelOrder(eligible.id);
        toast.error(t("pf.errFilled", { ticker: eligible.ticker, reason: (e as Error).message }));
      } finally {
        setFilling(false);
        qc.invalidateQueries({ queryKey: ["vportfolio"] });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pf?.orders, quoteMap, filling, marketOpen]);

  const reset = useMutation({
    mutationFn: async () => {
      if (!pf?.id) return;
      await supabase.from("portfolio_holdings").delete().eq("portfolio_id", pf.id);
      await supabase.from("portfolio_trades").delete().eq("portfolio_id", pf.id);
      await supabase.from("portfolio_snapshots").delete().eq("portfolio_id", pf.id);
      await supabase.from("portfolio_orders").delete().eq("portfolio_id", pf.id);

      await supabase.from("portfolios").update({ cash: START_CAPITAL }).eq("id", pf.id);
    },
    onSuccess: () => {
      toast.success(t("pf.okReset"));
      qc.invalidateQueries({ queryKey: ["vportfolio"] });
    },
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="rise">
        <h1 className="text-3xl font-bold sm:text-4xl">{t("pf.title")}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t("pf.intro")}
        </p>
      </header>

      <Disclaimer />

      {/* Deux par ligne sur téléphone. Empilés, ces quatre chiffres — quatre
          lignes de texte au total — occupaient quatre écrans avant qu'on
          atteigne les positions, qui sont la raison d'être de la page. */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label={t("pf.totalValue")} value={f.mad(totalValue, 0)} />
        <Kpi label={t("pf.cash")} value={f.mad(cash, 0)} />
        <Kpi label={t("pf.invested")} value={f.mad(invested, 0)} />
        <Kpi
          label={t("pf.pnl")}
          value={`${totalPnl >= 0 ? "+" : ""}${f.num(totalPnl, 0)} MAD`}
          hint={f.pct(totalPnlPct)}
          positive={totalPnl >= 0}
        />
      </section>

      <TradePanel
        t={t}
        f={f}
        quotes={quotes}
        loading={quotesLoading}
        cash={cash}
        holdings={pf?.holdings ?? []}
        marketOpen={marketOpen}
        onTrade={submitMarketOrder}
        onPlaceOrder={(v) => placeOrder.mutate({ ...v, type: "limit", limitPrice: v.limitPrice })}
        pending={trade.isPending || placeOrder.isPending}
      />

      {(pf?.orders ?? []).length > 0 && (
        <section className="surface-raised p-5 sm:p-7">
          <h2 className="text-sm font-semibold">{t("pf.pendingOrders")}</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {t(marketOpen ? "pf.pendingExplain" : "pf.pendingExplainClosed")}
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {pf!.orders.map((o) => {
              const last = quoteMap.get(o.ticker.toUpperCase())?.price ?? null;
              return (
                <li
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-2 last:border-0"
                >
                  <span>
                    <span
                      className={o.side === "buy" ? "text-[var(--success)]" : "text-destructive"}
                    >
                      {t(
                        o.type === "market"
                          ? o.side === "buy"
                            ? "pf.queuedBuy"
                            : "pf.queuedSell"
                          : o.side === "buy"
                            ? "pf.limitBuy"
                            : "pf.limitSell",
                      )}
                    </span>{" "}
                    {f.num(o.quantity, 0)} × {o.ticker}
                    {/* Un ordre au marché n'a pas de seuil : afficher un prix
                        ici laisserait croire à une condition qui n'existe pas. */}
                    {o.limitPrice !== null && <> · {f.num(o.limitPrice)} MAD</>}
                  </span>
                  <span className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      {t("pf.currentPrice", {
                        price: last === null ? EMPTY : `${f.num(last)} MAD`,
                      })}
                    </span>
                    <button
                      onClick={() => dropOrder.mutate(o.id)}
                      className="underline-offset-4 hover:text-destructive hover:underline"
                    >
                      {t("common.cancel")}
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="surface-raised overflow-hidden">
        <div className="flex items-center justify-between p-5 sm:p-7 sm:pb-4">
          <h2 className="text-sm font-semibold">{t("pf.positions")}</h2>
          <button
            onClick={() => reset.mutate()}
            className="press -mx-2 inline-flex min-h-9 items-center px-2 text-xs text-muted-foreground underline-offset-4 hover:text-destructive hover:underline"
          >
            {t("pf.reset")}
          </button>
        </div>

        {rows.length === 0 ? (
          <p className="px-5 pb-6 text-sm text-muted-foreground sm:px-7">{t("pf.noPositions")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-y border-border">
                  <th className="px-5 py-3 text-left font-medium sm:px-7">{t("pf.colStock")}</th>
                  <th className="px-3 py-3 text-right font-medium">{t("pf.colQty")}</th>
                  <th className="px-3 py-3 text-right font-medium">{t("pf.colBuyPrice")}</th>
                  <th className="px-3 py-3 text-right font-medium">{t("pf.colLastPrice")}</th>
                  <th className="px-3 py-3 text-right font-medium">{t("pf.colValue")}</th>
                  <th className="px-5 py-3 text-right font-medium sm:px-7">{t("pf.colPnl")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border/60 last:border-0">
                    <td className="px-5 py-4 sm:px-7">
                      <p className="font-medium">{r.ticker}</p>
                      <p className="truncate text-xs text-muted-foreground">{r.name}</p>
                    </td>
                    <td className="px-3 py-4 text-right tabular-nums">{f.num(r.quantity, 0)}</td>
                    <td className="px-3 py-4 text-right tabular-nums">{f.num(r.avg_price)}</td>
                    <td className="px-3 py-4 text-right tabular-nums">
                      {f.num(r.last)}
                      <span
                        className={`ml-2 text-xs ${
                          r.dayPct >= 0 ? "text-[var(--success)]" : "text-destructive"
                        }`}
                      >
                        {f.pct(r.dayPct)}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-right tabular-nums">{f.num(r.value, 0)}</td>
                    <td
                      className={`px-5 py-4 text-right font-semibold tabular-nums sm:px-7 ${
                        r.pnl >= 0 ? "text-[var(--success)]" : "text-destructive"
                      }`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {r.pnl >= 0 ? (
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5" />
                        )}
                        {f.num(r.pnl, 0)} MAD
                      </span>
                      <p className="text-xs font-normal">{f.pct(r.pnlPct)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="surface-raised p-5 sm:p-7">
        <h2 className="text-sm font-semibold">{t("pf.perfTitle")}</h2>
        {perfData.length < 2 ? (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("pf.perfEmpty")}</p>
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
                  name={t("pf.legendPortfolio")}
                  type="monotone"
                  dataKey="portefeuille"
                  stroke="var(--gold)"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  name={t("pf.legendMasi")}
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
        <section className="surface-raised p-5 sm:p-7">
          <h2 className="text-sm font-semibold">{t("pf.lastTrades")}</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {pf!.trades.map((trade) => (
              <li
                key={trade.id}
                className="flex items-center justify-between gap-3 border-b border-border/50 pb-2 last:border-0"
              >
                <span>
                  <span
                    className={trade.side === "buy" ? "text-[var(--success)]" : "text-destructive"}
                  >
                    {t(trade.side === "buy" ? "pf.buyLabel" : "pf.sellLabel")}
                  </span>{" "}
                  {f.num(Number(trade.quantity), 0)} × {trade.ticker}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {f.num(Number(trade.price))} MAD · {f.shortDate(trade.created_at)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Tout en bas de la page : l'impôt s'applique à chaque vente, il se lit
          donc après le carnet et l'historique, comme une note de bas de page. */}
      <section className="surface-raised p-5 sm:p-7">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-[var(--brand-yellow)]" />
          <h2 className="text-sm font-semibold">{t("pf.taxTitle")}</h2>
        </div>
        <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted-foreground">
          {t("pf.taxNote", { rate: f.num(CAPITAL_GAINS_RATE * 100, 0) })}
        </p>
      </section>
    </div>
  );
}

function TradePanel({
  t,
  f,
  quotes,
  loading,
  cash,
  holdings,
  marketOpen,
  onTrade,
  onPlaceOrder,
  pending,
}: {
  t: Translate;
  f: Formatter;
  quotes: LiveQuote[];
  loading: boolean;
  cash: number;
  holdings: Holding[];
  marketOpen: boolean;
  onTrade: (v: { ticker: string; side: OrderSide; quantity: number; price: number }) => void;
  onPlaceOrder: (v: {
    ticker: string;
    side: OrderSide;
    quantity: number;
    limitPrice: number;
  }) => void;
  pending: boolean;
}) {
  const [q, setQ] = useState("");
  const [ticker, setTicker] = useState("");
  const [qty, setQty] = useState(10);
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [limitPrice, setLimitPrice] = useState("");

  const list = useMemo(
    () =>
      quotes
        // Un indice n'est pas un titre : le MASI et le MASI 20 arrivent avec
        // les cotations mais ne s'achètent pas.
        .filter((s) => !isIndexTicker(s.ticker))
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
  const holding = holdings.find((h) => h.ticker === ticker) ?? null;
  const held = holding?.quantity ?? 0;
  const limitValue = Number(limitPrice.replace(",", "."));
  const validLimit = Number.isFinite(limitValue) && limitValue > 0;
  const execPrice = orderType === "limit" && validLimit ? limitValue : (selected?.price ?? 0);
  const amount = execPrice * qty;

  // Estimation de l'impôt si cette quantité était vendue au cours retenu. Elle
  // n'apparaît que si elle est due : annoncer « 0 MAD d'impôt » sur une
  // moins-value serait du bruit.
  const sale =
    holding && held >= qty && execPrice > 0
      ? saleBreakdown(qty, execPrice, holding.avg_price)
      : null;

  return (
    <section className="surface-raised p-5 sm:p-7">
      <h2 className="text-sm font-semibold">{t("pf.placeOrder")}</h2>

      {/* Le passage d'ordre reste ouvert 24 h sur 24 : ce bandeau dit ce qu'il
          adviendra de l'ordre, exécution immédiate ou mise en attente. */}
      <MarketSessionBadge variant="order" className="mt-4" />

      <div className="relative mt-4">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("pf.searchStock")}
          className="w-full rounded-xl border border-input bg-background py-3 pl-11 pr-4 text-sm outline-none focus:border-primary"
        />
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("pf.loadingQuotes")}</p>
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
                <span className="block text-sm font-semibold tabular-nums">{f.num(s.price)}</span>
                <span
                  className={`text-xs tabular-nums ${
                    s.changePct >= 0 ? "text-[var(--success)]" : "text-destructive"
                  }`}
                >
                  {f.pct(s.changePct)}
                </span>
              </span>
            </button>
          ))}
          {list.length === 0 && <p className="text-sm text-muted-foreground">{t("pf.noMatch")}</p>}
        </div>
      )}

      {selected && (
        <div className="mt-5 rounded-xl border border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{selected.name}</p>
              <p className="text-xs text-muted-foreground">
                {t("pf.livePriceHeld", { price: f.num(selected.price), qty: f.num(held, 0) })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground" htmlFor="qty">
                {t("pf.quantity")}
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

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setOrderType("market")}
              className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
                orderType === "market"
                  ? "border-primary/60 bg-accent text-accent-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("pf.marketOrder")}
            </button>
            <button
              onClick={() => {
                setOrderType("limit");
                if (!limitPrice) setLimitPrice(String(selected.price));
              }}
              className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
                orderType === "limit"
                  ? "border-primary/60 bg-accent text-accent-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("pf.limitOrder")}
            </button>
            {orderType === "limit" && (
              <span className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground" htmlFor="limit">
                  {t("pf.limitPrice")}
                </label>
                <input
                  id="limit"
                  inputMode="decimal"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  className="w-28 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <span className="text-xs text-muted-foreground">MAD</span>
              </span>
            )}
          </div>

          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {t("pf.orderAmount")}{" "}
            <span className="font-semibold tabular-nums text-foreground">{f.mad(amount, 2)}</span> ·{" "}
            {t("pf.availableCash", { cash: f.mad(cash, 2) })}
            {orderType === "limit" && <> · {t("pf.limitExplain")}</>}
            {orderType === "market" && !marketOpen && <> · {t("pf.marketQueuedExplain")}</>}
          </p>

          {sale && sale.tax > 0 && (
            <p className="mt-2 text-xs leading-relaxed text-[var(--warning)]">
              {t("pf.saleTaxPreview", {
                tax: f.mad(sale.tax, 2),
                net: f.mad(sale.net, 2),
                rate: f.num(CAPITAL_GAINS_RATE * 100, 0),
              })}
            </p>
          )}

          <div className="mt-4 flex gap-3">
            <button
              disabled={pending || (orderType === "market" ? amount > cash : !validLimit)}
              onClick={() =>
                orderType === "market"
                  ? onTrade({
                      ticker: selected.ticker,
                      side: "buy",
                      quantity: qty,
                      price: selected.price,
                    })
                  : onPlaceOrder({
                      ticker: selected.ticker,
                      side: "buy",
                      quantity: qty,
                      limitPrice: limitValue,
                    })
              }
              className="flex-1 rounded-full bg-gradient-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {t(
                orderType === "limit" ? "pf.placeLimitBuy" : marketOpen ? "pf.buy" : "pf.queueBuy",
              )}
            </button>
            <button
              disabled={pending || held < qty || (orderType === "limit" && !validLimit)}
              onClick={() =>
                orderType === "market"
                  ? onTrade({
                      ticker: selected.ticker,
                      side: "sell",
                      quantity: qty,
                      price: selected.price,
                    })
                  : onPlaceOrder({
                      ticker: selected.ticker,
                      side: "sell",
                      quantity: qty,
                      limitPrice: limitValue,
                    })
              }
              className="flex-1 rounded-full border border-border px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              {t(
                orderType === "limit"
                  ? "pf.placeLimitSell"
                  : marketOpen
                    ? "pf.sell"
                    : "pf.queueSell",
              )}
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
    <div className="surface-raised p-4 sm:p-6">
      <p className="text-xs leading-snug text-muted-foreground">{label}</p>
      <p
        // 18 px sur téléphone : à 20 px, « -17 925 MAD » passait à la ligne et
        // désalignait la tuile voisine.
        className={`mt-2 whitespace-nowrap text-lg font-bold tabular-nums sm:mt-3 sm:text-3xl ${
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
