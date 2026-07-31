import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  GraduationCap,
  LineChart,
  PieChart,
  ShieldCheck,
} from "lucide-react";
import heroImg from "@/assets/hero-market.jpg";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lyamfi — Apprends, simule, investis à la Bourse de Casablanca" },
      {
        name: "description",
        content:
          "Plateforme marocaine d'éducation financière : fiches valeurs BVC, simulateur de portefeuille, modules pédagogiques et calculateur d'intérêts composés.",
      },
      { property: "og:title", content: "Lyamfi — la bourse marocaine expliquée simplement" },
      {
        property: "og:description",
        content:
          "Apprends la Bourse de Casablanca, simule un portefeuille et projette ton épargne.",
      },
    ],
  }),
  component: Landing,
});

const MODULES = [
  {
    icon: BarChart3,
    title: "Bourse BVC",
    text: "Fiches valeurs cotées : cours, secteur, capitalisation, PER, BPA, rendement, PEG et cours cible.",
  },
  {
    icon: PieChart,
    title: "Simulateur de portefeuille",
    text: "Construis une allocation virtuelle et mesure concentration, rendement pondéré et diversification.",
  },
  {
    icon: GraduationCap,
    title: "Académie",
    text: "Parcours Débutant, Intermédiaire et Avancé : leçons courtes, quiz de validation et badges.",
  },
  {
    icon: LineChart,
    title: "Intérêts composés",
    text: "Projette ton épargne mensuelle sur 5, 10 ou 30 ans et visualise l'effet boule de neige.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <Link
              to="/auth"
              className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Connexion
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="rounded-full bg-gradient-gold px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Commencer
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <img
          src={heroImg}
          alt=""
          width={1600}
          height={1000}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/85 to-background" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-36">
          <div className="reveal max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3.5 py-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Éducation financière —
              Bourse de Casablanca
            </span>
            <h1 className="mt-7 text-4xl font-extrabold leading-[1.05] sm:text-6xl md:text-7xl">
              Apprends, simule,
              <br />
              investis —{" "}
              <span className="text-gradient-gold">la bourse marocaine</span> expliquée
              simplement.
            </h1>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Lyamfi réunit les valeurs de la BVC, un simulateur de portefeuille et un parcours
              pédagogique en français, pour comprendre avant d'investir.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="glow-gold inline-flex items-center gap-2 rounded-full bg-gradient-gold px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                Créer un compte gratuit <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/bourse"
                className="rounded-full border border-border px-6 py-3.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Explorer les valeurs
              </Link>
            </div>
          </div>

          <dl className="mt-20 grid max-w-3xl grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              ["20", "valeurs suivies"],
              ["6", "leçons + quiz"],
              ["3", "niveaux"],
              ["0 MAD", "pour commencer"],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="text-3xl font-bold text-gradient-gold sm:text-4xl">{v}</dt>
                <dd className="mt-1 text-xs text-muted-foreground sm:text-sm">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="max-w-xl text-2xl font-bold sm:text-4xl">
          Quatre modules pour passer de la curiosité à la méthode.
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {MODULES.map((m) => (
            <div key={m.title} className="surface-card p-7 transition-colors hover:border-primary/40">
              <m.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-5 text-lg font-semibold">{m.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="surface-card p-8 sm:p-12">
          <p className="text-sm text-muted-foreground">Ils apprennent avec Lyamfi</p>
          <blockquote className="mt-5 max-w-3xl text-xl font-medium leading-snug sm:text-2xl">
            « Je comprenais le mot PER sans savoir quoi en faire. En trois leçons et un
            portefeuille simulé, tout s'est éclairci. »
          </blockquote>
          <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4 text-sm text-muted-foreground">
            <span>Étudiants — Casablanca</span>
            <span>Jeunes actifs — Rabat</span>
            <span>Diaspora — Europe</span>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-xs text-muted-foreground sm:px-6">
          <Logo className="opacity-80" />
          <p>
            Outil pédagogique, ne constitue pas un conseil en investissement. Les données de
            marché affichées sont indicatives.
          </p>
          <p>© {new Date().getFullYear()} Lyamfi</p>
        </div>
      </footer>
    </div>
  );
}
