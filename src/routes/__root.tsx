import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { CseTickerTape } from "@/components/CseTickerTape";
import { supabase } from "@/integrations/supabase/client";
import { LanguageProvider } from "@/components/LanguageProvider";
import { useT, type Key } from "@/lib/i18n";

function NotFoundComponent() {
  return (
    <LanguageProvider>
      <Message titleKey="common.notFoundTitle" textKey="common.notFoundText" badge="404" />
    </LanguageProvider>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <LanguageProvider>
      <Message
        titleKey="common.errorTitle"
        textKey="common.errorText"
        onRetry={() => {
          router.invalidate();
          reset();
        }}
      />
    </LanguageProvider>
  );
}

/** Écran plein page partagé par le 404 et l'erreur de rendu. */
function Message({
  titleKey,
  textKey,
  badge,
  onRetry,
}: {
  titleKey: Key;
  textKey: Key;
  badge?: string;
  onRetry?: () => void;
}) {
  const t = useT();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="aurora" aria-hidden="true" />
      <div className="relative max-w-md text-center">
        {badge && (
          <p className="text-7xl font-extrabold tracking-tight text-gradient-gold">{badge}</p>
        )}
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-foreground">{t(titleKey)}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(textKey)}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center justify-center rounded-full bg-gradient-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              {t("common.retry")}
            </button>
          )}
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("common.goHome")}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Lyamfi : apprends, simule, investis à la Bourse de Casablanca" },
      {
        name: "description",
        content:
          "Plateforme marocaine d'éducation financière : fiches valeurs BVC, simulateur de portefeuille, modules pédagogiques et calculateur d'intérêts composés.",
      },
      {
        property: "og:title",
        content: "Lyamfi : apprends, simule, investis à la Bourse de Casablanca",
      },
      {
        property: "og:description",
        content:
          "Plateforme marocaine d'éducation financière : fiches valeurs BVC, simulateur de portefeuille, modules pédagogiques et calculateur d'intérêts composés.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "Lyamfi : apprends, simule, investis à la Bourse de Casablanca",
      },
      {
        name: "twitter:description",
        content:
          "Plateforme marocaine d'éducation financière : fiches valeurs BVC, simulateur de portefeuille, modules pédagogiques et calculateur d'intérêts composés.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap",
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  // Le cache React Query survit à la déconnexion (une seule instance par
  // chargement de page, gcTime de 5 min) et aucune clé n'est indexée par
  // utilisateur. Sans purge, le compte suivant connecté dans le même onglet
  // réafficherait brièvement les données du précédent, y compris la table
  // des comptes de l'espace admin. On vide donc le cache à chaque changement
  // de titulaire de session.
  useEffect(() => {
    let currentUserId: string | null | undefined;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user?.id ?? null;
      if (currentUserId !== undefined && currentUserId !== nextUserId) {
        queryClient.clear();
      }
      currentUserId = nextUserId;
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <CseTickerTape />
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <Toaster />
      </LanguageProvider>
    </QueryClientProvider>
  );
}
