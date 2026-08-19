import { supabase } from "@/integrations/supabase/client";
import { callRpc } from "@/lib/rpc";

/**
 * Accès à l'espace d'administration.
 *
 * Les RPC sont appelées via `@/lib/rpc`, qui isole le cast nécessaire (le
 * fichier de types généré ne déclare aucune fonction). Ce module n'expose
 * que des types propres.
 *
 * ⚠️ Le contrôle d'accès réel est côté base : chaque RPC est SECURITY DEFINER
 * et rejette l'appel si `is_admin()` est faux. Les gardes côté client ne font
 * que masquer l'interface — elles ne protègent rien à elles seules.
 */

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
  queryFn: async (): Promise<AdminUserRow[]> => callRpc<AdminUserRow[] | null>("admin_list_users").then((r) => r ?? []),
};

export const adminActivityQuery = (userId: string) => ({
  queryKey: ["admin-activity", userId],
  queryFn: async (): Promise<AdminActivity> => {
    const data = await callRpc<Partial<AdminActivity>>("admin_user_activity", {
      target_user: userId,
    });
    const raw = data ?? {};
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
  await callRpc<void>("admin_set_role", { target_user: targetUser, new_role: newRole });
}
