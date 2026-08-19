import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, Search, ShieldAlert, ShieldCheck, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import {
  adminActivityQuery,
  adminUsersQuery,
  myRoleQuery,
  setUserRole,
  type AdminUserRow,
} from "@/lib/admin";
import { mad, num } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administration — Lyamfi" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const dt = (v: string | null) =>
  v ? new Date(v).toLocaleDateString("fr-MA", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function AdminPage() {
  const { user } = useAuth();
  const { data: role, isLoading: roleLoading } = useQuery(myRoleQuery);

  if (roleLoading) {
    return <p className="text-sm text-muted-foreground">Vérification des droits…</p>;
  }

  // Garde d'affichage seulement : la vraie barrière est côté base de données,
  // où chaque RPC rejette l'appel si l'utilisateur n'est pas administrateur.
  if (role !== "admin") {
    return (
      <div className="mx-auto max-w-md space-y-4 py-16 text-center">
        <ShieldAlert className="mx-auto h-9 w-9 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Accès réservé</h1>
        <p className="text-sm text-muted-foreground">
          Cette page est réservée aux administrateurs. Si tu penses que c'est une erreur,
          contacte l'équipe Lyamfi.
        </p>
        <Link to="/dashboard" className="inline-block text-sm text-primary">
          Retour au tableau de bord
        </Link>
      </div>
    );
  }

  return <AdminConsole currentUserId={user?.id ?? null} />;
}

function AdminConsole({ currentUserId }: { currentUserId: string | null }) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const { data: users = [], isLoading, error } = useQuery(adminUsersQuery);

  const roleMutation = useMutation({
    mutationFn: (v: { userId: string; role: "admin" | "user" }) =>
      setUserRole(v.userId, v.role),
    onSuccess: (_d, v) => {
      toast.success(
        v.role === "admin"
          ? "Accès administrateur accordé."
          : "Accès administrateur retiré.",
      );
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-activity", v.userId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(needle) ||
        (u.display_name ?? "").toLowerCase().includes(needle),
    );
  }, [users, q]);

  const admins = users.filter((u) => u.role === "admin").length;

  if (selected) {
    return (
      <UserDetail
        userId={selected}
        onBack={() => setSelected(null)}
        onToggleRole={(u) =>
          roleMutation.mutate({ userId: u.user_id, role: u.role === "admin" ? "user" : "admin" })
        }
        isSelf={selected === currentUserId}
        pending={roleMutation.isPending}
      />
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h1 className="text-3xl font-bold sm:text-4xl">Administration</h1>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Gestion des comptes Lyamfi. Sélectionne un compte pour voir son activité, ou
          accorde l'accès administrateur pour déléguer le support client.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Comptes" value={String(users.length)} />
        <Kpi label="Administrateurs" value={String(admins)} />
        <Kpi
          label="E-mails confirmés"
          value={`${users.filter((u) => u.email_confirmed).length} / ${users.length}`}
        />
      </section>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher par e-mail ou nom"
          className="w-full rounded-xl border border-input bg-card py-3 pl-11 pr-4 text-sm outline-none focus:border-primary"
        />
      </div>

      {error && (
        <p className="surface-card p-5 text-sm text-destructive">
          Impossible de charger les comptes : {(error as Error).message}
        </p>
      )}

      <section className="surface-card overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Chargement des comptes…</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Aucun compte ne correspond.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left font-medium sm:px-6">Compte</th>
                  <th className="px-3 py-3 text-left font-medium">Rôle</th>
                  <th className="px-3 py-3 text-right font-medium">Modules</th>
                  <th className="px-3 py-3 text-right font-medium">Titres</th>
                  <th className="px-3 py-3 text-right font-medium">Ordres</th>
                  <th className="px-3 py-3 text-left font-medium">Inscrit</th>
                  <th className="px-5 py-3 text-right font-medium sm:px-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.user_id} className="border-b border-border/60 last:border-0">
                    <td className="px-5 py-4 sm:px-6">
                      <button
                        onClick={() => setSelected(u.user_id)}
                        className="text-left transition-colors hover:text-primary"
                      >
                        <p className="font-medium">{u.display_name ?? u.email.split("@")[0]}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </button>
                      {!u.email_confirmed && (
                        <span className="mt-1 inline-block rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                          e-mail non confirmé
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-4">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-3 py-4 text-right">{u.lessons_completed}</td>
                    <td className="px-3 py-4 text-right">{u.holdings_count}</td>
                    <td className="px-3 py-4 text-right">{u.trades_count}</td>
                    <td className="px-3 py-4 text-xs text-muted-foreground">{dt(u.created_at)}</td>
                    <td className="px-5 py-4 text-right sm:px-6">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSelected(u.user_id)}
                          className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                          Activité
                        </button>
                        <button
                          disabled={roleMutation.isPending || u.user_id === currentUserId}
                          title={
                            u.user_id === currentUserId
                              ? "Tu ne peux pas modifier ton propre rôle"
                              : undefined
                          }
                          onClick={() =>
                            roleMutation.mutate({
                              userId: u.user_id,
                              role: u.role === "admin" ? "user" : "admin",
                            })
                          }
                          className="rounded-full border border-border px-3 py-1.5 text-xs transition-colors hover:border-primary/60 disabled:opacity-40"
                        >
                          {u.role === "admin" ? "Retirer admin" : "Rendre admin"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs text-muted-foreground">
        Les droits sont vérifiés côté base de données : un compte non administrateur reçoit une
        erreur « not authorized » même en appelant l'API directement.
      </p>
    </div>
  );
}

function UserDetail({
  userId,
  onBack,
  onToggleRole,
  isSelf,
  pending,
}: {
  userId: string;
  onBack: () => void;
  onToggleRole: (u: AdminUserRow) => void;
  isSelf: boolean;
  pending: boolean;
}) {
  const { data, isLoading, error } = useQuery(adminActivityQuery(userId));
  const account = data?.account ?? null;

  return (
    <div className="space-y-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Tous les comptes
      </button>

      {isLoading && <p className="text-sm text-muted-foreground">Chargement de l'activité…</p>}
      {error && (
        <p className="surface-card p-5 text-sm text-destructive">
          {(error as Error).message}
        </p>
      )}

      {account && (
        <>
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <h1 className="truncate text-2xl font-bold sm:text-3xl">
                  {account.display_name ?? account.email.split("@")[0]}
                </h1>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{account.email}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <RoleBadge role={account.role} />
                {!account.email_confirmed && (
                  <span className="rounded-full border border-border px-2.5 py-0.5 text-[10px] text-muted-foreground">
                    e-mail non confirmé
                  </span>
                )}
              </div>
            </div>
            <button
              disabled={pending || isSelf}
              title={isSelf ? "Tu ne peux pas modifier ton propre rôle" : undefined}
              onClick={() =>
                onToggleRole({
                  user_id: account.user_id,
                  role: account.role,
                } as AdminUserRow)
              }
              className="rounded-full border border-border px-4 py-2 text-xs transition-colors hover:border-primary/60 disabled:opacity-40"
            >
              {account.role === "admin" ? "Retirer l'accès admin" : "Accorder l'accès admin"}
            </button>
          </header>

          <section className="grid gap-4 sm:grid-cols-3">
            <Kpi label="Inscrit le" value={dt(account.created_at)} />
            <Kpi label="Dernière connexion" value={dt(account.last_sign_in_at)} />
            <Kpi
              label="Liquidités"
              value={data?.portfolio ? mad(Number(data.portfolio.cash), 0) : "—"}
            />
          </section>

          <Panel title={`Modules suivis (${data?.lessons.length ?? 0})`}>
            {(data?.lessons.length ?? 0) === 0 ? (
              <Empty>Aucun module commencé.</Empty>
            ) : (
              <ul className="divide-y divide-border/60">
                {data!.lessons.map((l, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate">{l.title}</span>
                      <span className="text-xs text-muted-foreground">{l.level}</span>
                    </span>
                    <span className="shrink-0 text-right text-xs">
                      <span className={l.completed ? "text-[var(--success)]" : "text-muted-foreground"}>
                        {l.completed ? "validé" : "en cours"}
                      </span>
                      <span className="block text-muted-foreground">{l.score}%</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title={`Positions (${data?.holdings.length ?? 0})`}>
            {(data?.holdings.length ?? 0) === 0 ? (
              <Empty>Aucune position ouverte.</Empty>
            ) : (
              <ul className="divide-y divide-border/60">
                {data!.holdings.map((h, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="font-medium">{h.ticker}</span>
                    <span className="text-xs text-muted-foreground">
                      {num(Number(h.quantity), 0)} × {num(Number(h.avg_price))} MAD
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title={`Derniers ordres (${data?.trades.length ?? 0})`}>
            {(data?.trades.length ?? 0) === 0 ? (
              <Empty>Aucun ordre passé.</Empty>
            ) : (
              <ul className="divide-y divide-border/60">
                {data!.trades.map((t, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span>
                      <span className={t.side === "buy" ? "text-[var(--success)]" : "text-destructive"}>
                        {t.side === "buy" ? "Achat" : "Vente"}
                      </span>{" "}
                      {num(Number(t.quantity), 0)} × {t.ticker}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {num(Number(t.price))} MAD · {dt(t.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: "admin" | "user" }) {
  if (role === "admin") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-accent px-2.5 py-0.5 text-[10px] font-medium text-accent-foreground">
        <ShieldCheck className="h-3 w-3" /> Administrateur
      </span>
    );
  }
  return (
    <span className="rounded-full border border-border px-2.5 py-0.5 text-[10px] text-muted-foreground">
      Utilisateur
    </span>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="surface-card p-5 sm:p-7">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card p-6">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-3 text-2xl font-bold text-gradient-gold">{value}</p>
    </div>
  );
}
