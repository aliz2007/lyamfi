import { Link } from "@tanstack/react-router";
import { ExternalLink, Newspaper } from "lucide-react";
import type { ReactNode } from "react";
import { NewsInsight } from "@/components/NewsInsight";
import { NewsKeywordChips } from "@/components/NewsKeywordChips";
import { SOURCE_LABEL, type NewsFeedItem } from "@/lib/newsfeed";
import type { Formatter } from "@/lib/format";
import type { Key, Translate } from "@/lib/i18n";

const CATEGORY_KEY: Record<string, Key> = {
  marches: "newsfeed.catMarches",
  actualite: "newsfeed.catActualite",
  decryptage: "newsfeed.catDecryptage",
};

/**
 * Une carte du fil : image, chips catégorie et source, titre, extrait, puces
 * de mots-clés, et le commentaire de rédaction quand il existe.
 *
 * Partagée entre le fil (`actualites.index`) et la page par mot-clé
 * (`actualites.mot.$kw`). Les commandes d'administration arrivent par
 * `adminSlot` : la carte ne connaît ni les mutations ni l'état d'édition,
 * elle se contente de réserver la place — et la page par mot-clé, en lecture
 * seule, n'en fournit pas.
 *
 * L'image et le titre mènent à l'article ; puces et commandes sont posées
 * HORS de ces liens : imbriquer interactive dans ancre produit un balisage
 * invalide, et cliquer une puce ouvrirait l'article au passage.
 */
export function NewsCard({
  item,
  t,
  f,
  adminSlot,
}: {
  item: NewsFeedItem;
  t: Translate;
  f: Formatter;
  adminSlot?: ReactNode;
}) {
  return (
    <article className="surface-raised card-hover group flex flex-col overflow-hidden">
      <Link
        to="/actualites/$id"
        params={{ id: item.guid }}
        className="relative block h-40 overflow-hidden bg-[oklch(0.22_0.006_90)]"
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <span className="grid h-full w-full place-items-center">
            <Newspaper className="h-8 w-8 text-muted-foreground/40" />
          </span>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="rounded-full bg-accent px-2.5 py-0.5 font-medium text-brand-yellow">
            {t(CATEGORY_KEY[item.category] ?? "newsfeed.catActualite")}
          </span>
          {/* La source est une donnée (pas une clé i18n) : Boursenews,
              Le Boursier — Medias24 ou AlphaBourse. */}
          <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
            {SOURCE_LABEL[item.source]}
          </span>
          {item.publishedAt && (
            <span className="text-muted-foreground">{f.weekdayDate(item.publishedAt)}</span>
          )}
        </div>

        <Link to="/actualites/$id" params={{ id: item.guid }} className="mt-2.5 block">
          <h2 className="text-base font-bold leading-snug transition-colors group-hover:text-brand-yellow">
            {item.title}
          </h2>
        </Link>

        {/* Trois lignes, coupées par le CSS : l'article entier se lit sur sa
            page, pas dans le flux. */}
        {item.excerpt && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {item.excerpt}
          </p>
        )}

        {item.keywords.length > 0 && (
          <div className="mt-3">
            <NewsKeywordChips keywords={item.keywords} />
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 underline-offset-4 transition-colors hover:text-brand-yellow hover:underline"
          >
            {t("newsfeed.source")}
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
          {item.machineTranslated && (
            <span className="rounded-full border border-border px-2 py-0.5 text-[11px]">
              {t("newsfeed.autoTranslated")}
            </span>
          )}
        </div>

        {item.insight && (
          <div className="mt-4">
            <NewsInsight insight={item.insight} />
          </div>
        )}

        {adminSlot}
      </div>
    </article>
  );
}
