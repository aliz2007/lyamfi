import { supabase } from "@/integrations/supabase/client";

/**
 * Accès à l'espace d'administration.
 *
 * `src/integrations/supabase/types.ts` est régénéré depuis la base et ne
 * contient pas encore les fonctions ajoutées par la migration
 * `20260819090000_admin_roles.sql`. Plutôt que d'éditer un fichier généré,
 * tous les casts sont regroupés ici : le reste de l'application consomme
 * les types propres exportés ci-dessous.
 *
 * ⚠️ Le contrôle d'accès réel est côté base : chaque RPC est SECURITY DEFINER
 * et rejette l'appel si `is_admin()` est faux. Les gardes côté client ne font
 * que masquer l'interface — elles ne protègent rien à elles seules.
 */

type RpcFn = (
  fn: string,
  args?: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message: string; code?: string } | null }>;

const rpc = supabase.rpc as unknown as RpcFn;

export type AdminUserRow = {
  user_id: string;
  email: string;
  display_name: string | null;
  role: "admin" | "user";
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed: boolean;
  lessons_completed: number;
  holdings_count: number;
  trades_count: number;
  cash: number | null;
};

export type AdminActivity = {
  account: {
    user_id: string;
    email: string;
    display_name: string | null;
    role: "admin" | "user";
    created_at: string;
    last_sign_in_at: string | null;
    email_confirmed: boolean;
  } | null;
  lessons: {
    title: string;
    level: string;
    completed: boolean;
    score: number;
    updated_at: string;
  }[];
  portfolio: { cash: number; created_at: string } | null;
  holdings: { ticker: string; quantity: number; avg_price: number }[];
  trades: {
    ticker: string;
    side: "buy" | "sell";
    quantity: number;
    price: number;
    created_at: string;
  }[];
};

/** Rôle de l'utilisateur connecté. Renvoie "user" si aucune ligne n'existe. */
export const myRoleQuery = {
  queryKey: ["my-role"],
  queryFn: async (): Promise<"admin" | "user"> => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return "user";

    const table = supabase.from("user_roles" as never) as unknown as {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          maybeSingle: () => Promise<{ data: { role?: string } | null }>;
        };
      };
    };

    const { data } = await table.select("role").eq("user_id", uid).maybeSingle();
    return data?.role === "admin" ? "admin" : "user";
  },
  staleTime: 60_000,
};

export const adminUsersQuery = {
  queryKey: ["admin-users"],
  queryFn: async (): Promise<AdminUserRow[]> => {
    const { data, error } = await rpc("admin_list_users");
    if (error) throw new Error(error.message);
    return (data as AdminUserRow[] | null) ?? [];
  },
};

export const adminActivityQuery = (userId: string) => ({
  queryKey: ["admin-activity", userId],
  queryFn: async (): Promise<AdminActivity> => {
    const { data, error } = await rpc("admin_user_activity", { target_user: userId });
    if (error) throw new Error(error.message);
    const raw = (data ?? {}) as Partial<AdminActivity>;
    return {
      account: raw.account ?? null,
      lessons: raw.lessons ?? [],
      portfolio: raw.portfolio ?? null,
      holdings: raw.holdings ?? [],
      trades: raw.trades ?? [],
    };
  },
});

export async function setUserRole(targetUser: string, newRole: "admin" | "user") {
  const { error } = await rpc("admin_set_role", {
    target_user: targetUser,
    new_role: newRole,
  });
  if (error) throw new Error(error.message);
}
