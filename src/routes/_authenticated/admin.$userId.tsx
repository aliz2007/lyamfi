import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, Copy, KeyRound, RefreshCw, Trash2 } from "lucide-react";
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
import {
  adminActivityQuery,
  deleteUser,
  isPrincipalAdminEmail,
  myRoleQuery,
  setUserName,
  setUserPassword,
  setUserRole,
  type AdminActivity,
} from "@/lib/admin";
import { fullName } from "@/lib/profile";
import { LEVELS } from "@/lib/market";
import { EMPTY, useFormat, type Formatter } from "@/lib/format";
import { checkPassword, generatePassword, PASSWORD_MAX } from "@/lib/password";
import { PasswordField, PasswordRules } from "@/components/PasswordField";
import { TextField } from "@/components/TextField";
import { useAuth } from "@/hooks/useAuth";
import { useI18n, usePageTitle, type Translate } from "@/lib/i18n";
import { levelKey } from "@/lib/levels";
import { Denied, RoleBadge } from "@/routes/_authenticated/admin.index";

export const Route = createFileRoute("/_authenticated/admin/$userId")({
  head: () => ({
    meta: [{ title: "Fiche compte | Lyamfi" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminUserDetail,
});

function AdminUserDetail() {
  const { userId } = Route.useParams();
  const { t } = useI18n();
  usePageTitle("admin.sheet");

  const { user } = useAuth();
  const { data: role, isLoading: roleLoading } = useQuery(myRoleQuery);

  if (roleLoading) return <p className="text-sm text-muted-foreground">{t("admin.checking")}</p>;
  if (role !== "admin") return <Denied t={t} />;

  return (
    <Detail
      userId={userId}
      isSelf={userId === user?.id}
      principal={isPrincipalAdminEmail(user?.email)}
      t={t}
    />
  );
}

function Detail({
  userId,
  isSelf,
  principal,
  t,
}: {
  userId: string;
  isSelf: boolean;
  principal: boolean;
  t: Translate;
}) {
  const qc = useQueryClient();
  const f = useFormat();
  const { data, isLoading, error } = useQuery(adminActivityQuery(userId));

  const roleMutation = useMutation({
    mutationFn: (next: "admin" | "user") => setUserRole(userId, next),
    onSuccess: () => {
      toast.success(t("admin.roleUpdated"));
      qc.invalidateQueries({ queryKey: ["admin-activity", userId] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">{t("admin.loadingSheet")}</p>;
  if (error)
    return (
      <p className="surface-raised p-5 text-sm text-destructive">{(error as Error).message}</p>
    );

  const account = data?.account;
  if (!account)
    return (
      <div className="space-y-4">
        <Back t={t} />
        <p className="text-sm text-muted-foreground">{t("admin.notFound")}</p>
      </div>
    );

  const p = data.progress;
  const pf = data.portfolio;
  const investedCost = Number(pf?.cost_basis ?? 0);
  const cash = Number(pf?.cash ?? 0);
  const targetIsPrincipal = isPrincipalAdminEmail(account.email);
  const roleBlocked = !principal || isSelf;

  return (
    <div className="space-y-8">
      <Back t={t} />

      <header className="rise flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold sm:text-3xl">
            {fullName(account, account.email)}
          </h1>
          <p className="mt-1 truncate text-sm text-muted-foreground">{account.email}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <RoleBadge role={account.role} principal={targetIsPrincipal} t={t} />
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] ${
                account.email_confirmed
                  ? "border-[var(--success)]/40 text-[var(--success)]"
                  : "border-border text-muted-foreground"
              }`}
            >
              {t(account.email_confirmed ? "admin.confirmed" : "admin.unconfirmed")}
            </span>
          </div>
        </div>
        <button
          disabled={roleMutation.isPending || roleBlocked}
          title={
            roleBlocked ? (isSelf ? t("admin.selfRole") : t("admin.principalOnly")) : undefined
          }
          onClick={() => roleMutation.mutate(account.role === "admin" ? "user" : "admin")}
          className="rounded-full border border-border px-4 py-2 text-xs transition-colors hover:border-primary/60 disabled:opacity-40"
        >
          {t(account.role === "admin" ? "admin.revokeAdminLong" : "admin.grantAdminLong")}
        </button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label={t("admin.kpiProgress")}
          value={`${p.ratio}%`}
          hint={t("admin.kpiProgressHint", { done: p.completed, total: p.total })}
        />
        <Kpi
          label={t("admin.kpiAvgScore")}
          value={p.attempted ? `${p.avg_score}%` : EMPTY}
          hint={t("admin.kpiAvgScoreHint", { n: p.attempted })}
        />
        <Kpi
          label={t("admin.kpiPortfolio")}
          value={f.mad(cash + investedCost, 0)}
          hint={t("admin.kpiPortfolioHint", { cash: f.mad(cash, 0) })}
        />
        <Kpi
          label={t("admin.kpiOrders")}
          value={String(pf?.trades_count ?? 0)}
          hint={t("admin.kpiOrdersHint", {
            buys: pf?.buy_count ?? 0,
            sells: pf?.sell_count ?? 0,
          })}
        />
      </section>

      <Progression data={data} t={t} f={f} />

      <Panel title={t("admin.panelAccount")}>
        <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          <Row label={t("admin.joinedOn")} value={f.dateTime(account.created_at)} />
          <Row label={t("admin.lastSignIn")} value={f.dateTime(account.last_sign_in_at)} />
          <Row label={t("admin.confirmedOn")} value={f.dateTime(account.confirmed_at)} />
          <Row label={t("admin.lastLearning")} value={f.dateTime(p.last_activity)} />
          <Row label={t("admin.portfolioCreated")} value={f.dateTime(pf?.created_at)} />
          <Row label={t("admin.roleGrantedOn")} value={f.dateTime(account.role_granted_at)} />
          <Row label={t("admin.firstTrade")} value={f.dateTime(pf?.first_trade)} />
          <Row label={t("admin.lastTrade")} value={f.dateTime(pf?.last_trade)} />
          <Row label={t("admin.userId")} value={account.user_id} mono />
        </dl>
      </Panel>

      {principal && (
        <>
          <Identity
            userId={userId}
            firstName={account.first_name}
            lastName={account.last_name}
            t={t}
          />
          <ResetPassword userId={userId} t={t} />
          {!isSelf && !targetIsPrincipal && (
            <DeleteAccount userId={userId} email={account.email} t={t} />
          )}
        </>
      )}

      {data.snapshots.length >= 2 && <Performance snapshots={data.snapshots} t={t} />}

      <Panel title={t("admin.positions", { n: data.holdings.length })}>
        {data.holdings.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("admin.noPositions")}</p>
        ) : (
          <Table
            head={[
              t("pf.colStock"),
              t("pf.quantity"),
              t("admin.colAvgPrice"),
              t("admin.colTotalCost"),
            ]}
          >
            {data.holdings.map((h, i) => (
              <tr key={i} className="border-b border-border/60 last:border-0">
                <td className="py-2.5 font-medium">{h.ticker}</td>
                <td className="py-2.5 text-right tabular-nums">{f.num(Number(h.quantity), 0)}</td>
                <td className="py-2.5 text-right tabular-nums">{f.num(Number(h.avg_price))}</td>
                <td className="py-2.5 text-right tabular-nums">{f.mad(Number(h.cost), 0)}</td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>

      {data.orders.length > 0 && (
        <Panel title={t("admin.pendingOrders", { n: data.orders.length })}>
          <Table
            head={[
              t("pf.colStock"),
              t("admin.colSide"),
              t("pf.quantity"),
              t("admin.colLimit"),
              t("admin.colPlacedOn"),
            ]}
          >
            {data.orders.map((o, i) => (
              <tr key={i} className="border-b border-border/60 last:border-0">
                <td className="py-2.5 font-medium">{o.ticker}</td>
                <td className="py-2.5 text-right">
                  <Side side={o.side} t={t} />
                </td>
                <td className="py-2.5 text-right tabular-nums">{f.num(Number(o.quantity), 0)}</td>
                <td className="py-2.5 text-right tabular-nums">{f.num(Number(o.limit_price))}</td>
                <td className="py-2.5 text-right text-xs text-muted-foreground">
                  {f.shortDate(o.created_at)}
                </td>
              </tr>
            ))}
          </Table>
        </Panel>
      )}

      <Panel title={t("admin.tradeHistory", { n: data.trades.length })}>
        {data.trades.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("admin.noTrades")}</p>
        ) : (
          <Table
            head={[
              t("admin.colDate"),
              t("admin.colSide"),
              t("pf.colStock"),
              t("pf.quantity"),
              t("admin.colPrice"),
              t("admin.colAmount"),
            ]}
          >
            {data.trades.map((tr, i) => (
              <tr key={i} className="border-b border-border/60 last:border-0">
                <td className="py-2.5 text-xs text-muted-foreground">
                  {f.shortDate(tr.created_at)}
                </td>
                <td className="py-2.5 text-right">
                  <Side side={tr.side} t={t} />
                </td>
                <td className="py-2.5 text-right font-medium">{tr.ticker}</td>
                <td className="py-2.5 text-right tabular-nums">{f.num(Number(tr.quantity), 0)}</td>
                <td className="py-2.5 text-right tabular-nums">{f.num(Number(tr.price))}</td>
                <td className="py-2.5 text-right tabular-nums">{f.mad(Number(tr.amount), 0)}</td>
              </tr>
            ))}
          </Table>
        )}
        {data.trades.length === 100 && (
          <p className="mt-3 text-xs text-muted-foreground">{t("admin.trimmed")}</p>
        )}
      </Panel>
    </div>
  );
}

/* -------------------------------------------- actions de l'admin principal */

function Identity({
  userId,
  firstName,
  lastName,
  t,
}: {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  t: Translate;
}) {
  const qc = useQueryClient();
  const [first, setFirst] = useState(firstName ?? "");
  const [last, setLast] = useState(lastName ?? "");

  useEffect(() => {
    setFirst(firstName ?? "");
    setLast(lastName ?? "");
  }, [firstName, lastName]);

  const save = useMutation({
    mutationFn: () => setUserName(userId, first.trim(), last.trim()),
    onSuccess: () => {
      toast.success(t("admin.identitySaved"));
      qc.invalidateQueries({ queryKey: ["admin-activity", userId] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const dirty = first.trim() !== (firstName ?? "") || last.trim() !== (lastName ?? "");

  return (
    <Panel title={t("admin.identityTitle")}>
      <p className="text-xs text-muted-foreground">{t("admin.identityText")}</p>
      <form
        className="mt-4 space-y-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="admin-first-name"
            label={t("auth.firstName")}
            value={first}
            onChange={setFirst}
          />
          <TextField
            id="admin-last-name"
            label={t("auth.lastName")}
            value={last}
            onChange={setLast}
          />
        </div>
        <button
          type="submit"
          disabled={save.isPending || !dirty}
          className="rounded-full bg-gradient-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40"
        >
          {save.isPending ? t("common.saving") : t("account.saveIdentity")}
        </button>
      </form>
    </Panel>
  );
}

/**
 * Redéfinition de mot de passe.
 *
 * Il n'y a délibérément pas de « voir le mot de passe » : bcrypt est une
 * fonction à sens unique, donc rien, côté serveur, ne permet de retrouver le
 * mot de passe choisi par un utilisateur. Le panneau l'explique et propose la
 * seule opération réellement disponible : en générer un nouveau, le montrer
 * une fois à l'administrateur, et le transmettre.
 */
function ResetPassword({ userId, t }: { userId: string; t: Translate }) {
  const [value, setValue] = useState("");
  const check = useMemo(() => checkPassword(value), [value]);

  const apply = useMutation({
    mutationFn: () => setUserPassword(userId, value),
    onSuccess: () => {
      toast.success(t("admin.passwordDone"));
      setValue("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t("admin.passwordCopied"));
    } catch {
      // Presse-papiers refusé (contexte non sécurisé) : la valeur reste
      // visible à l'écran, l'administrateur peut la recopier à la main.
      toast.error(t("admin.passwordHint"));
    }
  };

  return (
    <Panel title={t("admin.passwordTitle")}>
      <p className="text-xs leading-relaxed text-muted-foreground">{t("admin.passwordExplain")}</p>

      <form
        className="mt-5 space-y-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          apply.mutate();
        }}
      >
        <PasswordField
          id="admin-new-password"
          label={t("admin.passwordSet")}
          value={value}
          onChange={setValue}
          autoComplete="new-password"
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setValue(generatePassword())}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            <RefreshCw className="h-3 w-3" /> {t("admin.passwordGenerate")}
          </button>
          <button
            type="button"
            disabled={!value}
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-40"
          >
            <Copy className="h-3 w-3" /> {t("admin.passwordCopy")}
          </button>
        </div>

        {value.length > 0 && <PasswordRules value={value} check={check} max={PASSWORD_MAX} />}

        <button
          type="submit"
          disabled={apply.isPending || !check.valid}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40"
        >
          <KeyRound className="h-4 w-4" />
          {apply.isPending ? t("common.saving") : t("admin.passwordApply")}
        </button>

        <p className="text-xs text-muted-foreground">{t("admin.passwordHint")}</p>
      </form>
    </Panel>
  );
}

function DeleteAccount({ userId, email, t }: { userId: string; email: string; t: Translate }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [phrase, setPhrase] = useState("");
  const word = t("admin.deleteWord");

  const remove = useMutation({
    mutationFn: () => deleteUser(userId),
    onSuccess: () => {
      toast.success(t("admin.deleted"));
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      navigate({ to: "/admin" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="rounded-2xl border border-destructive/40 bg-card p-5 sm:p-7">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{t("admin.dangerTitle")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t("admin.dangerText")}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{email}</p>
        </div>
      </div>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-destructive/50 px-5 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" /> {t("admin.deleteButton")}
        </button>
      ) : (
        <div className="mt-5 space-y-3">
          <label className="block text-xs text-muted-foreground" htmlFor="admin-delete-confirm">
            {t("admin.deleteConfirm", { word })}
          </label>
          <input
            id="admin-delete-confirm"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            autoComplete="off"
            placeholder={word}
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-destructive"
          />
          <div className="flex flex-wrap gap-3">
            <button
              disabled={phrase !== word || remove.isPending}
              onClick={() => remove.mutate()}
              className="rounded-full bg-destructive px-5 py-2.5 text-sm font-semibold text-destructive-foreground disabled:opacity-40"
            >
              {remove.isPending ? t("admin.deleting") : t("admin.deleteFinal")}
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setPhrase("");
              }}
              className="rounded-full border border-border px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------- progression */

function Progression({ data, t, f }: { data: AdminActivity; t: Translate; f: Formatter }) {
  const byLevel = new Map(data.progress.by_level.map((l) => [l.level, l]));

  return (
    <Panel title={t("admin.progressTitle")}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-gold transition-[width] duration-700"
          style={{ width: `${data.progress.ratio}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {t("admin.progressLine", {
          done: data.progress.completed,
          total: data.progress.total,
          best: data.progress.best_score,
        })}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {LEVELS.map((level) => {
          const l = byLevel.get(level) ?? { level, total: 0, completed: 0 };
          const pctDone = l.total ? (l.completed / l.total) * 100 : 0;
          return (
            <div key={level}>
              <div className="flex items-center justify-between text-xs">
                <span>{t(levelKey(level))}</span>
                <span className="tabular-nums text-muted-foreground">
                  {l.completed}/{l.total}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-gold"
                  style={{ width: `${pctDone}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-7 overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr className="border-b border-border">
              <th className="py-2 text-left font-medium">{t("admin.colModule")}</th>
              <th className="py-2 text-left font-medium">{t("admin.colLevel")}</th>
              <th className="py-2 text-right font-medium">{t("admin.colScore")}</th>
              <th className="py-2 text-right font-medium">{t("admin.colStatus")}</th>
              <th className="py-2 text-right font-medium">{t("admin.colLastTry")}</th>
            </tr>
          </thead>
          <tbody>
            {data.lessons.map((l, i) => (
              <tr key={i} className="border-b border-border/60 last:border-0">
                <td className="py-2.5 pr-3">{l.title}</td>
                <td className="py-2.5 pr-3 text-xs text-muted-foreground">
                  {t(levelKey(l.level))}
                </td>
                <td className="py-2.5 text-right tabular-nums">
                  {l.attempted ? `${l.score}%` : EMPTY}
                </td>
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
                    {t(
                      l.completed
                        ? "admin.statusDone"
                        : l.attempted
                          ? "admin.statusStarted"
                          : "admin.statusNotStarted",
                    )}
                  </span>
                </td>
                <td className="py-2.5 text-right text-xs text-muted-foreground">
                  {f.shortDate(l.updated_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function Performance({ snapshots, t }: { snapshots: AdminActivity["snapshots"]; t: Translate }) {
  const base = snapshots.find((s) => s.masi)?.masi ?? null;
  const first = Number(snapshots[0]?.value ?? 0) || 1;
  const chart = snapshots.map((s) => ({
    date: s.date.slice(5),
    portefeuille: Number(((Number(s.value) / first) * 100).toFixed(2)),
    masi: base && s.masi ? Number(((Number(s.masi) / base) * 100).toFixed(2)) : null,
  }));

  return (
    <Panel title={t("admin.perfTitle")}>
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
              name={t("pf.legendPortfolio")}
              type="monotone"
              dataKey="portefeuille"
              stroke="var(--gold)"
              strokeWidth={2.5}
              dot={false}
            />
            <Line
              name={t("pf.legendMasi")}
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

function Back({ t }: { t: Translate }) {
  return (
    <Link
      to="/admin"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" /> {t("admin.backAll")}
    </Link>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="surface-raised p-5 sm:p-7">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
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

function Side({ side, t }: { side: "buy" | "sell"; t: Translate }) {
  return (
    <span className={`text-xs ${side === "buy" ? "text-[var(--success)]" : "text-destructive"}`}>
      {t(side === "buy" ? "pf.buyLabel" : "pf.sellLabel")}
    </span>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="surface-raised p-6">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-3 text-2xl font-bold tabular-nums text-gradient-gold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
