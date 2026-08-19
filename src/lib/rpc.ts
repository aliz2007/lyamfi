import { supabase } from "@/integrations/supabase/client";

/**
 * `src/integrations/supabase/types.ts` est régénéré depuis la base et ne
 * déclare aucune fonction (`Functions: { [_ in never]: never }`). Les RPC
 * ajoutées par migration sont donc invisibles pour TypeScript.
 *
 * Ce module isole l'unique cast nécessaire : les appelants exposent ensuite
 * des types propres. Éditer le fichier généré serait perdu à la prochaine
 * régénération.
 */
type RpcFn = (
  fn: string,
  args?: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message: string; code?: string } | null }>;

/**
 * ⚠️ Doit être appelée COMME MÉTHODE de `supabase`.
 *
 * `supabase` est un Proxy paresseux : détacher la méthode
 * (`const rpc = supabase.rpc`) puis l'appeler seule perd le `this`, et
 * supabase-js échoue sur « Cannot read properties of undefined (reading
 * 'rest') ». On garde donc l'appel sous forme `client.rpc(...)`.
 */
const client = supabase as unknown as { rpc: RpcFn };

export const rpc: RpcFn = (fn, args) => client.rpc(fn, args);

/**
 * Traduit les erreurs PostgREST en messages lisibles.
 *
 * Le cas important est PGRST202 / « does not exist » : il signifie que les
 * migrations n'ont pas été appliquées à la base, pas que l'utilisateur a mal
 * agi. Sans ce message, l'écran affiche une erreur Postgres brute et donne
 * l'impression que la fonctionnalité est cassée.
 */
function explain(message: string, code?: string): string {
  const m = message.toLowerCase();
  if (code === "PGRST202" || m.includes("does not exist") || m.includes("could not find")) {
    return "Cette fonctionnalité n'est pas encore activée : les migrations de la base de données n'ont pas été appliquées. Contacte l'administrateur du projet.";
  }
  if (code === "42501" || m.includes("not authorized") || m.includes("not authenticated")) {
    return "Tu n'as pas les droits nécessaires pour cette action.";
  }
  return message;
}

/** Appelle une RPC et lève une erreur exploitable si la base la refuse. */
export async function callRpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await rpc(fn, args);
  if (error) throw new Error(explain(error.message, error.code));
  return data as T;
}
