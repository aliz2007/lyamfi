import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  email: z.string().trim().email("Adresse e-mail invalide").max(255),
  password: z.string().min(6, "6 caractères minimum").max(72),
});

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion — Lyamfi" },
      { name: "description", content: "Connecte-toi ou crée ton compte Lyamfi gratuitement." },
      { property: "og:title", content: "Connexion — Lyamfi" },
      { property: "og:description", content: "Accède à ton parcours d'éducation financière." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    mode: s['mode'] === "signup" ? ("signup" as const) : ("login" as const),
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(mode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Formulaire invalide");
      return;
    }
    setLoading(true);
    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: { emailRedirectTo: window.location.origin },
      });
      setLoading(false);
      if (error) return toast.error(error.message);
      if (!data.session) {
        toast.success("Compte créé. Vérifie ta boîte mail pour confirmer ton adresse.");
        return;
      }
      navigate({ to: "/dashboard" });
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });
      setLoading(false);
      if (error) return toast.error(error.message);
      navigate({ to: "/dashboard" });
    }
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
          <h1 className="text-2xl font-bold">
            {isSignup ? "Créer un compte gratuit" : "Se connecter"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isSignup
              ? "Accède aux modules, au simulateur et à ton suivi de progression."
              : "Retrouve ta progression et tes portefeuilles simulés."}
          </p>
          <form onSubmit={submit} className="mt-7 space-y-4">
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
            <div>
              <label className="text-xs text-muted-foreground" htmlFor="password">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                placeholder="••••••••"
                autoComplete={isSignup ? "new-password" : "current-password"}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-gold py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {loading ? "Un instant…" : isSignup ? "Créer mon compte" : "Se connecter"}
            </button>
          </form>
          <button
            onClick={() => setIsSignup((v) => !v)}
            className="mt-5 w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            {isSignup ? "J'ai déjà un compte — me connecter" : "Pas encore de compte — m'inscrire"}
          </button>
        </div>
      </div>
    </div>
  );
}
