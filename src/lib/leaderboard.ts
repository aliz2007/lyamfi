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
    const rows = await callRpc<LeaderboardRow[] | null>("leaderboard");
    return (rows ?? []).map((r) => ({
      ...r,
      rank: Number(r.rank),
      value: Number(r.value),
      performance: Number(r.performance),
    }));
  },
  staleTime: 60_000,
};
