import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { PasswordField, PasswordRules } from "@/components/PasswordField";
import { supabase } from "@/integrations/supabase/client";
import { checkPassword, PASSWORD_MAX } from "@/lib/password";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe — Lyamfi" },
      { name: "description", content: "Choisis un nouveau mot de passe pour ton compte Lyamfi." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

type Status = "checking" | "ready" | "invalid" | "saving";

/** Lit une erreur renvoyée par Supabase dans le fragment de l'URL (#error=…). */
function errorFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(window.location.search);
  const code = hash.get("error_code") ?? query.get("error_code");
  const description = hash.get("error_description") ?? query.get("error_description");
  if (!code && !description) return null;
  if ((code ?? "").includes("expired") || (description ?? "").toLowerCase().includes("expired"))
    return "Ce lien a expiré. Demande-en un nouveau depuis la page de connexion.";
  return "Ce lien n'est plus valide. Demande-en un nouveau depuis la page de connexion.";
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("checking");
  const [reason, setReason] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const pw = useMemo(() => checkPassword(password), [password]);
  const mismatch = confirm.length > 0 && confirm !== password;

  useEffect(() => {
    const urlError = errorFromUrl();
    if (urlError) {
      setReason(urlError);
      setStatus("invalid");
      return;
    }

    let cancelled = false;

    // Le lien de récupération crée une session via detectSessionInUrl.
    // On écoute l'événement ET on interroge la session : selon le flux
    // (implicite ou PKCE) l'un ou l'autre arrive en premier.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) {
        if (!cancelled) setStatus("ready");
      }
    });

    // Pas de minuterie ici : getSession() ne résout qu'une fois l'échange du
    // jeton de récupération terminé, ce qui inclut un aller-retour réseau.
    // Une minuterie fixe déclarait « lien invalide » un lien parfaitement
    // valide dès que la connexion dépassait le délai.
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) {
        setStatus("ready");
        return;
      }
      setReason(
        "Ce lien n'est plus valide ou a déjà été utilisé. Demande-en un nouveau depuis la page de connexion.",
      );
      setStatus((s) => (s === "checking" ? "invalid" : s));
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pw.valid) {
      toast.error(
        pw.tooLong
          ? `Le mot de passe ne peut pas dépasser ${PASSWORD_MAX} caractères.`
          : "Ton mot de passe ne remplit pas encore toutes les conditions ci-dessous.",
      );
      return;
    }
    if (password !== confirm) {
      toast.error("Les deux mots de passe ne sont pas identiques.");
      return;
    }

    setStatus("saving");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus("ready");
      const m = error.message.toLowerCase();
      toast.error(
        m.includes("should be different")
          ? "Choisis un mot de passe différent de l'ancien."
          : m.includes("session")
            ? "Ta session de réinitialisation a expiré. Demande un nouveau lien."
            : error.message,
      );
      return;
    }

    toast.success("Mot de passe mis à jour.");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="px-4 py-5 sm:px-6">
        <Link to="/">
          <Logo />
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="surface-card w-full max-w-md p-8">
          {status === "checking" && (
            <p className="text-sm text-muted-foreground">Vérification du lien…</p>
          )}

          {status === "invalid" && (
            <>
              <h1 className="text-2xl font-bold">Lien invalide</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{reason}</p>
              <Link
                to="/auth"
                search={{ mode: "forgot" }}
                className="mt-7 block w-full rounded-xl bg-gradient-gold py-3 text-center text-sm font-semibold text-primary-foreground"
              >
                Demander un nouveau lien
              </Link>
            </>
          )}

          {(status === "ready" || status === "saving") && (
            <>
              <h1 className="text-2xl font-bold">Nouveau mot de passe</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Choisis un mot de passe que tu n'utilises nulle part ailleurs.
              </p>

              <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
                <PasswordField
                  id="new-password"
                  label="Nouveau mot de passe"
                  value={password}
                  onChange={setPassword}
                  autoComplete="new-password"
                />
                <PasswordField
                  id="confirm-password"
                  label="Confirme le mot de passe"
                  value={confirm}
                  onChange={setConfirm}
                  autoComplete="new-password"
                  invalid={mismatch}
                  hint={mismatch ? "Les deux mots de passe ne sont pas identiques." : undefined}
                />

                <PasswordRules value={password} check={pw} max={PASSWORD_MAX} />

                <button
                  type="submit"
                  disabled={status === "saving"}
                  className="w-full rounded-xl bg-gradient-gold py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {status === "saving" ? "Enregistrement…" : "Enregistrer le mot de passe"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
