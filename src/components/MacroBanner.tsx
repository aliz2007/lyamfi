import { Link } from "@tanstack/react-router";
import { ArrowRight, ChartNoAxesCombined } from "lucide-react";
import { useT } from "@/lib/i18n";

/**
 * Porte d'entrée vers les indicateurs macroéconomiques.
 *
 * Posée en tête des actualités parce que c'est la même lecture : ce qui se
 * passe dans le pays avant ce qui se passe dans la cote. Le liseré doré et le
 * décalage au survol disent qu'on peut cliquer, sans transformer la bande en
 * bouton criard au milieu d'une page de lecture.
 */
export function MacroBanner() {
  const t = useT();

  return (
    <Link
      to="/macroeconomie"
      className="group relative block overflow-hidden rounded-2xl border border-primary/45 bg-[oklch(0.18_0.01_90)] p-5 transition-all hover:border-primary/80 hover:shadow-[var(--shadow-gold)] sm:p-6"
    >
      {/* Reflet qui balaie la bande au survol. Purement décoratif, et neutralisé
          par `prefers-reduced-motion` comme le reste des animations du site. */}
      <span
        aria-hidden="true"
        className="sheen-sweep pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
      />
      <div className="relative flex items-center gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-primary/30 bg-accent">
          <ChartNoAxesCombined className="h-5 w-5 text-primary" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-brand-yellow sm:text-lg">{t("macro.bannerTitle")}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {t("macro.bannerText")}
          </p>
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
      </div>
    </Link>
  );
}
