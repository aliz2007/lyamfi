import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LogOut, Menu, ShieldCheck, UserRound, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { myRoleQuery } from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";
import { useT, type Key } from "@/lib/i18n";

// `as const` conserve les chemins littéraux, que <Link to> exige ; le
// `satisfies` vérifie quand même que chaque libellé est une clé connue.
const NAV = [
  { to: "/dashboard", label: "nav.dashboard" },
  { to: "/bourse", label: "nav.market" },
  { to: "/portefeuille", label: "nav.portfolio" },
  { to: "/academie", label: "nav.academy" },
  { to: "/budget", label: "nav.budget" },
] as const satisfies readonly { to: string; label: Key }[];

export function AppShell({ children }: { children: React.ReactNode }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { data: role } = useQuery(myRoleQuery);
  const isAdmin = role === "admin";
  const navigate = useNavigate();

  // signOut() seul ne change pas de page : l'utilisateur resterait sur l'écran
  // en cours, potentiellement la table des comptes de l'espace admin, encore
  // rendue dans le DOM. On quitte donc explicitement vers l'accueil.
  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const active = (to: string) => path.startsWith(to);

  return (
    <div className="relative min-h-screen bg-background">
      <div className="grid-lines h-[38rem]" aria-hidden="true" />

      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6">
          <Link to="/dashboard" className="min-w-0">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={`relative rounded-full px-3.5 py-2 text-sm transition-colors ${
                  active(n.to)
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(n.label)}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm transition-colors ${
                  active("/admin")
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ShieldCheck className="h-4 w-4" /> {t("nav.admin")}
              </Link>
            )}
            <Link
              to="/compte"
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm transition-colors ${
                active("/compte")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <UserRound className="h-4 w-4" /> {t("nav.account")}
            </Link>

            <span className="mx-2 h-5 w-px bg-border" aria-hidden="true" />
            <LanguageSwitcher />

            <button
              onClick={signOut}
              className="ml-2 flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              <LogOut className="h-4 w-4" /> {t("nav.signOut")}
            </button>
          </nav>

          <div className="flex items-center gap-2 lg:hidden">
            <LanguageSwitcher />
            <button
              className="rounded-full border border-border p-2"
              onClick={() => setOpen((o) => !o)}
              aria-label={t("nav.menu")}
              aria-expanded={open}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open && (
          <nav className="flex flex-col gap-1 border-t border-border px-4 py-3 lg:hidden">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className={`rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  active(n.to)
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {t(n.label)}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <ShieldCheck className="h-4 w-4" /> {t("nav.admin")}
              </Link>
            )}
            <Link
              to="/compte"
              onClick={() => setOpen(false)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <UserRound className="h-4 w-4" /> {t("nav.account")}
            </Link>
            <button
              onClick={signOut}
              className="rounded-xl px-3 py-2.5 text-left text-sm text-muted-foreground"
            >
              {t("nav.signOutLong")}
            </button>
          </nav>
        )}
      </header>

      <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">{children}</main>
    </div>
  );
}
