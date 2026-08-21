import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PasswordField, PasswordRules } from "@/components/PasswordField";
import { supabase } from "@/integrations/supabase/client";
import { checkPassword, PASSWORD_MAX } from "@/lib/password";
import { useI18n, usePageTitle, type Key, type Translate } from "@/lib/i18n";

type Mode = "login" | "signup" | "forgot";

const emailSchema = z.string().trim().email().max(255);
const NAME_MAX = 60;

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion | Lyamfi" },
      { name: "description", content: "Connecte-toi ou crée ton compte Lyamfi gratuitement." },
      { property: "og:title", content: "Connexion | Lyamfi" },
      { property: "og:description", content: "Accède à ton parcours d'éducation financière." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { mode?: Mode } => {
    const raw = s["mode"];
    const mode: Mode = raw === "signup" ? "signup" : raw === "forgot" ? "forgot" : "login";
    return { mode };
  },
  component: AuthPage,
});

/** Traduit les messages d'erreur Supabase (anglais) en messages actionnables. */
function translateAuthError(message: string, t: Translate): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return t("auth.errCredentials");
  if (m.includes("email not confirmed")) return t("auth.errUnconfirmed");
  if (m.includes("user already registered") || m.includes("already been registered"))
    return t("auth.errTaken");
  if (m.includes("password should be at least")) return t("auth.errShort");
  if (m.includes("for security purposes") || m.includes("rate limit") || m.includes("too many"))
    return t("auth.errRate");
  if (m.includes("unable to validate email")) return t("auth.errInvalidEmail");
  return message;
}

function AuthPage() {
  const { mode: initialMode } = Route.useSearch();
  const navigate = useNavigate();
  const { t } = useI18n();

  const [mode, setMode] = useState<Mode>(initialMode ?? "login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<null | "confirm" | "reset">(null);

  const isSignup = mode === "signup";
  const isForgot = mode === "forgot";

  const titleKey: Key = isForgot
    ? "auth.forgotTitle"
    : isSignup
      ? "auth.signupTitle"
      : "auth.loginTitle";
  usePageTitle(titleKey);

  const pw = useMemo(() => checkPassword(password), [password]);
  const mismatch = isSignup && confirm.length > 0 && confirm !== password;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setSent(null);
    setConfirm("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedEmail = emailSchema.safeParse(email);
    if (!parsedEmail.success) {
      toast.error(t("auth.errEmail"));
      return;
    }
    const cleanEmail = parsedEmail.data;

    // -------------------------------------------------------- mot de passe oublié
    if (isForgot) {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setLoading(false);
      if (error) {
        toast.error(translateAuthError(error.message, t));
        return;
      }
      // Réponse volontairement identique que le compte existe ou non :
      // révéler l'inverse permettrait d'énumérer les comptes.
      setSent("reset");
      toast.success(t("auth.resetLinkSent"));
      return;
    }

    // ------------------------------------------------------------------ inscription
    if (isSignup) {
      const first = firstName.trim().slice(0, NAME_MAX);
      const last = lastName.trim().slice(0, NAME_MAX);
      if (!first) {
        toast.error(t("auth.errFirstName"));
        return;
      }
      if (!last) {
        toast.error(t("auth.errLastName"));
        return;
      }
      if (!pw.valid) {
        toast.error(
          pw.tooLong
            ? t("auth.errPasswordLong", { max: PASSWORD_MAX })
            : t("auth.errPasswordRules"),
        );
        return;
      }
      if (password !== confirm) {
        toast.error(t("auth.errMismatch"));
        return;
      }

      setLoading(true);
      // Le nom part en majuscules dès l'inscription ; le trigger de la base
      // applique la même règle, donc les deux chemins donnent le même résultat.
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            first_name: first,
            last_name: last.toUpperCase(),
            display_name: `${first} ${last.toUpperCase()}`,
          },
        },
      });
      setLoading(false);

      if (error) {
        toast.error(translateAuthError(error.message, t));
        return;
      }

      // Quand la confirmation par e-mail est active, Supabase renvoie un
      // utilisateur factice sans identité plutôt qu'une erreur, pour ne pas
      // divulguer l'existence du compte. On le détecte pour guider l'utilisateur.
      if (data.user && (data.user.identities?.length ?? 0) === 0) {
        toast.error(t("auth.errTaken"));
        return;
      }

      if (!data.session) {
        setSent("confirm");
        return;
      }
      navigate({ to: "/dashboard" });
      return;
    }

    // -------------------------------------------------------------------- connexion
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    setLoading(false);
    if (error) {
      toast.error(translateAuthError(error.message, t));
      return;
    }
    navigate({ to: "/dashboard" });
  };

  // ---------------------------------------------------------------- écran envoyé
  if (sent) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold">
          {t(sent === "confirm" ? "auth.checkInboxTitle" : "auth.linkSentTitle")}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {t(sent === "confirm" ? "auth.checkInboxText" : "auth.resetSentText", { email })}
        </p>
        <p className="mt-4 text-xs text-muted-foreground">{t("auth.spamHint")}</p>
        <button
          onClick={() => switchMode("login")}
          className="mt-7 w-full rounded-xl border border-border py-3 text-sm font-semibold transition-colors hover:border-primary/50"
        >
          {t("auth.backToLogin")}
        </button>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="text-2xl font-bold">{t(titleKey)}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t(isForgot ? "auth.forgotText" : isSignup ? "auth.signupText" : "auth.loginText")}
      </p>

      <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
        {isSignup && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="first-name"
              label={t("auth.firstName")}
              value={firstName}
              onChange={setFirstName}
              placeholder={t("auth.firstNamePlaceholder")}
              autoComplete="given-name"
            />
            <Field
              id="last-name"
              label={t("auth.lastName")}
              value={lastName}
              onChange={setLastName}
              placeholder={t("auth.lastNamePlaceholder")}
              autoComplete="family-name"
            />
          </div>
        )}

        <Field
          id="email"
          type="email"
          label={t("auth.email")}
          value={email}
          onChange={setEmail}
          placeholder={t("auth.emailPlaceholder")}
          autoComplete="email"
        />

        {!isForgot && (
          <PasswordField
            id="password"
            label={t("auth.password")}
            value={password}
            onChange={setPassword}
            autoComplete={isSignup ? "new-password" : "current-password"}
          />
        )}

        {isSignup && (
          <>
            <PasswordField
              id="confirm"
              label={t("auth.confirmPassword")}
              value={confirm}
              onChange={setConfirm}
              autoComplete="new-password"
              invalid={mismatch}
              hint={mismatch ? t("auth.errMismatch") : undefined}
            />
            <PasswordRules value={password} check={pw} max={PASSWORD_MAX} />
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-gold py-3 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-60"
        >
          {loading
            ? t("common.wait")
            : t(
                isForgot
                  ? "auth.submitForgot"
                  : isSignup
                    ? "auth.submitSignup"
                    : "auth.submitLogin",
              )}
        </button>
      </form>

      <div className="mt-5 space-y-2 text-center">
        {!isForgot && !isSignup && (
          <button
            onClick={() => switchMode("forgot")}
            className="block w-full text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("auth.forgotLink")}
          </button>
        )}
        <button
          onClick={() => switchMode(isSignup ? "login" : "signup")}
          className="block w-full text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {t(isSignup ? "auth.toLogin" : "auth.toSignup")}
        </button>
        {isForgot && (
          <button
            onClick={() => switchMode("login")}
            className="block w-full text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("auth.backToLogin")}
          </button>
        )}
      </div>
    </Shell>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-input bg-background/60 px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={NAME_MAX}
      />
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
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
        <div className="surface-raised rise w-full max-w-md p-8">{children}</div>
      </div>
    </div>
  );
}
