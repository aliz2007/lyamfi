import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  GraduationCap,
  LineChart,
  Mail,
  PieChart,
  TrendingUp,
} from "lucide-react";
import heroImg from "@/assets/hero-market.jpg";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n, usePageTitle, type Key } from "@/lib/i18n";

export const CONTACT_EMAIL = "lyamcorpo@gmail.com";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
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
    ],
  }),
  component: Landing,
});

const MODULES: { icon: typeof BarChart3; title: Key; text: Key }[] = [
  { icon: BarChart3, title: "landing.m1Title", text: "landing.m1Text" },
  { icon: PieChart, title: "landing.m2Title", text: "landing.m2Text" },
  { icon: GraduationCap, title: "landing.m3Title", text: "landing.m3Text" },
  { icon: LineChart, title: "landing.m4Title", text: "landing.m4Text" },
];

const STEPS: { title: Key; text: Key }[] = [
  { title: "landing.step1Title", text: "landing.step1Text" },
  { title: "landing.step2Title", text: "landing.step2Text" },
  { title: "landing.step3Title", text: "landing.step3Text" },
];

const STATS: { value: Key; label: Key }[] = [
  { value: "landing.stat1Value", label: "landing.stat1Label" },
  { value: "landing.stat2Value", label: "landing.stat2Label" },
  { value: "landing.stat3Value", label: "landing.stat3Label" },
  { value: "landing.stat4Value", label: "landing.stat4Label" },
];

function Landing() {
  const { t } = useI18n();
  usePageTitle("landing.heroLine1");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <Link
              to="/auth"
              className="hidden rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              {t("landing.signIn")}
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="rounded-full bg-gradient-gold px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              {t("landing.start")}
            </Link>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- héros */}
      <section className="relative overflow-hidden">
        <img
          src={heroImg}
          alt=""
          width={1600}
          height={1000}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/88 to-background" />
        <div className="aurora" aria-hidden="true" />
        <div className="grid-lines" aria-hidden="true" />

        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6 sm:pb-20 sm:pt-28">
          <div className="rise max-w-3xl">
            <h1 className="text-4xl font-extrabold leading-[1.04] sm:text-6xl md:text-7xl">
              {t("landing.heroLine1")}
              <br />
              <span className="text-gradient-gold sheen">{t("landing.heroHighlight")}</span>{" "}
              {t("landing.heroLine2")}
            </h1>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("landing.heroText")}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="glow-gold inline-flex items-center gap-2 rounded-full bg-gradient-gold px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                {t("landing.ctaPrimary")} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/bourse"
                className="rounded-full border border-border px-6 py-3.5 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                {t("landing.ctaSecondary")}
              </Link>
            </div>
          </div>

          <dl className="mt-14 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border/70 bg-border/70 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="bg-card/70 p-5 backdrop-blur-sm sm:p-6">
                <dt className="text-2xl font-bold text-gradient-gold sm:text-3xl">{t(s.value)}</dt>
                <dd className="mt-1.5 text-xs leading-snug text-muted-foreground">{t(s.label)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ----------------------------------------------------------- modules */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="eyebrow">
          <span className="h-px w-6 bg-primary/60" aria-hidden="true" />
          {t("landing.modulesEyebrow")}
        </p>
        <h2 className="mt-4 max-w-xl text-2xl font-bold sm:text-4xl">
          {t("landing.modulesTitle")}
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {MODULES.map((m) => (
            <div key={m.title} className="surface-raised card-hover p-7">
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-primary/25 bg-accent">
                <m.icon className="h-5 w-5 text-primary" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{t(m.title)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(m.text)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ étapes */}
      <section className="relative overflow-hidden border-y border-border/60 bg-card/25">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="eyebrow">
            <span className="h-px w-6 bg-primary/60" aria-hidden="true" />
            {t("landing.stepsEyebrow")}
          </p>
          <h2 className="mt-4 max-w-lg text-2xl font-bold sm:text-4xl">
            {t("landing.stepsTitle")}
          </h2>

          <ol className="mt-12 grid gap-10 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute -top-2 right-0 text-6xl font-extrabold leading-none text-foreground/[0.05] sm:text-7xl"
                >
                  {i + 1}
                </span>
                <span className="hairline block h-px w-full" aria-hidden="true" />
                <h3 className="relative mt-5 text-lg font-semibold">{t(s.title)}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t(s.text)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------------------------------------------- appel à l'action */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="surface-raised relative overflow-hidden p-8 sm:p-14">
          <div className="aurora" aria-hidden="true" />
          <div className="relative flex flex-wrap items-end justify-between gap-8">
            <div className="max-w-lg">
              <TrendingUp className="h-7 w-7 text-primary" />
              <h2 className="mt-5 text-2xl font-bold sm:text-3xl">{t("landing.ctaBandTitle")}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {t("landing.ctaBandText")}
              </p>
            </div>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="glow-gold inline-flex items-center gap-2 rounded-full bg-gradient-gold px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              {t("landing.ctaPrimary")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ contact */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="surface-raised flex flex-wrap items-center justify-between gap-6 p-7 sm:p-9">
          <div>
            <h2 className="text-lg font-semibold">{t("landing.contactTitle")}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{t("landing.contactText")}</p>
          </div>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center gap-2.5 rounded-full border border-primary/40 bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:border-primary/70"
          >
            <Mail className="h-4 w-4" />
            {t("landing.contact")}
            <span className="hidden text-xs font-normal opacity-80 sm:inline">{CONTACT_EMAIL}</span>
          </a>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-10 text-xs text-muted-foreground sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Logo className="opacity-80" />
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center gap-2 transition-colors hover:text-foreground"
            >
              <Mail className="h-3.5 w-3.5" /> {CONTACT_EMAIL}
            </a>
          </div>
          <p className="max-w-2xl leading-relaxed">{t("landing.footerNote")}</p>
          <p>
            © {new Date().getFullYear()} Lyamfi. {t("landing.rights")}
          </p>
        </div>
      </footer>
    </div>
  );
}
