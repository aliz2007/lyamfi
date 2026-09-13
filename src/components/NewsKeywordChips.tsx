import { Link } from "@tanstack/react-router";
import { keywordLabel } from "@/components/keywordLabel";
import { useI18n } from "@/lib/i18n";
import { parseKeywordId } from "@/lib/news-keywords";

/**
 * Les puces de mots-clés d'une carte ou d'un article.
 *
 * Une puce THÈME mène à la page du mot-clé (`/actualites/mot/$kw`) ; une
 * puce SOCIÉTÉ mène directement à la fiche de la valeur (`/bourse/$ticker`)
 * — c'est désormais la fiche qui présente les articles liés, en bas de page
 * (`StockNews`), avec le renvoi vers la page du mot-clé.
 *
 * Posées HORS de toute ancre englobante (image ou titre de la carte) :
 * imbriquer une ancre dans une ancre produit un balisage invalide, et le clic
 * ouvrirait l'article au lieu de la puce.
 */
export function NewsKeywordChips({ keywords }: { keywords: string[] }) {
  const { t } = useI18n();
  if (keywords.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {keywords.map((kw) => {
        const parsed = parseKeywordId(kw);
        const label = keywordLabel(kw);
        if (!parsed || !label) return null;
        const className =
          "rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/60 hover:text-brand-yellow";
        return parsed.kind === "company" ? (
          <Link
            key={kw}
            to="/bourse/$ticker"
            params={{ ticker: parsed.ticker }}
            className={className}
          >
            {label.kind === "company" ? label.text : parsed.ticker}
          </Link>
        ) : (
          <Link key={kw} to="/actualites/mot/$kw" params={{ kw }} className={className}>
            {label.kind === "theme" ? t(label.key) : kw}
          </Link>
        );
      })}
    </div>
  );
}
