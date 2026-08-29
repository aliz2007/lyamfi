import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { hasStoredSession } from "@/lib/session";
import { useT } from "@/lib/i18n";

/**
 * Renvoie vers le tableau de bord un visiteur déjà connecté.
 *
 * Enveloppe les deux pages publiques qui n'ont plus de raison d'être une fois
 * la session ouverte : l'accueil et le formulaire de connexion.
 *
 * ⚠️ L'ordre des rendus est contraint par l'hydratation. Le serveur rend la
 * page publique ; si le premier rendu client rendait autre chose, React
 * signalerait une divergence. Le composant rend donc TOUJOURS ses enfants au
 * premier passage, et ne bascule sur l'écran d'attente qu'ensuite, depuis un
 * effet.
 *
 * L'écran d'attente n'est montré qu'à qui a un jeton rangé dans le navigateur.
 * Un visiteur anonyme voit l'accueil immédiatement, sans le moindre voile :
 * c'est la page vitrine, elle doit s'afficher tout de suite.
 */
export function SessionRedirect({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const t = useT();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!hasStoredSession()) return;
    setChecking(true);

    let cancelled = false;
    void supabase.auth
      .getSession()
      .then(({ data }) => {
        if (cancelled) return;
        // `replace` plutôt que `push` : revenir en arrière depuis le tableau de
        // bord doit sortir du site, pas rejouer la redirection en boucle.
        if (data.session) navigate({ to: "/dashboard", replace: true });
        else setChecking(false);
      })
      .catch(() => {
        // Jeton illisible ou service injoignable : on montre la page publique,
        // d'où l'utilisateur peut toujours se connecter à la main.
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (checking) return <Splash label={t("auth.restoring")} />;
  return <>{children}</>;
}

/** Voile plein écran, aux couleurs de la marque, le temps de la vérification. */
function Splash({ label }: { label: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-6">
      <div className="flex flex-col items-center gap-6">
        <Logo />
        <span
          className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-[var(--brand-yellow)]"
          role="status"
          aria-label={label}
        />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
