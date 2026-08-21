import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { PasswordField, PasswordRules } from "@/components/PasswordField";
import { supabase } from "@/integrations/supabase/client";
import { checkPassword, PASSWORD_MAX } from "@/lib/password";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n, usePageTitle, type Key } from "@/lib/i18n";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe | Lyamfi" },
      { name: "description", content: "Choisis un nouveau mot de passe pour ton compte Lyamfi." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

type Status = "checking" | "ready" | "invalid" | "saving";

/** Lit une erreur renvoyée par Supabase dans le fragment de l'URL (#error=…). */
function errorFromUrl(): Key | null {
  if (typeof window === "undefined") return null;
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(window.location.search);
  const code = hash.get("error_code") ?? query.get("error_code");
  const description = hash.get("error_description") ?? query.get("error_description");
  if (!code && !description) return null;
  if ((code ?? "").includes("expired") || (description ?? "").toLowerCase().includes("expired"))
    return "reset.expired";
  return "reset.invalid";
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [status, setStatus] = useState<Status>("checking");
  const [reason, setReason] = useState<Key | null>(null);
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
      setReason("reset.used");
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
        pw.tooLong ? t("auth.errPasswordLong", { max: PASSWORD_MAX }) : t("auth.errPasswordRules"),
      );
      return;
    }
    if (password !== confirm) {
      toast.error(t("auth.errMismatch"));
      return;
    }

    setStatus("saving");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus("ready");
      const m = error.message.toLowerCase();
      toast.error(
        m.includes("should be different")
          ? t("reset.sameAsOld")
          : m.includes("session")
            ? t("reset.sessionExpired")
            : error.message,
      );
      return;
    }

    toast.success(t("reset.done"));
    navigate({ to: "/dashboard" });
  };

  usePageTitle("reset.title");

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div className="aurora" aria-hidden="true" />
      <div className="relative flex items-center justify-between px-4 py-5 sm:px-6">
        <Link to="/">
          <Logo />
        </Link>
        <LanguageSwitcher />
      </div>
      <div className="relative flex flex-1 items-center justify-center px-4 pb-16">
        <div className="surface-raised rise w-full max-w-md p-8">
          {status === "checking" && (
            <p className="text-sm text-muted-foreground">{t("reset.checking")}</p>
          )}

          {status === "invalid" && (
            <>
              <h1 className="text-2xl font-bold">{t("reset.invalidTitle")}</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {reason ? t(reason) : t("reset.invalid")}
              </p>
              <Link
                to="/auth"
                search={{ mode: "forgot" }}
                className="mt-7 block w-full rounded-xl bg-gradient-gold py-3 text-center text-sm font-semibold text-primary-foreground"
              >
                {t("reset.askNew")}
              </Link>
            </>
          )}

          {(status === "ready" || status === "saving") && (
            <>
              <h1 className="text-2xl font-bold">{t("reset.title")}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{t("reset.text")}</p>

              <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
                <PasswordField
                  id="new-password"
                  label={t("reset.newPassword")}
                  value={password}
                  onChange={setPassword}
                  autoComplete="new-password"
                />
                <PasswordField
                  id="confirm-password"
                  label={t("auth.confirmPassword")}
                  value={confirm}
                  onChange={setConfirm}
                  autoComplete="new-password"
                  invalid={mismatch}
                  hint={mismatch ? t("auth.errMismatch") : undefined}
                />

                <PasswordRules value={password} check={pw} max={PASSWORD_MAX} />

                <button
                  type="submit"
                  disabled={status === "saving"}
                  className="w-full rounded-xl bg-gradient-gold py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {status === "saving" ? t("common.saving") : t("reset.submit")}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
