import { callRpc } from "@/lib/rpc";

/**
 * Classement des portefeuilles virtuels.
 *
 * Tout est calculé côté base : RLS interdit de lire le portefeuille d'un autre
 * utilisateur, et c'est très bien ainsi. La RPC ne renvoie que ce qu'un
 * classement doit montrer, sans e-mail, sans identifiant, sans composition de
 * portefeuille. Elle écarte aussi l'administrateur principal, qui administre la
 * plateforme et ne concourt pas.
 */

export type LeaderboardRow = {
  rank: number;
  name: string;
  performance: number;
  trades: number;
  is_self: boolean;
};

export const leaderboardQuery = {
  queryKey: ["leaderboard"],
  queryFn: async (): Promise<LeaderboardRow[]> => {
    const rows = await callRpc<LeaderboardRow[] | null>("leaderboard");
    return (rows ?? []).map((r) => ({
      ...r,
      rank: Number(r.rank),
      performance: Number(r.performance),
      trades: Number(r.trades),
    }));
  },
  staleTime: 60_000,
};
