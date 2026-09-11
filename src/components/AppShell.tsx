import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LogOut, Menu, ShieldCheck, UserRound, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { myRoleQuery } from "@/lib/admin";
import { signOutCompletely } from "@/lib/session";
import { useT, type Key } from "@/lib/i18n";

// `as const` conserve les chemins littéraux, que <Link to> exige ; le
// `satisfies` vérifie quand même que chaque libellé est une clé connue.
const NAV = [
  { to: "/dashboard", label: "nav.dashboard" },
  { to: "/bourse", label: "nav.market" },
  { to: "/portefeuille", label: "nav.portfolio" },
  { to: "/classement", label: "nav.leaderboard" },
  { to: "/academie", label: "nav.academy" },
  { to: "/actualites", label: "nav.news" },
  { to: "/simulateurs", label: "nav.simulators" },
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
    await signOutCompletely();
    navigate({ to: "/" });
  };

  const active = (to: string) => path.startsWith(to);

  return (
    <div className="relative min-h-screen bg-background">
      <div className="grid-lines h-[38rem]" aria-hidden="true" />

      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="safe-x mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2.5 sm:gap-4 sm:py-3">
          <Link to="/dashboard" className="min-w-0">
            <Logo compact />
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

          <div className="flex items-center gap-1.5 lg:hidden">
            <LanguageSwitcher />
            <button
              className="press grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setOpen((o) => !o)}
              aria-label={t("nav.menu")}
              aria-expanded={open}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open && (
          // `rise` : le panneau se déplie au lieu d'apparaître d'un coup, ce
          // qui rattache visuellement le menu au bouton qui vient de l'ouvrir.
          <nav className="rise safe-x flex max-h-[70svh] flex-col gap-1 overflow-y-auto border-t border-border py-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className={`press rounded-xl px-3 py-3 text-[15px] transition-colors ${
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
                className="press flex items-center gap-1.5 rounded-xl px-3 py-3 text-[15px] text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <ShieldCheck className="h-4 w-4" /> {t("nav.admin")}
              </Link>
            )}
            <Link
              to="/compte"
              onClick={() => setOpen(false)}
              className="press flex items-center gap-1.5 rounded-xl px-3 py-3 text-[15px] text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <UserRound className="h-4 w-4" /> {t("nav.account")}
            </Link>
            <button
              onClick={signOut}
              className="press rounded-xl px-3 py-3 text-start text-[15px] text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {t("nav.signOutLong")}
            </button>
          </nav>
        )}
      </header>

      <main className="safe-x relative mx-auto w-full max-w-7xl py-6 sm:py-12">{children}</main>
    </div>
  );
}
