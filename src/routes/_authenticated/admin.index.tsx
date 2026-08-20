import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronRight, Search, ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { adminUsersQuery, myRoleQuery, setUserRole } from "@/lib/admin";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [{ title: "Administration — Lyamfi" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminIndex,
});

const dt = (v: string | null) =>
  v
    ? new Date(v).toLocaleDateString("fr-MA", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

function AdminIndex() {
  const { user } = useAuth();
  const { data: role, isLoading: roleLoading } = useQuery(myRoleQuery);

  if (roleLoading) {
    return <p className="text-sm text-muted-foreground">Vérification des droits…</p>;
  }

  // Garde d'affichage seulement : la vraie barrière est côté base, où chaque
  // RPC rejette l'appel si l'utilisateur n'est pas administrateur.
  if (role !== "admin") {
    return (
      <div className="mx-auto max-w-md space-y-4 py-16 text-center">
        <ShieldAlert className="mx-auto h-9 w-9 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Accès réservé</h1>
        <p className="text-sm text-muted-foreground">
          Cette page est réservée aux administrateurs.
        </p>
        <Link to="/dashboard" className="inline-block text-sm text-primary">
          Retour au tableau de bord
        </Link>
      </div>
    );
  }

  return <Console currentUserId={user?.id ?? null} />;
}

function Console({ currentUserId }: { currentUserId: string | null }) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const { data: users = [], isLoading, error } = useQuery(adminUsersQuery);

  const roleMutation = useMutation({
    mutationFn: (v: { userId: string; role: "admin" | "user" }) => setUserRole(v.userId, v.role),
    onSuccess: (_d, v) => {
      toast.success(v.role === "admin" ? "Accès administrateur accordé." : "Accès retiré.");
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
        (u.display_name ?? "").toLowerCase().includes(needle),
    );
  }, [users, q]);

  const admins = users.filter((u) => u.role === "admin").length;
  const confirmed = users.filter((u) => u.email_confirmed).length;

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h1 className="text-3xl font-bold sm:text-4xl">Administration</h1>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Gestion des comptes Lyamfi. Ouvre une fiche pour voir la progression détaillée et
          l'activité complète, ou accorde l'accès administrateur pour déléguer le support.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Comptes" value={String(users.length)} />
        <Kpi label="Administrateurs" value={String(admins)} />
        <Kpi label="E-mails confirmés" value={`${confirmed} / ${users.length}`} />
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
            <table className="w-full min-w-[820px] text-sm">
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
                      <Link
                        to="/admin/$userId"
                        params={{ userId: u.user_id }}
                        className="group block transition-colors hover:text-primary"
                      >
                        <p className="font-medium">{u.display_name ?? u.email.split("@")[0]}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </Link>
                      {!u.email_confirmed && (
                        <span className="mt-1 inline-block rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                          e-mail non confirmé
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-4">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-3 py-4 text-right tabular-nums">{u.lessons_completed}</td>
                    <td className="px-3 py-4 text-right tabular-nums">{u.holdings_count}</td>
                    <td className="px-3 py-4 text-right tabular-nums">{u.trades_count}</td>
                    <td className="px-3 py-4 text-xs text-muted-foreground">{dt(u.created_at)}</td>
                    <td className="px-5 py-4 text-right sm:px-6">
                      <div className="flex justify-end gap-2">
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
                        <Link
                          to="/admin/$userId"
                          params={{ userId: u.user_id }}
                          className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                          Fiche <ChevronRight className="h-3 w-3" />
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

      <p className="text-xs text-muted-foreground">
        Les droits sont vérifiés côté base de données : un compte non administrateur reçoit une
        erreur « not authorized » même en appelant l'API directement.
      </p>
    </div>
  );
}

export function RoleBadge({ role }: { role: "admin" | "user" }) {
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

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card p-6">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-3 text-2xl font-bold text-gradient-gold">{value}</p>
    </div>
  );
}
