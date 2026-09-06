import { callRpc } from "@/lib/rpc";

/**
 * Classement des portefeuilles virtuels.
 *
 * Tout est calculé côté base : RLS interdit de lire le portefeuille d'un autre
 * utilisateur, et c'est très bien ainsi. La RPC ne renvoie que ce qu'un
 * classement doit montrer : un nom, une valeur, une performance. Ni e-mail, ni
 * identifiant, ni composition de portefeuille, ni nombre d'ordres passés.
 *
 * Tout le monde y figure, y compris qui n'a encore rien acheté : ces comptes
 * apparaissent à leur capital de départ. Seul l'administrateur principal est
 * écarté, il administre la plateforme et ne concourt pas.
 */

/** Capital de départ de chaque portefeuille virtuel, en dirhams. */
export const START_CAPITAL = 100000;

export type LeaderboardRow = {
  rank: number;
  name: string;
  /** Liquidités non investies, en dirhams. */
  cash: number;
  /** Positions valorisées, en dirhams. `cash + invested` fait toujours `value`. */
  invested: number;
  /** Valeur totale du portefeuille en dirhams. */
  value: number;
  /** Écart au capital de départ, en pourcentage. */
  performance: number;
  is_self: boolean;
};

/**
 * Remet d'aplomb les lignes que la base renvoie.
 *
 * La base peut être en avance ou en retard d'une version sur le client déployé,
 * le temps qu'un build passe. Les champs manquants sont reconstruits plutôt que
 * laissés passer en NaN jusqu'au tableau.
 *
 * `base` est le capital de référence : celui de la plateforme pour le
 * classement général, celui de la ligue pour un classement de ligue. C'est le
 * seul paramètre qui les distingue, et c'est la raison pour laquelle cette
 * fonction est partagée — deux copies auraient divergé, et le tableau des
 * ligues aurait affiché « N/A » là où le général reste lisible.
 */
export function normaliseLeaderboard(
  rows: Partial<LeaderboardRow>[] | null,
  base: number,
): LeaderboardRow[] {
  return (rows ?? []).map((r) => {
    const performance = Number(r.performance ?? 0);
    const value = Number.isFinite(Number(r.value))
      ? Number(r.value)
      : base * (1 + performance / 100);
    const cash = Number.isFinite(Number(r.cash)) ? Number(r.cash) : value;
    const invested = Number.isFinite(Number(r.invested))
      ? Number(r.invested)
      : Math.max(value - cash, 0);
    return {
      rank: Number(r.rank ?? 0),
      name: r.name ?? "",
      cash,
      invested,
      value,
      performance,
      is_self: Boolean(r.is_self),
    };
  });
}

export const leaderboardQuery = {
  queryKey: ["leaderboard"],
  queryFn: async (): Promise<LeaderboardRow[]> =>
    normaliseLeaderboard(
      await callRpc<Partial<LeaderboardRow>[] | null>("leaderboard"),
      START_CAPITAL,
    ),
  // Le classement bouge à chaque ordre passé et à chaque cours relevé, donc il
  // est relu à l'ouverture de la page et rafraîchi tant qu'elle reste ouverte.
  // Un `staleTime` d'une minute suffisait à faire croire que rien ne s'était
  // passé quand on revenait du portefeuille juste après avoir acheté.
  staleTime: 0,
  refetchOnMount: "always" as const,
  refetchInterval: 60_000,
};
