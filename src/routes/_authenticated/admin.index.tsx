import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronRight, Search, ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  adminUsersQuery,
  isPrincipalAdminEmail,
  myRoleQuery,
  setUserRole,
  type AdminUserRow,
} from "@/lib/admin";
import { fullName } from "@/lib/profile";
import { useAuth } from "@/hooks/useAuth";
import { useFormat } from "@/lib/format";
import { useI18n, usePageTitle, type Translate } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [{ title: "Administration | Lyamfi" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminIndex,
});

function AdminIndex() {
  const { t } = useI18n();
  usePageTitle("admin.title");

  const { user } = useAuth();
  const { data: role, isLoading: roleLoading } = useQuery(myRoleQuery);

  if (roleLoading) {
    return <p className="text-sm text-muted-foreground">{t("admin.checking")}</p>;
  }

  // Garde d'affichage seulement : la vraie barrière est côté base, où chaque
  // RPC rejette l'appel si l'utilisateur n'est pas administrateur.
  if (role !== "admin") return <Denied t={t} />;

  return (
    <Console
      currentUserId={user?.id ?? null}
      principal={isPrincipalAdminEmail(user?.email)}
      t={t}
    />
  );
}

export function Denied({ t }: { t: Translate }) {
  return (
    <div className="mx-auto max-w-md space-y-4 py-16 text-center">
      <ShieldAlert className="mx-auto h-9 w-9 text-muted-foreground" />
      <h1 className="text-2xl font-bold">{t("admin.deniedTitle")}</h1>
      <p className="text-sm text-muted-foreground">{t("admin.deniedText")}</p>
      <Link to="/dashboard" className="inline-block text-sm text-primary">
        {t("admin.backToDashboard")}
      </Link>
    </div>
  );
}

function Console({
  currentUserId,
  principal,
  t,
}: {
  currentUserId: string | null;
  principal: boolean;
  t: Translate;
}) {
  const qc = useQueryClient();
  const f = useFormat();
  const [q, setQ] = useState("");
  const { data: users = [], isLoading, error } = useQuery(adminUsersQuery);

  const roleMutation = useMutation({
    mutationFn: (v: { userId: string; role: "admin" | "user" }) => setUserRole(v.userId, v.role),
    onSuccess: (_d, v) => {
      toast.success(t(v.role === "admin" ? "admin.roleGranted" : "admin.roleRevoked"));
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(needle) ||
        fullName(u, u.email).toLowerCase().includes(needle),
    );
  }, [users, q]);

  const admins = users.filter((u) => u.role === "admin").length;
  const confirmed = users.filter((u) => u.email_confirmed).length;

  return (
    <div className="space-y-8">
      <header className="rise">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h1 className="text-3xl font-bold sm:text-4xl">{t("admin.title")}</h1>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t(principal ? "admin.subtitlePrincipal" : "admin.subtitleSecondary")}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Kpi label={t("admin.kpiAccounts")} value={String(users.length)} />
        <Kpi label={t("admin.kpiAdmins")} value={String(admins)} />
        <Kpi label={t("admin.kpiConfirmed")} value={`${confirmed} / ${users.length}`} />
      </section>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("admin.searchPlaceholder")}
          className="w-full rounded-xl border border-input bg-card py-3 pl-11 pr-4 text-sm outline-none transition-colors focus:border-primary"
        />
      </div>

      {error && (
        <p className="surface-raised p-5 text-sm text-destructive">
          {t("admin.loadError", { reason: (error as Error).message })}
        </p>
      )}

      <section className="surface-raised overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">{t("admin.loadingAccounts")}</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">{t("admin.noMatch")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left font-medium sm:px-6">
                    {t("admin.colAccount")}
                  </th>
                  <th className="px-3 py-3 text-left font-medium">{t("admin.colRole")}</th>
                  <th className="px-3 py-3 text-right font-medium">{t("admin.colModules")}</th>
                  <th className="px-3 py-3 text-right font-medium">{t("admin.colHoldings")}</th>
                  <th className="px-3 py-3 text-right font-medium">{t("admin.colTrades")}</th>
                  <th className="px-3 py-3 text-left font-medium">{t("admin.colJoined")}</th>
                  <th className="px-5 py-3 text-right font-medium sm:px-6">
                    {t("admin.colActions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.user_id} className="border-b border-border/60 last:border-0">
                    <td className="px-5 py-4 sm:px-6">
                      <Link
                        to="/admin/$userId"
                        params={{ userId: u.user_id }}
                        className="block transition-colors hover:text-primary"
                      >
                        <p className="font-medium">{fullName(u, u.email)}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </Link>
                      {!u.email_confirmed && (
                        <span className="mt-1 inline-block rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                          {t("admin.unconfirmed")}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-4">
                      <RoleBadge role={u.role} principal={isPrincipalAdminEmail(u.email)} t={t} />
                    </td>
                    <td className="px-3 py-4 text-right tabular-nums">{u.lessons_completed}</td>
                    <td className="px-3 py-4 text-right tabular-nums">{u.holdings_count}</td>
                    <td className="px-3 py-4 text-right tabular-nums">{u.trades_count}</td>
                    <td className="px-3 py-4 text-xs text-muted-foreground">
                      {f.shortDate(u.created_at)}
                    </td>
                    <td className="px-5 py-4 text-right sm:px-6">
                      <div className="flex justify-end gap-2">
                        <RoleButton
                          row={u}
                          principal={principal}
                          isSelf={u.user_id === currentUserId}
                          pending={roleMutation.isPending}
                          onClick={() =>
                            roleMutation.mutate({
                              userId: u.user_id,
                              role: u.role === "admin" ? "user" : "admin",
                            })
                          }
                          t={t}
                        />
                        <Link
                          to="/admin/$userId"
                          params={{ userId: u.user_id }}
                          className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                        >
                          {t("admin.sheet")} <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs leading-relaxed text-muted-foreground">{t("admin.securityNote")}</p>
    </div>
  );
}

/**
 * Le bouton de rôle n'apparaît actif que pour l'administrateur principal :
 * un administrateur secondaire est en lecture seule, et l'infobulle dit
 * pourquoi plutôt que de laisser un bouton grisé sans explication.
 */
function RoleButton({
  row,
  principal,
  isSelf,
  pending,
  onClick,
  t,
}: {
  row: AdminUserRow;
  principal: boolean;
  isSelf: boolean;
  pending: boolean;
  onClick: () => void;
  t: Translate;
}) {
  const blocked = !principal || isSelf;
  return (
    <button
      disabled={pending || blocked}
      title={blocked ? (isSelf ? t("admin.selfRole") : t("admin.principalOnly")) : undefined}
      onClick={onClick}
      className="rounded-full border border-border px-3 py-1.5 text-xs transition-colors hover:border-primary/60 disabled:opacity-40"
    >
      {t(row.role === "admin" ? "admin.revokeAdmin" : "admin.grantAdmin")}
    </button>
  );
}

export function RoleBadge({
  role,
  principal,
  t,
}: {
  role: "admin" | "user";
  principal?: boolean;
  t: Translate;
}) {
  if (role === "admin") {
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-accent px-2.5 py-0.5 text-[10px] font-medium text-accent-foreground">
          <ShieldCheck className="h-3 w-3" /> {t("account.roleAdmin")}
        </span>
        {principal && (
          <span className="rounded-full bg-gradient-gold px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
            {t("admin.principalBadge")}
          </span>
        )}
      </span>
    );
  }
  return (
    <span className="rounded-full border border-border px-2.5 py-0.5 text-[10px] text-muted-foreground">
      {t("account.roleUser")}
    </span>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-raised p-6">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-3 text-2xl font-bold tabular-nums text-gradient-gold">{value}</p>
    </div>
  );
}
