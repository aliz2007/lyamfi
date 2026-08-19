import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Logo } from "@/components/Logo";
import { PasswordField, PasswordRules } from "@/components/PasswordField";
import { supabase } from "@/integrations/supabase/client";
import { checkPassword, PASSWORD_MAX } from "@/lib/password";

type Mode = "login" | "signup" | "forgot";

const emailSchema = z.string().trim().email("Adresse e-mail invalide").max(255);

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion — Lyamfi" },
      { name: "description", content: "Connecte-toi ou crée ton compte Lyamfi gratuitement." },
      { property: "og:title", content: "Connexion — Lyamfi" },
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
function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "E-mail ou mot de passe incorrect.";
  if (m.includes("email not confirmed"))
    return "Ton adresse n'est pas encore confirmée. Vérifie ta boîte mail (et les spams).";
  if (m.includes("user already registered") || m.includes("already been registered"))
    return "Un compte existe déjà avec cette adresse. Connecte-toi ou réinitialise ton mot de passe.";
  if (m.includes("password should be at least"))
    return "Mot de passe trop court.";
  if (m.includes("for security purposes") || m.includes("rate limit") || m.includes("too many"))
    return "Trop de tentatives. Patiente une minute avant de réessayer.";
  if (m.includes("unable to validate email"))
    return "Adresse e-mail invalide.";
  return message;
}

function AuthPage() {
  const { mode: initialMode } = Route.useSearch();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>(initialMode ?? "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<null | "confirm" | "reset">(null);

  const isSignup = mode === "signup";
  const isForgot = mode === "forgot";

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
      toast.error(parsedEmail.error.issues[0]?.message ?? "Adresse e-mail invalide");
      return;
    }
    const cleanEmail = parsedEmail.data;

    // ---------------------------------------------------------- mot de passe oublié
    if (isForgot) {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setLoading(false);
      if (error) {
        toast.error(translateAuthError(error.message));
        return;
      }
      // Réponse volontairement identique que le compte existe ou non :
      // révéler l'inverse permettrait d'énumérer les comptes.
      setSent("reset");
      toast.success("Si un compte existe pour cette adresse, un lien vient d'être envoyé.");
      return;
    }

    // ---------------------------------------------------------------- inscription
    if (isSignup) {
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

      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      setLoading(false);

      if (error) {
        toast.error(translateAuthError(error.message));
        return;
      }

      // Quand la confirmation par e-mail est active, Supabase renvoie un
      // utilisateur factice sans identité plutôt qu'une erreur, pour ne pas
      // divulguer l'existence du compte. On le détecte pour guider l'utilisateur.
      if (data.user && (data.user.identities?.length ?? 0) === 0) {
        toast.error(
          "Un compte existe déjà avec cette adresse. Connecte-toi, ou utilise « Mot de passe oublié ».",
        );
        return;
      }

      if (!data.session) {
        setSent("confirm");
        return;
      }
      navigate({ to: "/dashboard" });
      return;
    }

    // ------------------------------------------------------------------ connexion
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    setLoading(false);
    if (error) {
      toast.error(translateAuthError(error.message));
      return;
    }
    navigate({ to: "/dashboard" });
  };

  // ------------------------------------------------------------------ écran envoyé
  if (sent) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold">
          {sent === "confirm" ? "Vérifie ta boîte mail" : "Lien envoyé"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {sent === "confirm" ? (
            <>
              Un lien de confirmation vient d'être envoyé à{" "}
              <span className="font-medium text-foreground">{email}</span>. Clique dessus pour
              activer ton compte.
            </>
          ) : (
            <>
              Si un compte existe pour{" "}
              <span className="font-medium text-foreground">{email}</span>, tu recevras un lien
              de réinitialisation. Il expire au bout d'une heure.
            </>
          )}
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          Rien reçu au bout de quelques minutes ? Regarde dans les spams.
        </p>
        <button
          onClick={() => switchMode("login")}
          className="mt-7 w-full rounded-xl border border-border py-3 text-sm font-semibold transition-colors hover:border-primary/50"
        >
          Retour à la connexion
        </button>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="text-2xl font-bold">
        {isForgot
          ? "Mot de passe oublié"
          : isSignup
            ? "Créer un compte gratuit"
            : "Se connecter"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {isForgot
          ? "Indique ton adresse : on t'envoie un lien pour choisir un nouveau mot de passe."
          : isSignup
            ? "Accède aux modules, au simulateur et à ton suivi de progression."
            : "Retrouve ta progression et tes portefeuilles simulés."}
      </p>

      <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
        <div>
          <label className="text-xs text-muted-foreground" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            placeholder="prenom@exemple.ma"
            autoComplete="email"
          />
        </div>

        {!isForgot && (
          <PasswordField
            id="password"
            label="Mot de passe"
            value={password}
            onChange={setPassword}
            autoComplete={isSignup ? "new-password" : "current-password"}
          />
        )}

        {isSignup && (
          <>
            <PasswordField
              id="confirm"
              label="Confirme le mot de passe"
              value={confirm}
              onChange={setConfirm}
              autoComplete="new-password"
              invalid={mismatch}
              hint={mismatch ? "Les deux mots de passe ne sont pas identiques." : undefined}
            />

            <PasswordRules value={password} check={pw} max={PASSWORD_MAX} />
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-gold py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {loading
            ? "Un instant…"
            : isForgot
              ? "Envoyer le lien"
              : isSignup
                ? "Créer mon compte"
                : "Se connecter"}
        </button>
      </form>

      <div className="mt-5 space-y-2 text-center">
        {!isForgot && !isSignup && (
          <button
            onClick={() => switchMode("forgot")}
            className="block w-full text-xs text-muted-foreground hover:text-foreground"
          >
            Mot de passe oublié ?
          </button>
        )}
        <button
          onClick={() => switchMode(isSignup ? "login" : "signup")}
          className="block w-full text-xs text-muted-foreground hover:text-foreground"
        >
          {isSignup
            ? "J'ai déjà un compte — me connecter"
            : "Pas encore de compte — m'inscrire"}
        </button>
        {isForgot && (
          <button
            onClick={() => switchMode("login")}
            className="block w-full text-xs text-muted-foreground hover:text-foreground"
          >
            Retour à la connexion
          </button>
        )}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="px-4 py-5 sm:px-6">
        <Link to="/">
          <Logo />
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="surface-card w-full max-w-md p-8">{children}</div>
      </div>
    </div>
  );
}
