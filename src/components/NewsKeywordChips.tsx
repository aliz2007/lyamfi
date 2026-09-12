import { Link } from "@tanstack/react-router";
import { keywordLabel } from "@/components/keywordLabel";
import { useI18n } from "@/lib/i18n";

/**
 * Les puces de mots-clés d'une carte ou d'un article : chacune mène à la page
 * du mot-clé (`/actualites/mot/$kw`).
 *
 * Posées HORS de toute ancre englobante (image ou titre de la carte) :
 * imbriquer une ancre dans une ancre produit un balisage invalide, et le clic
 * ouvrirait l'article au lieu de la page du mot-clé.
 */
export function NewsKeywordChips({ keywords }: { keywords: string[] }) {
  const { t } = useI18n();
  if (keywords.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {keywords.map((kw) => {
        const label = keywordLabel(kw);
        if (!label) return null;
        return (
          <Link
            key={kw}
            to="/actualites/mot/$kw"
            params={{ kw }}
            className="rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/60 hover:text-brand-yellow"
          >
            {label.kind === "company" ? label.text : t(label.key)}
          </Link>
        );
      })}
    </div>
  );
}
