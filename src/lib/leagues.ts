import { callRpc } from "@/lib/rpc";
import { normaliseLeaderboard, type LeaderboardRow } from "@/lib/leaderboard";

/**
 * Ligues privées : des classements fermés, chacun avec son portefeuille.
 *
 * Une ligue est un concours — un nom, une fenêtre de dates, une dotation. On la
 * rejoint, on reçoit un portefeuille neuf crédité de cette dotation, on n'y
 * passe d'ordre qu'entre les deux dates, et on n'y est classé qu'entre membres.
 * C'est ce qui la rend utilisable pour un partenariat avec un club
 * universitaire ou un créateur : il voit SES participants.
 *
 * Tout passe par des RPC SECURITY DEFINER (cf. `20260906090000_leagues.sql`) :
 *   * `league_create` n'ouvre que sur `is_admin()` ;
 *   * `league_join` crédite la dotation DE LA LIGUE, ce qu'un client ne peut
 *     pas décider — la base lui refuse d'écrire `league_id` ;
 *   * `league_list` compte les participants, lecture que la RLS interdit à
 *     juste titre à un membre ;
 *   * `league_leaderboard` classe les membres contre le capital de la ligue.
 *
 * Masquer un bouton reste cosmétique : c'est la base qui tranche, ici comme
 * pour l'espace d'administration et les actualités.
 */

export type League = {
  id: string;
  name: string;
  /** Bornes de la fenêtre de jeu, en ISO 8601. */
  startsAt: string;
  endsAt: string;
  /** Dotation créditée à chaque participant, en dirhams. */
  startCapital: number;
  members: number;
  joined: boolean;
  /** Le portefeuille de l'utilisateur dans cette ligue, `null` s'il ne l'a pas rejointe. */
  portfolioId: string | null;
};

/**
 * Où en est la ligue.
 *
 * « upcoming » se rejoint mais ne se joue pas encore, « open » se joue,
 * « closed » ne se rejoint plus et ne se joue plus — seul son classement
 * subsiste, et c'est bien le but d'un concours terminé.
 */
export type LeagueStatus = "upcoming" | "open" | "closed";

/**
 * Où en est la ligue, à l'instant donné.
 *
 * ⚠️ UNE FENÊTRE ILLISIBLE COMPTE POUR FERMÉE. `Date.parse("")` vaut `NaN`, et
 * toute comparaison avec `NaN` est fausse : la version naïve
 * (`now < parse(start)` puis `now > parse(end)`) répondait donc « en cours »
 * pour une ligue sans dates du tout, et ouvrait le passage d'ordre.
 *
 * Le cas n'est pas théorique : `toLeague` remplace un champ manquant par une
 * chaîne vide, précisément pour survivre à une base en retard d'une version sur
 * le client déployé (cf. §12 du HANDOFF). C'est la fenêtre où l'on veut le
 * moins d'un fail-open. « Fenêtre inconnue » se replie donc sur « fermée », qui
 * est la direction sûre : un ordre mis en attente se défait, un ordre exécuté à
 * tort ne se défait pas.
 */
export function leagueStatus(league: League, now: number = Date.now()): LeagueStatus {
  const starts = Date.parse(league.startsAt);
  const ends = Date.parse(league.endsAt);
  if (!Number.isFinite(starts) || !Number.isFinite(ends)) return "closed";
  if (now < starts) return "upcoming";
  if (now > ends) return "closed";
  return "open";
}

/**
 * Le trading est-il ouvert sur ce portefeuille ?
 *
 * `null` désigne le portefeuille principal, qui n'a pas de fenêtre : il suit la
 * séance de la Bourse comme il l'a toujours fait, et rien d'autre.
 *
 * ⚠️ C'est un GARDE D'INTERFACE, pas une exécution de la règle. Comme tout le
 * reste du trading (§10 du HANDOFF), la condition est évaluée dans le
 * navigateur : un appel direct à l'API peut encore passer un ordre sur une
 * ligue fermée. Cette exposition est celle qui existe déjà pour les liquidités
 * et les positions, et elle disparaîtra avec le même correctif — la RPC de
 * transaction en SECURITY DEFINER (§11, point 2), qui devra porter l'horloge de
 * la séance ET la fenêtre de la ligue.
 */
export const leagueTradingOpen = (league: League | null, now: number = Date.now()): boolean =>
  league === null || leagueStatus(league, now) === "open";

type LeagueRow = {
  id?: string;
  name?: string;
  starts_at?: string;
  ends_at?: string;
  start_capital?: number | string;
  members?: number | string;
  joined?: boolean;
  portfolio_id?: string | null;
};

const toLeague = (r: LeagueRow): League => ({
  id: r.id ?? "",
  name: r.name ?? "",
  startsAt: r.starts_at ?? "",
  endsAt: r.ends_at ?? "",
  startCapital: Number(r.start_capital ?? 0),
  members: Number(r.members ?? 0),
  joined: Boolean(r.joined),
  portfolioId: r.portfolio_id ?? null,
});

export const leaguesQuery = {
  queryKey: ["leagues"],
  queryFn: async (): Promise<League[]> => {
    const rows = await callRpc<LeagueRow[] | null>("league_list");
    return (rows ?? []).map(toLeague);
  },
  // Le nombre de participants bouge à chaque adhésion, et le statut d'une ligue
  // change tout seul au passage d'une date. Une minute suffit à ce que la
  // grille ne mente pas longtemps.
  staleTime: 60_000,
  refetchInterval: 60_000,
};

/**
 * Le classement d'une ligue, mêmes colonnes que le classement général.
 *
 * Il passe par le MÊME redressement que lui (`normaliseLeaderboard`), au
 * capital de la ligue près : un client en avance d'une version sur la base doit
 * dégrader ici exactement comme là-bas, et pas afficher « N/A » dans un tableau
 * dont le jumeau reste lisible juste au-dessus.
 */
export const leagueLeaderboardQuery = (leagueId: string, startCapital: number) => ({
  queryKey: ["league-leaderboard", leagueId],
  queryFn: async (): Promise<LeaderboardRow[]> =>
    normaliseLeaderboard(
      await callRpc<Partial<LeaderboardRow>[] | null>("league_leaderboard", {
        p_league_id: leagueId,
      }),
      startCapital,
    ),
  staleTime: 0,
  refetchOnMount: "always" as const,
});

/** Rejoint une ligue et rend l'identifiant du portefeuille ouvert pour elle. */
export const joinLeague = (leagueId: string): Promise<string> =>
  callRpc<string>("league_join", { p_league_id: leagueId });

/** Crée une ligue (administrateurs seulement) et rend son identifiant. */
export const createLeague = (v: {
  name: string;
  startsAt: string;
  endsAt: string;
  startCapital: number;
}): Promise<string> =>
  callRpc<string>("league_create", {
    p_name: v.name,
    p_starts_at: v.startsAt,
    p_ends_at: v.endsAt,
    p_start_capital: v.startCapital,
  });
