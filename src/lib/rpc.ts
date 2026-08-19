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

export const rpc = supabase.rpc as unknown as RpcFn;

/** Appelle une RPC et lève une erreur exploitable si la base la refuse. */
export async function callRpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}
