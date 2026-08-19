import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PasswordField, PasswordRules } from "@/components/PasswordField";
import { supabase } from "@/integrations/supabase/client";
import { checkPassword, PASSWORD_MAX } from "@/lib/password";
import { myRoleQuery } from "@/lib/admin";
import { callRpc } from "@/lib/rpc";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/compte")({
  head: () => ({
    meta: [
      { title: "Mon compte — Lyamfi" },
      { name: "description", content: "Gère ton mot de passe et ton compte Lyamfi." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

/** Mot à saisir pour confirmer la suppression — évite un clic accidentel. */
const DELETE_PHRASE = "SUPPRIMER";

function AccountPage() {
  const { user } = useAuth();
  const { data: role } = useQuery(myRoleQuery);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="text-3xl font-bold sm:text-4xl">Mon compte</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Modifie ton mot de passe ou supprime définitivement ton compte.
        </p>
      </header>

      <section className="surface-card p-6">
        <h2 className="text-sm font-semibold">Informations</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <Row label="E-mail" value={user?.email ?? "—"} />
          <Row
            label="Compte créé le"
            value={
              user?.created_at
                ? new Date(user.created_at).toLocaleDateString("fr-MA", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "—"
            }
          />
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Rôle</dt>
            <dd>
              {role === "admin" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-accent px-2.5 py-0.5 text-[10px] font-medium text-accent-foreground">
                  <ShieldCheck className="h-3 w-3" /> Administrateur
                </span>
              ) : (
                <span className="text-muted-foreground">Utilisateur</span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      <ChangePassword email={user?.email ?? null} />
      <DeleteAccount />
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

function ChangePassword({ email }: { email: string | null }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const pw = useMemo(() => checkPassword(next), [next]);
  const mismatch = confirm.length > 0 && confirm !== next;

  const change = useMutation({
    mutationFn: async () => {
      if (!email) throw new Error("Session expirée. Reconnecte-toi.");
      if (!current) throw new Error("Saisis ton mot de passe actuel.");
      if (!pw.valid) {
        throw new Error(
          pw.tooLong
            ? `Le nouveau mot de passe ne peut pas dépasser ${PASSWORD_MAX} caractères.`
            : "Le nouveau mot de passe ne remplit pas toutes les conditions ci-dessous.",
        );
      }
      if (next !== confirm) throw new Error("Les deux mots de passe ne sont pas identiques.");
      if (next === current) throw new Error("Choisis un mot de passe différent de l'actuel.");

      // Re-authentification : sans elle, quiconque accède à une session déjà
      // ouverte pourrait changer le mot de passe sans connaître l'ancien.
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: current,
      });
      if (authError) throw new Error("Mot de passe actuel incorrect.");

      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Mot de passe mis à jour.");
      setCurrent("");
      setNext("");
      setConfirm("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="surface-card p-6 sm:p-7">
      <h2 className="text-sm font-semibold">Changer de mot de passe</h2>
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
          label="Mot de passe actuel"
          value={current}
          onChange={setCurrent}
          autoComplete="current-password"
        />
        <PasswordField
          id="next-password"
          label="Nouveau mot de passe"
          value={next}
          onChange={setNext}
          autoComplete="new-password"
        />
        <PasswordField
          id="confirm-new-password"
          label="Confirme le nouveau mot de passe"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          invalid={mismatch}
          hint={mismatch ? "Les deux mots de passe ne sont pas identiques." : undefined}
        />

        {next.length > 0 && <PasswordRules value={next} check={pw} max={PASSWORD_MAX} />}

        <button
          type="submit"
          disabled={change.isPending}
          className="w-full rounded-xl bg-gradient-gold py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {change.isPending ? "Enregistrement…" : "Mettre à jour le mot de passe"}
        </button>
      </form>
    </section>
  );
}

function DeleteAccount() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [phrase, setPhrase] = useState("");

  const remove = useMutation({
    mutationFn: async () => {
      await callRpc<void>("delete_own_account");
      await supabase.auth.signOut();
    },
    onSuccess: () => {
      toast.success("Compte supprimé.");
      navigate({ to: "/" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="rounded-2xl border border-destructive/40 bg-card p-6 sm:p-7">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Supprimer mon compte</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Cette action est <span className="font-medium text-foreground">définitive</span>. Ton
            portefeuille virtuel, tes ordres, ta progression pédagogique et tes badges seront
            effacés et ne pourront pas être récupérés.
          </p>
        </div>
      </div>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="mt-5 rounded-full border border-destructive/50 px-5 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
        >
          Supprimer mon compte
        </button>
      ) : (
        <div className="mt-5 space-y-3">
          <label className="block text-xs text-muted-foreground" htmlFor="delete-confirm">
            Pour confirmer, saisis{" "}
            <span className="font-semibold text-foreground">{DELETE_PHRASE}</span> ci-dessous.
          </label>
          <input
            id="delete-confirm"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            autoComplete="off"
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-destructive"
            placeholder={DELETE_PHRASE}
          />
          <div className="flex flex-wrap gap-3">
            <button
              disabled={phrase !== DELETE_PHRASE || remove.isPending}
              onClick={() => remove.mutate()}
              className="rounded-full bg-destructive px-5 py-2.5 text-sm font-semibold text-destructive-foreground disabled:opacity-40"
            >
              {remove.isPending ? "Suppression…" : "Supprimer définitivement"}
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setPhrase("");
              }}
              className="rounded-full border border-border px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
