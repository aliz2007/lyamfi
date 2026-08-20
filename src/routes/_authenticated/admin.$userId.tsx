import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ShieldAlert, ShieldCheck } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { adminActivityQuery, myRoleQuery, setUserRole, type AdminActivity } from "@/lib/admin";
import { LEVELS } from "@/lib/market";
import { mad, num } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import { RoleBadge } from "@/routes/_authenticated/admin.index";

export const Route = createFileRoute("/_authenticated/admin/$userId")({
  head: () => ({
    meta: [{ title: "Fiche compte — Lyamfi" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminUserDetail,
});

const dt = (v: string | null | undefined) =>
  v
    ? new Date(v).toLocaleDateString("fr-MA", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

const dtLong = (v: string | null | undefined) =>
  v
    ? new Date(v).toLocaleString("fr-MA", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

function AdminUserDetail() {
  const { userId } = Route.useParams();
  const { user } = useAuth();
  const { data: role, isLoading: roleLoading } = useQuery(myRoleQuery);

  if (roleLoading) return <p className="text-sm text-muted-foreground">Vérification des droits…</p>;

  if (role !== "admin") {
    return (
      <div className="mx-auto max-w-md space-y-4 py-16 text-center">
        <ShieldAlert className="mx-auto h-9 w-9 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Accès réservé</h1>
        <Link to="/dashboard" className="inline-block text-sm text-primary">
          Retour au tableau de bord
        </Link>
      </div>
    );
  }

  return <Detail userId={userId} isSelf={userId === user?.id} />;
}

function Detail({ userId, isSelf }: { userId: string; isSelf: boolean }) {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery(adminActivityQuery(userId));

  const roleMutation = useMutation({
    mutationFn: (next: "admin" | "user") => setUserRole(userId, next),
    onSuccess: () => {
      toast.success("Rôle mis à jour.");
      qc.invalidateQueries({ queryKey: ["admin-activity", userId] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Chargement de la fiche…</p>;
  if (error)
    return <p className="surface-card p-5 text-sm text-destructive">{(error as Error).message}</p>;

  const account = data?.account;
  if (!account)
    return (
      <div className="space-y-4">
        <Back />
        <p className="text-sm text-muted-foreground">Compte introuvable.</p>
      </div>
    );

  const p = data.progress;
  const pf = data.portfolio;
  const investedCost = Number(pf?.cost_basis ?? 0);
  const cash = Number(pf?.cash ?? 0);

  return (
    <div className="space-y-8">
      <Back />

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold sm:text-3xl">
            {account.display_name ?? account.email.split("@")[0]}
          </h1>
          <p className="mt-1 truncate text-sm text-muted-foreground">{account.email}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <RoleBadge role={account.role} />
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] ${
                account.email_confirmed
                  ? "border-[var(--success)]/40 text-[var(--success)]"
                  : "border-border text-muted-foreground"
              }`}
            >
              {account.email_confirmed ? "e-mail confirmé" : "e-mail non confirmé"}
            </span>
          </div>
        </div>
        <button
          disabled={roleMutation.isPending || isSelf}
          title={isSelf ? "Tu ne peux pas modifier ton propre rôle" : undefined}
          onClick={() => roleMutation.mutate(account.role === "admin" ? "user" : "admin")}
          className="rounded-full border border-border px-4 py-2 text-xs transition-colors hover:border-primary/60 disabled:opacity-40"
        >
          {account.role === "admin" ? "Retirer l'accès admin" : "Accorder l'accès admin"}
        </button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Progression" value={`${p.ratio}%`} hint={`${p.completed} / ${p.total} modules`} />
        <Kpi label="Score moyen" value={p.attempted ? `${p.avg_score}%` : "—"} hint={`${p.attempted} quiz tenté(s)`} />
        <Kpi label="Portefeuille" value={mad(cash + investedCost, 0)} hint={`dont ${mad(cash, 0)} en liquidités`} />
        <Kpi label="Ordres passés" value={String(pf?.trades_count ?? 0)} hint={`${pf?.buy_count ?? 0} achats · ${pf?.sell_count ?? 0} ventes`} />
      </section>

      <Progression data={data} />

      <Panel title="Compte">
        <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          <Row label="Inscrit le" value={dtLong(account.created_at)} />
          <Row label="Dernière connexion" value={dtLong(account.last_sign_in_at)} />
          <Row label="E-mail confirmé le" value={dtLong(account.confirmed_at)} />
          <Row label="Dernière activité pédagogique" value={dtLong(p.last_activity)} />
          <Row label="Portefeuille créé le" value={dtLong(pf?.created_at)} />
          <Row label="Rôle attribué le" value={dtLong(account.role_granted_at)} />
          <Row label="Premier ordre" value={dtLong(pf?.first_trade)} />
          <Row label="Dernier ordre" value={dtLong(pf?.last_trade)} />
          <Row label="Identifiant" value={account.user_id} mono />
        </dl>
      </Panel>

      {data.snapshots.length >= 2 && <Performance snapshots={data.snapshots} />}

      <Panel title={`Positions (${data.holdings.length})`}>
        {data.holdings.length === 0 ? (
          <Empty>Aucune position ouverte.</Empty>
        ) : (
          <Table head={["Valeur", "Quantité", "Prix moyen", "Coût total"]} align="rrr">
            {data.holdings.map((h, i) => (
              <tr key={i} className="border-b border-border/60 last:border-0">
                <td className="py-2.5 font-medium">{h.ticker}</td>
                <td className="py-2.5 text-right tabular-nums">{num(Number(h.quantity), 0)}</td>
                <td className="py-2.5 text-right tabular-nums">{num(Number(h.avg_price))}</td>
                <td className="py-2.5 text-right tabular-nums">{mad(Number(h.cost), 0)}</td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>

      {data.orders.length > 0 && (
        <Panel title={`Ordres limités en attente (${data.orders.length})`}>
          <Table head={["Valeur", "Sens", "Quantité", "Cours limite", "Placé le"]} align="rrr">
            {data.orders.map((o, i) => (
              <tr key={i} className="border-b border-border/60 last:border-0">
                <td className="py-2.5 font-medium">{o.ticker}</td>
                <td className="py-2.5">
                  <Side side={o.side} />
                </td>
                <td className="py-2.5 text-right tabular-nums">{num(Number(o.quantity), 0)}</td>
                <td className="py-2.5 text-right tabular-nums">{num(Number(o.limit_price))}</td>
                <td className="py-2.5 text-right text-xs text-muted-foreground">{dt(o.created_at)}</td>
              </tr>
            ))}
          </Table>
        </Panel>
      )}

      <Panel title={`Historique des ordres (${data.trades.length})`}>
        {data.trades.length === 0 ? (
          <Empty>Aucun ordre passé.</Empty>
        ) : (
          <Table head={["Date", "Sens", "Valeur", "Quantité", "Cours", "Montant"]} align="rrr">
            {data.trades.map((t, i) => (
              <tr key={i} className="border-b border-border/60 last:border-0">
                <td className="py-2.5 text-xs text-muted-foreground">{dt(t.created_at)}</td>
                <td className="py-2.5">
                  <Side side={t.side} />
                </td>
                <td className="py-2.5 font-medium">{t.ticker}</td>
                <td className="py-2.5 text-right tabular-nums">{num(Number(t.quantity), 0)}</td>
                <td className="py-2.5 text-right tabular-nums">{num(Number(t.price))}</td>
                <td className="py-2.5 text-right tabular-nums">{mad(Number(t.amount), 0)}</td>
              </tr>
            ))}
          </Table>
        )}
        {data.trades.length === 100 && (
          <p className="mt-3 text-xs text-muted-foreground">100 derniers ordres affichés.</p>
        )}
      </Panel>
    </div>
  );
}

function Progression({ data }: { data: AdminActivity }) {
  const byLevel = new Map(data.progress.by_level.map((l) => [l.level, l]));

  return (
    <Panel title="Progression pédagogique">
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-gold transition-all"
          style={{ width: `${data.progress.ratio}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {data.progress.completed} module(s) validé(s) sur {data.progress.total} · meilleur score{" "}
        {data.progress.best_score}%
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {LEVELS.map((level) => {
          const l = byLevel.get(level) ?? { level, total: 0, completed: 0 };
          const pctDone = l.total ? (l.completed / l.total) * 100 : 0;
          return (
            <div key={level}>
              <div className="flex items-center justify-between text-xs">
                <span>{level}</span>
                <span className="text-muted-foreground tabular-nums">
                  {l.completed}/{l.total}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-gradient-gold" style={{ width: `${pctDone}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-7 overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr className="border-b border-border">
              <th className="py-2 text-left font-medium">Module</th>
              <th className="py-2 text-left font-medium">Niveau</th>
              <th className="py-2 text-right font-medium">Score</th>
              <th className="py-2 text-right font-medium">Statut</th>
              <th className="py-2 text-right font-medium">Dernière tentative</th>
            </tr>
          </thead>
          <tbody>
            {data.lessons.map((l, i) => (
              <tr key={i} className="border-b border-border/60 last:border-0">
                <td className="py-2.5 pr-3">{l.title}</td>
                <td className="py-2.5 pr-3 text-xs text-muted-foreground">{l.level}</td>
                <td className="py-2.5 text-right tabular-nums">{l.attempted ? `${l.score}%` : "—"}</td>
                <td className="py-2.5 text-right">
                  <span
                    className={`text-xs ${
                      l.completed
                        ? "text-[var(--success)]"
                        : l.attempted
                          ? "text-muted-foreground"
                          : "text-muted-foreground/60"
                    }`}
                  >
                    {l.completed ? "validé" : l.attempted ? "en cours" : "non commencé"}
                  </span>
                </td>
                <td className="py-2.5 text-right text-xs text-muted-foreground">
                  {dt(l.updated_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function Performance({ snapshots }: { snapshots: AdminActivity["snapshots"] }) {
  const base = snapshots.find((s) => s.masi)?.masi ?? null;
  const first = Number(snapshots[0]?.value ?? 0) || 1;
  const chart = snapshots.map((s) => ({
    date: s.date.slice(5),
    portefeuille: Number(((Number(s.value) / first) * 100).toFixed(2)),
    masi: base && s.masi ? Number(((Number(s.masi) / base) * 100).toFixed(2)) : null,
  }));

  return (
    <Panel title="Performance du portefeuille vs MASI (base 100)">
      <div className="mt-3 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chart}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              minTickGap={32}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                fontSize: 12,
              }}
            />
            <Line
              name="Portefeuille"
              type="monotone"
              dataKey="portefeuille"
              stroke="var(--gold)"
              strokeWidth={2.5}
              dot={false}
            />
            <Line
              name="MASI"
              type="monotone"
              dataKey="masi"
              stroke="var(--muted-foreground)"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

/* ---------------------------------------------------------------- primitives */

function Back() {
  return (
    <Link
      to="/admin"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" /> Tous les comptes
    </Link>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="surface-card p-5 sm:p-7">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Table({
  head,
  children,
}: {
  head: string[];
  align?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead className="text-xs text-muted-foreground">
          <tr className="border-b border-border">
            {head.map((h, i) => (
              <th key={h} className={`py-2 font-medium ${i === 0 ? "text-left" : "text-right"}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/40 pb-2">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className={`truncate text-right ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}

function Side({ side }: { side: "buy" | "sell" }) {
  return (
    <span className={`text-xs ${side === "buy" ? "text-[var(--success)]" : "text-destructive"}`}>
      {side === "buy" ? "Achat" : "Vente"}
    </span>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="surface-card p-6">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-3 text-2xl font-bold text-gradient-gold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
