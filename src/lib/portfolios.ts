import { supabase } from "@/integrations/supabase/client";

/**
 * Quel portefeuille regarde-t-on ?
 *
 * Un compte n'en avait qu'un ; il en a maintenant un principal et un par ligue
 * rejointe (cf. `lib/leagues.ts`). Toute la lecture « le portefeuille de cet
 * utilisateur » passe donc par ici, et par ici seulement.
 *
 * ⚠️ CE MODULE EXISTE POUR UNE LIGNE. Partout dans le code, le portefeuille se
 * lisait ainsi :
 *
 *     .eq("user_id", uid).order("created_at").limit(1)
 *
 * Correct tant qu'il n'y en a qu'un. Faux dès qu'il y en a deux, et faux de la
 * pire façon : silencieusement. Qui rejoint une ligue AVANT d'avoir ouvert la
 * page Portefeuille n'a que ce portefeuille-là, donc c'est le plus ancien, donc
 * cette requête le lui donne comme portefeuille principal — et le tableau de
 * bord affiche la trésorerie du concours, avec sa dotation, comme s'il
 * s'agissait de son compte. Le filtre `league_id IS NULL` n'est pas une
 * précaution, c'est ce qui rend la lecture juste.
 *
 * ⚠️ `src/integrations/supabase/types.ts` est régénéré depuis la base et ignore
 * `league_id` comme `start_capital`. Comme dans `lib/orders.ts`, `lib/metrics.ts`
 * et `lib/newsfeed.ts`, l'unique cast nécessaire est isolé ici et les appelants ne
 * voient que des types propres. Éditer le fichier généré serait perdu à la
 * régénération.
 */

/** Dotation du portefeuille principal, en dirhams. */
export const MAIN_START_CAPITAL = 100000;

export type Wallet = {
  id: string;
  cash: number;
  /** `null` pour le portefeuille principal, l'identifiant de la ligue sinon. */
  leagueId: string | null;
  /** Ce avec quoi ce portefeuille a commencé : la référence de sa performance. */
  startCapital: number;
};

type Row = {
  id: string;
  cash: number | string;
  /** Absents des lignes lues avec l'ancien jeu de colonnes, cf. `LEGACY_COLUMNS`. */
  league_id?: string | null;
  start_capital?: number | string | null;
};

type Result<T> = { data: T; error: { message: string } | null };

/** Maillon de chaîne PostgREST : filtrable, ordonnable, et attendable tel quel. */
type Chain<T> = PromiseLike<Result<T>> & {
  eq: (col: string, val: string) => Chain<T>;
  is: (col: string, val: null) => Chain<T>;
  order: (col: string, opts: { ascending: boolean }) => Chain<T>;
  limit: (n: number) => Chain<T>;
  select: (cols: string) => Chain<T>;
  maybeSingle: () => PromiseLike<Result<Row | null>>;
  single: () => PromiseLike<Result<Row | null>>;
};

type PortfoliosTable = {
  select: (cols: string) => Chain<Row[] | null>;
  insert: (row: Record<string, unknown>) => Chain<Row[] | null>;
  update: (patch: Record<string, unknown>) => Chain<null>;
};

const table = () => supabase.from("portfolios" as never) as unknown as PortfoliosTable;

const COLUMNS = "id, cash, league_id, start_capital";
const LEGACY_COLUMNS = "id, cash";

/**
 * Vrai quand la base ne connaît pas encore les colonnes des ligues.
 *
 * Le client peut être déployé avant que la migration ne soit jouée dans
 * l'éditeur SQL (c'est la marche normale du projet, cf. §12 du HANDOFF). Dans
 * cette fenêtre, la page Portefeuille doit continuer de fonctionner comme
 * avant plutôt que de s'effondrer sur une colonne inconnue.
 */
const missingLeagueColumns = (message: string) => {
  const m = message.toLowerCase();
  return m.includes("league_id") || m.includes("start_capital");
};

const toWallet = (row: Row): Wallet => ({
  id: row.id,
  cash: Number(row.cash),
  leagueId: row.league_id ?? null,
  // Sans la colonne (base pas encore migrée) la dotation est celle de toujours,
  // ce que la valeur par défaut de la migration écrit d'ailleurs en base.
  startCapital:
    row.start_capital === null || row.start_capital === undefined
      ? MAIN_START_CAPITAL
      : Number(row.start_capital),
});

/**
 * Le portefeuille demandé, ou `null` s'il n'existe pas.
 *
 * `leagueId` à `null` demande le principal. Sur une base non migrée, un
 * portefeuille de ligue ne peut pas exister : la fonction rend `null` sans
 * chercher plus loin, ce qui ramène l'interface au portefeuille principal.
 */
export async function loadWallet(userId: string, leagueId: string | null): Promise<Wallet | null> {
  const read = (columns: string, withLeague: boolean) => {
    let chain = table().select(columns).eq("user_id", userId);
    if (withLeague) {
      chain = leagueId === null ? chain.is("league_id", null) : chain.eq("league_id", leagueId);
    }
    return chain.order("created_at", { ascending: true }).limit(1).maybeSingle();
  };

  let { data, error } = await read(COLUMNS, true);
  if (error && missingLeagueColumns(error.message)) {
    if (leagueId !== null) return null;
    ({ data, error } = await read(LEGACY_COLUMNS, false));
  }
  if (error) throw new Error(error.message);
  return data ? toWallet(data) : null;
}

/**
 * Le portefeuille principal, créé au premier passage s'il n'existe pas.
 *
 * ⚠️ Il n'existe PAS d'équivalent pour une ligue, et c'est délibéré : un
 * portefeuille de ligue naît par `league_join`, une fonction SECURITY DEFINER
 * qui seule connaît la dotation à créditer. Laisser le navigateur en créer un
 * reviendrait à le laisser choisir sa mise — la base lui refuse d'ailleurs
 * désormais d'écrire `league_id` (droits colonne par colonne, cf. la migration).
 */
export async function ensureMainWallet(userId: string): Promise<Wallet> {
  const existing = await loadWallet(userId, null);
  if (existing) return existing;

  const insert = (columns: string) =>
    table().insert({ user_id: userId, cash: MAIN_START_CAPITAL }).select(columns).single();

  let { data, error } = await insert(COLUMNS);
  if (error && missingLeagueColumns(error.message))
    ({ data, error } = await insert(LEGACY_COLUMNS));
  if (error) throw new Error(error.message);
  if (!data) throw new Error("portefeuille introuvable après création");
  return toWallet(data);
}
