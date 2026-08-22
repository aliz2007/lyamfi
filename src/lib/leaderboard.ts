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
  /** Valeur du portefeuille en dirhams. */
  value: number;
  /** Écart au capital de départ, en pourcentage. */
  performance: number;
  is_self: boolean;
};

export const leaderboardQuery = {
  queryKey: ["leaderboard"],
  queryFn: async (): Promise<LeaderboardRow[]> => {
    const rows = await callRpc<Partial<LeaderboardRow>[] | null>("leaderboard");
    return (rows ?? []).map((r) => {
      const performance = Number(r.performance ?? 0);
      // La base peut être en avance ou en retard d'une version sur le client
      // déployé, le temps qu'un build passe. Si la valeur manque, on la
      // reconstruit depuis la performance plutôt que de laisser passer un NaN
      // jusqu'au tableau.
      const value = Number.isFinite(Number(r.value))
        ? Number(r.value)
        : START_CAPITAL * (1 + performance / 100);
      return {
        rank: Number(r.rank ?? 0),
        name: r.name ?? "",
        value,
        performance,
        is_self: Boolean(r.is_self),
      };
    });
  },
  staleTime: 60_000,
};
