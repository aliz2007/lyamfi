import { supabase } from "@/integrations/supabase/client";

/**
 * Carnet d'ordres du portefeuille virtuel.
 *
 * Un ordre attend dans `portfolio_orders` tant qu'il n'a pas de raison de
 * partir. Deux motifs d'attente, désormais :
 *   * un ordre à cours limité attend que le cours atteigne son seuil ;
 *   * un ordre au marché passé hors séance attend l'ouverture suivante.
 *
 * D'où la colonne `order_type` : sans elle, un ordre au marché en attente
 * serait indiscernable d'un ordre limité, et `limit_price` devait pouvoir être
 * nul. La base impose la cohérence des deux (voir la migration
 * `20260827091000_session_orders.sql`).
 *
 * ⚠️ `src/integrations/supabase/types.ts` est régénéré depuis la base et ignore
 * encore `order_type`. Comme pour `lib/metrics.ts` et `lib/quotes.history.ts`,
 * l'unique cast nécessaire est isolé ici, et les appelants ne voient que des
 * types propres. Éditer le fichier généré serait perdu à la régénération.
 */

export type OrderSide = "buy" | "sell";
export type OrderType = "market" | "limit";

export type PendingOrder = {
  id: string;
  ticker: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  /** Seuil de déclenchement, `null` pour un ordre au marché. */
  limitPrice: number | null;
  createdAt: string;
};

type OrderRow = {
  id: string;
  ticker: string;
  side: string;
  /** Absent des lignes lues avec l'ancien jeu de colonnes, cf. `LEGACY_COLUMNS`. */
  order_type?: string | null;
  quantity: number | string;
  limit_price: number | string | null;
  created_at: string;
};

/** Maillon de chaîne PostgREST : filtrable, ordonnable, et attendable tel quel. */
type Chain<T> = PromiseLike<{ data: T; error: { message: string } | null }> & {
  eq: (col: string, val: string) => Chain<T>;
  order: (col: string, opts: { ascending: boolean }) => Chain<T>;
};

type OrdersTable = {
  select: (cols: string) => Chain<OrderRow[] | null>;
  insert: (row: Record<string, unknown>) => Chain<null>;
  update: (patch: Record<string, unknown>) => Chain<null>;
};

const table = () => supabase.from("portfolio_orders" as never) as unknown as OrdersTable;

const COLUMNS = "id, ticker, side, order_type, quantity, limit_price, created_at";
const LEGACY_COLUMNS = "id, ticker, side, quantity, limit_price, created_at";

/**
 * Vrai quand la base ne connaît pas encore `order_type`.
 *
 * Le code peut être déployé avant que la migration ne soit jouée dans l'éditeur
 * SQL. Dans cette fenêtre, la page Portefeuille doit continuer de fonctionner
 * comme avant plutôt que de s'effondrer sur une colonne inconnue.
 */
const missingOrderType = (message: string) => message.toLowerCase().includes("order_type");

/**
 * Les ordres encore en attente d'un portefeuille, du plus récent au plus ancien.
 *
 * Sans la colonne `order_type`, la lecture se replie sur l'ancien jeu de
 * colonnes et tout est lu comme un ordre limité : c'est exactement ce que
 * chaque ligne était avant l'ajout.
 */
export async function listPendingOrders(portfolioId: string): Promise<PendingOrder[]> {
  const read = (columns: string) =>
    table()
      .select(columns)
      .eq("portfolio_id", portfolioId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

  let { data, error } = await read(COLUMNS);
  if (error && missingOrderType(error.message)) ({ data, error } = await read(LEGACY_COLUMNS));
  if (error) throw new Error(error.message);

  return (data ?? []).map((o) => ({
    id: o.id,
    ticker: o.ticker,
    side: o.side === "sell" ? "sell" : "buy",
    type: o.order_type === "market" ? "market" : "limit",
    quantity: Number(o.quantity),
    limitPrice: o.limit_price === null ? null : Number(o.limit_price),
    createdAt: o.created_at,
  }));
}

export async function placeOrder(v: {
  portfolioId: string;
  ticker: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  limitPrice: number | null;
}): Promise<void> {
  const row = {
    portfolio_id: v.portfolioId,
    ticker: v.ticker,
    side: v.side,
    quantity: v.quantity,
    // La contrainte de la base est stricte : un ordre au marché n'a pas de prix.
    limit_price: v.type === "limit" ? v.limitPrice : null,
  };

  const { error } = await table().insert({ ...row, order_type: v.type });
  if (!error) return;

  if (!missingOrderType(error.message)) throw new Error(error.message);

  // Base pas encore migrée. Un ordre limité s'y écrit tel quel, c'est tout ce
  // que la table savait faire. Un ordre au marché en attente n'y a en revanche
  // aucune représentation : mieux vaut le dire que d'enregistrer autre chose.
  if (v.type === "market") {
    throw new Error(
      "La mise en attente hors séance n'est pas encore activée : les migrations de la base de données n'ont pas été appliquées. Contacte l'administrateur du projet.",
    );
  }
  const { error: legacyError } = await table().insert(row);
  if (legacyError) throw new Error(legacyError.message);
}

export async function markOrderFilled(id: string, price: number): Promise<void> {
  const { error } = await table()
    .update({ status: "filled", filled_price: price, filled_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function cancelOrder(id: string): Promise<void> {
  const { error } = await table().update({ status: "cancelled" }).eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * L'ordre part-il au cours proposé ?
 *
 * Un ordre au marché part dès qu'un cours existe : il n'attendait que la
 * séance. Un ordre limité attend en plus son seuil, et se remplit au cours du
 * moment plutôt qu'à la limite, ce qui est l'exécution favorable d'un vrai
 * carnet.
 *
 * Le zéro compte comme une absence de cours : une valeur non cotée du jour
 * arrive à zéro, et un achat « à zéro dirham » n'a aucun sens.
 */
export function fillsAt(order: PendingOrder, price: number | null | undefined): boolean {
  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) return false;
  if (order.type === "market") return true;
  if (order.limitPrice === null) return false;
  return order.side === "buy" ? price <= order.limitPrice : price >= order.limitPrice;
}
