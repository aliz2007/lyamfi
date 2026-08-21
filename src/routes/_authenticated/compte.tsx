import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PasswordField, PasswordRules } from "@/components/PasswordField";
import { TextField } from "@/components/TextField";
import { supabase } from "@/integrations/supabase/client";
import { checkPassword, PASSWORD_MAX } from "@/lib/password";
import { isPrincipalAdminEmail, myRoleQuery } from "@/lib/admin";
import { myProfileQuery, updateMyProfile } from "@/lib/profile";
import { callRpc } from "@/lib/rpc";
import { useAuth } from "@/hooks/useAuth";
import { useFormat } from "@/lib/format";
import { useI18n, usePageTitle, type Translate } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/compte")({
  head: () => ({
    meta: [
      { title: "Mon compte | Lyamfi" },
      { name: "description", content: "Gère ton identité, ton mot de passe et ton compte Lyamfi." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

const NAME_MAX = 60;

function AccountPage() {
  const { t } = useI18n();
  const f = useFormat();
  usePageTitle("account.title");

  const { user } = useAuth();
  const { data: role } = useQuery(myRoleQuery);
  const principal = isPrincipalAdminEmail(user?.email);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="rise">
        <h1 className="text-3xl font-bold sm:text-4xl">{t("account.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("account.subtitle")}</p>
      </header>

      <section className="surface-raised p-6">
        <h2 className="text-sm font-semibold">{t("account.info")}</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <Row label={t("account.email")} value={user?.email ?? "…"} />
          <Row label={t("account.createdOn")} value={f.longDate(user?.created_at)} />
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{t("account.role")}</dt>
            <dd>
              {role === "admin" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-accent px-2.5 py-0.5 text-[10px] font-medium text-accent-foreground">
                  <ShieldCheck className="h-3 w-3" />
                  {t(principal ? "account.rolePrincipal" : "account.roleAdmin")}
                </span>
              ) : (
                <span className="text-muted-foreground">{t("account.roleUser")}</span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      <Identity t={t} />
      <ChangePassword email={user?.email ?? null} t={t} />
      <DeleteAccount t={t} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium">{value}</dd>
    </div>
  );
}

/** Prénom et nom : ce qui alimente le « Bonjour … » du tableau de bord. */
function Identity({ t }: { t: Translate }) {
  const qc = useQueryClient();
  const { data: profile } = useQuery(myProfileQuery);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");

  // Le profil arrive après le premier rendu : on remplit les champs quand il
  // est là, sans écraser une saisie déjà commencée.
  useEffect(() => {
    if (!profile) return;
    setFirst((v) => (v ? v : (profile.first_name ?? "")));
    setLast((v) => (v ? v : (profile.last_name ?? "")));
  }, [profile]);

  const save = useMutation({
    mutationFn: () =>
      updateMyProfile(first.trim().slice(0, NAME_MAX), last.trim().slice(0, NAME_MAX)),
    onSuccess: () => {
      toast.success(t("account.identitySaved"));
      qc.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const dirty =
    first.trim() !== (profile?.first_name ?? "") || last.trim() !== (profile?.last_name ?? "");

  return (
    <section className="surface-raised p-6 sm:p-7">
      <h2 className="text-sm font-semibold">{t("account.identity")}</h2>
      <p className="mt-1.5 text-xs text-muted-foreground">{t("account.identityText")}</p>
      <form
        className="mt-5 space-y-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="first-name"
            label={t("auth.firstName")}
            value={first}
            onChange={setFirst}
            autoComplete="given-name"
          />
          <TextField
            id="last-name"
            label={t("auth.lastName")}
            value={last}
            onChange={setLast}
            autoComplete="family-name"
          />
        </div>
        <button
          type="submit"
          disabled={save.isPending || !dirty || !first.trim()}
          className="rounded-full bg-gradient-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40"
        >
          {save.isPending ? t("common.saving") : t("account.saveIdentity")}
        </button>
      </form>
    </section>
  );
}

function ChangePassword({ email, t }: { email: string | null; t: Translate }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const pw = useMemo(() => checkPassword(next), [next]);
  const mismatch = confirm.length > 0 && confirm !== next;

  const change = useMutation({
    mutationFn: async () => {
      if (!email) throw new Error(t("account.errSession"));
      if (!current) throw new Error(t("account.errCurrent"));
      if (!pw.valid) {
        throw new Error(
          pw.tooLong ? t("account.errLong", { max: PASSWORD_MAX }) : t("account.errRules"),
        );
      }
      if (next !== confirm) throw new Error(t("auth.errMismatch"));
      if (next === current) throw new Error(t("account.errSame"));

      // Re-authentification : sans elle, quiconque accède à une session déjà
      // ouverte pourrait changer le mot de passe sans connaître l'ancien.
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: current,
      });
      if (authError) throw new Error(t("account.errWrongCurrent"));

      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success(t("account.passwordUpdated"));
      setCurrent("");
      setNext("");
      setConfirm("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="surface-raised p-6 sm:p-7">
      <h2 className="text-sm font-semibold">{t("account.changePassword")}</h2>
      <form
        className="mt-5 space-y-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          change.mutate();
        }}
      >
        <PasswordField
          id="current-password"
          label={t("account.currentPassword")}
          value={current}
          onChange={setCurrent}
          autoComplete="current-password"
        />
        <PasswordField
          id="next-password"
          label={t("account.newPassword")}
          value={next}
          onChange={setNext}
          autoComplete="new-password"
        />
        <PasswordField
          id="confirm-new-password"
          label={t("account.confirmNewPassword")}
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          invalid={mismatch}
          hint={mismatch ? t("auth.errMismatch") : undefined}
        />

        {next.length > 0 && <PasswordRules value={next} check={pw} max={PASSWORD_MAX} />}

        <button
          type="submit"
          disabled={change.isPending}
          className="w-full rounded-xl bg-gradient-gold py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {change.isPending ? t("common.saving") : t("account.updatePassword")}
        </button>
      </form>
    </section>
  );
}

function DeleteAccount({ t }: { t: Translate }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [phrase, setPhrase] = useState("");
  const word = t("account.deleteWord");

  const remove = useMutation({
    mutationFn: async () => {
      await callRpc<void>("delete_own_account");
      await supabase.auth.signOut();
    },
    onSuccess: () => {
      toast.success(t("account.deleted"));
      navigate({ to: "/" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="rounded-2xl border border-destructive/40 bg-card p-6 sm:p-7">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{t("account.deleteTitle")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t("account.deleteText")}
          </p>
        </div>
      </div>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="mt-5 rounded-full border border-destructive/50 px-5 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
        >
          {t("account.deleteTitle")}
        </button>
      ) : (
        <div className="mt-5 space-y-3">
          <label className="block text-xs text-muted-foreground" htmlFor="delete-confirm">
            {t("account.deleteConfirmLabel", { word })}
          </label>
          <input
            id="delete-confirm"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            autoComplete="off"
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-destructive"
            placeholder={word}
          />
          <div className="flex flex-wrap gap-3">
            <button
              disabled={phrase !== word || remove.isPending}
              onClick={() => remove.mutate()}
              className="rounded-full bg-destructive px-5 py-2.5 text-sm font-semibold text-destructive-foreground disabled:opacity-40"
            >
              {remove.isPending ? t("account.deleting") : t("account.deleteButton")}
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
