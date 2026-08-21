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
 * que masquer l'interface : elles ne protègent rien à elles seules.
 *
 * Deux niveaux d'administration :
 *   - administrateur principal (lyamcorpo@gmail.com) : tout, y compris
 *     accorder ou retirer le rôle, redéfinir un mot de passe et supprimer un
 *     compte. La base le reconnaît par `is_principal_admin()`.
 *   - administrateur secondaire : consultation des comptes et de leur
 *     activité, rien d'autre.
 */

/** Adresse de l'administrateur principal, dupliquée côté base dans `principal_admin_email()`. */
export const PRINCIPAL_ADMIN_EMAIL = "lyamcorpo@gmail.com";

/**
 * Vrai si l'adresse est celle de l'administrateur principal.
 * Sert uniquement à afficher ou masquer les commandes : la base revérifie.
 */
export const isPrincipalAdminEmail = (email: string | null | undefined) =>
  (email ?? "").trim().toLowerCase() === PRINCIPAL_ADMIN_EMAIL;

export type AdminUserRow = {
  user_id: string;
  email: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
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
    first_name: string | null;
    last_name: string | null;
    role: "admin" | "user";
    created_at: string;
    last_sign_in_at: string | null;
    email_confirmed: boolean;
    confirmed_at: string | null;
    role_granted_at: string | null;
  } | null;
  progress: {
    total: number;
    completed: number;
    ratio: number;
    avg_score: number;
    best_score: number;
    attempted: number;
    last_activity: string | null;
    by_level: { level: string; total: number; completed: number }[];
  };
  lessons: {
    title: string;
    level: string;
    sort_order: number;
    slug: string;
    completed: boolean;
    score: number;
    attempted: boolean;
    updated_at: string | null;
  }[];
  portfolio: {
    cash: number;
    created_at: string;
    cost_basis: number;
    trades_count: number;
    buy_count: number;
    sell_count: number;
    first_trade: string | null;
    last_trade: string | null;
  } | null;
  holdings: {
    ticker: string;
    quantity: number;
    avg_price: number;
    cost: number;
    updated_at: string | null;
  }[];
  orders: {
    ticker: string;
    side: "buy" | "sell";
    quantity: number;
    limit_price: number;
    status: string;
    created_at: string;
  }[];
  trades: {
    ticker: string;
    side: "buy" | "sell";
    quantity: number;
    price: number;
    amount: number;
    created_at: string;
  }[];
  snapshots: { date: string; value: number; masi: number | null }[];
};

const EMPTY_PROGRESS: AdminActivity["progress"] = {
  total: 0,
  completed: 0,
  ratio: 0,
  avg_score: 0,
  best_score: 0,
  attempted: 0,
  last_activity: null,
  by_level: [],
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
        eq: (
          col: string,
          val: string,
        ) => {
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
  queryFn: async (): Promise<AdminUserRow[]> =>
    callRpc<AdminUserRow[] | null>("admin_list_users").then((r) => r ?? []),
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
      progress: raw.progress ?? EMPTY_PROGRESS,
      lessons: raw.lessons ?? [],
      portfolio: raw.portfolio ?? null,
      holdings: raw.holdings ?? [],
      orders: raw.orders ?? [],
      trades: raw.trades ?? [],
      snapshots: raw.snapshots ?? [],
    };
  },
});

export async function setUserRole(targetUser: string, newRole: "admin" | "user") {
  await callRpc<void>("admin_set_role", { target_user: targetUser, new_role: newRole });
}

/** Prénom et nom d'un compte. Le nom est mis en majuscules par la base. */
export async function setUserName(targetUser: string, firstName: string, lastName: string) {
  await callRpc<void>("admin_set_user_name", {
    target_user: targetUser,
    new_first_name: firstName,
    new_last_name: lastName,
  });
}

/**
 * Redéfinit le mot de passe d'un compte (administrateur principal uniquement).
 *
 * Il n'existe aucune fonction symétrique pour LIRE un mot de passe : ils sont
 * stockés hachés par bcrypt, opération à sens unique. Redéfinir puis
 * transmettre est la seule réponse possible à « je ne peux plus me connecter ».
 * La base ferme au passage les sessions ouvertes du compte visé.
 */
export async function setUserPassword(targetUser: string, newPassword: string) {
  await callRpc<void>("admin_set_user_password", {
    target_user: targetUser,
    new_password: newPassword,
  });
}

/** Supprime définitivement un compte (administrateur principal uniquement). */
export async function deleteUser(targetUser: string) {
  await callRpc<void>("admin_delete_user", { target_user: targetUser });
}
