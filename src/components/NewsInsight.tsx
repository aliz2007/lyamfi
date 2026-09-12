import { Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";

/**
 * « L'œil de Lyamfi » : le commentaire de rédaction adossé à un article du
 * fil Boursenews.
 *
 * Partagé entre la carte (fil) et la page article. `prominent` met le bloc en
 * avant sur la page de lecture ; sur la carte il reste un encart discret. La
 * bordure d'accent est posée côté début de ligne (`border-s`), donc à droite
 * en arabe — jamais `border-l`, qui resterait à gauche en RTL.
 *
 * Le corps est du texte brut rendu par React : pas de HTML injecté, comme
 * partout dans l'application.
 */
export function NewsInsight({
  insight,
  prominent = false,
}: {
  insight: { body: string; originalLang: boolean };
  prominent?: boolean;
}) {
  const { t } = useI18n();
  return (
    <aside
      className={`border-s-2 border-[var(--brand-yellow)] ps-4 ${
        prominent ? "surface-raised rounded-e-2xl p-5 sm:p-6" : "py-1"
      }`}
    >
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-yellow">
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        {t("newsfeed.insightTitle")}
      </p>
      <p
        className={`mt-2 whitespace-pre-wrap leading-relaxed ${
          prominent ? "text-sm sm:text-base" : "text-sm"
        }`}
      >
        {insight.body}
      </p>
      {/* Le texte n'a pas (encore) de traduction dans la langue de
          l'interface : on le signale discrètement plutôt que de laisser
          croire à une erreur de langue. */}
      {insight.originalLang && (
        <p className="mt-2 text-[11px] text-muted-foreground/70">
          {t("newsfeed.insightOriginalLang")}
        </p>
      )}
    </aside>
  );
}
