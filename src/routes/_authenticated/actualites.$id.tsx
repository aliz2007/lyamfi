import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ArticleBody } from "@/components/ArticleBody";
import { NewsInsight } from "@/components/NewsInsight";
import { NewsInsightEditor } from "@/components/NewsInsightEditor";
import { deleteInsight, newsArticleQuery, saveInsight } from "@/lib/newsfeed";
import { myRoleQuery } from "@/lib/admin";
import { useFormat } from "@/lib/format";
import { useI18n, type Key, type Translate } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/actualites/$id")({
  head: () => ({
    meta: [
      { title: "Actualité | Lyamfi" },
      {
        name: "description",
        content: "Une actualité de la Bourse de Casablanca suivie par Lyamfi.",
      },
      { property: "og:title", content: "Actualité | Lyamfi" },
    ],
  }),
  component: ArticlePage,
});

const CATEGORY_KEY: Record<string, Key> = {
  marches: "newsfeed.catMarches",
  actualite: "newsfeed.catActualite",
  decryptage: "newsfeed.catDecryptage",
};

/**
 * Page de lecture d'un article du fil Boursenews. Le paramètre `$id` est le
 * guid (slug) de l'article, tel qu'il apparaît dans l'URL source.
 *
 * ⚠️ Le corps est du TEXTE BRUT moissonné puis nettoyé côté serveur, rendu
 * par `ArticleBody` comme n'importe quel texte saisi : jamais de HTML
 * injecté. C'est la propriété à ne pas perdre : le contenu vient d'un site
 * tiers, il ne doit pas pouvoir exécuter quoi que ce soit chez les membres.
 */
function ArticlePage() {
  const { id } = Route.useParams();
  const { t, lang } = useI18n();
  const f = useFormat();

  const qc = useQueryClient();
  const { data: role } = useQuery(myRoleQuery);
  const isAdmin = role === "admin";
  const { data: article, isLoading, error } = useQuery(newsArticleQuery(id, lang));

  const [editingInsight, setEditingInsight] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["bnews-feed"] });

  const save = useMutation({
    mutationFn: (body: string) => saveInsight(id, body, lang),
    onSuccess: () => {
      toast.success(t("newsfeed.insightSaved"));
      setEditingInsight(false);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeInsight = useMutation({
    mutationFn: () => deleteInsight(id),
    onSuccess: () => {
      toast.success(t("newsfeed.insightDeleted"));
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Le titre de l'onglet suit l'article. `usePageTitle` attend une clé de
  // dictionnaire ; ici le titre est une donnée, d'où l'effet à la main.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.title = article ? `${article.title} | Lyamfi` : t("news.title");
  }, [article, t]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Back t={t} />
        <p className="text-sm text-muted-foreground">{t("newsfeed.bodyLoading")}</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="space-y-4">
        <Back t={t} />
        <div className="glass space-y-2 p-8 text-center">
          <p className="text-sm font-medium">{t("news.notFound")}</p>
          <p className="text-xs text-muted-foreground">{t("news.notFoundHint")}</p>
        </div>
      </div>
    );
  }

  return (
    // Colonne de lecture : au-delà d'une certaine largeur, l'œil peine à
    // retrouver la ligne suivante. `max-w-4xl` garde une longueur confortable.
    <article className="mx-auto max-w-4xl space-y-7">
      <Back t={t} />

      <header className="rise space-y-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
          <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-brand-yellow">
            {t(CATEGORY_KEY[article.category] ?? "newsfeed.catActualite")}
          </span>
          {article.publishedAt && (
            <span className="text-muted-foreground">{f.weekdayDate(article.publishedAt)}</span>
          )}
          <a
            href={article.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-brand-yellow hover:underline"
          >
            {t("newsfeed.source")}
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
          {article.machineTranslated && (
            <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
              {t("newsfeed.autoTranslated")}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">
          {article.title}
        </h1>
        <div className="hairline" aria-hidden="true" />
      </header>

      {article.imageUrl && (
        <img
          src={article.imageUrl}
          alt=""
          className="w-full rounded-2xl border border-border object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}

      {/* « L'œil de Lyamfi » avant le corps : c'est la valeur ajoutée de la
          page, le texte moissonné n'est que la matière. */}
      {article.insight && (
        <div className="rise">
          <NewsInsight insight={article.insight} prominent />
        </div>
      )}

      {isAdmin && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setEditingInsight(!editingInsight)}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/50 px-3.5 py-1.5 text-xs text-brand-yellow transition-colors hover:bg-accent"
            >
              {article.insight ? (
                <Pencil className="h-3.5 w-3.5" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              {t(article.insight ? "newsfeed.insightEdit" : "newsfeed.insightAdd")}
            </button>
            {article.insight && (
              <button
                onClick={() => {
                  if (window.confirm(t("newsfeed.insightDeleteConfirm"))) removeInsight.mutate();
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-destructive/50 px-3.5 py-1.5 text-xs text-destructive transition-colors hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" /> {t("newsfeed.insightDelete")}
              </button>
            )}
          </div>
          {editingInsight && (
            <NewsInsightEditor
              initialBody={article.insight?.body ?? ""}
              pending={save.isPending}
              onSave={(body) => save.mutate(body)}
              onCancel={() => setEditingInsight(false)}
            />
          )}
        </div>
      )}

      {article.body ? (
        <ArticleBody content={article.body} />
      ) : (
        // Le moissonnage du corps a échoué : l'extrait et le lien source
        // restent là, l'écran ne se contente pas d'un vide.
        <div className="space-y-4">
          {article.excerpt && (
            <p className="text-base leading-relaxed text-muted-foreground">{article.excerpt}</p>
          )}
          <p className="text-sm text-muted-foreground">
            <a
              href={article.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-brand-yellow underline-offset-4 hover:underline"
            >
              {t("newsfeed.readArticle")}
              <ExternalLink className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
            </a>
          </p>
        </div>
      )}

      <div className="hairline" aria-hidden="true" />
      <p className="text-xs text-muted-foreground">{t("news.articleFooter")}</p>
    </article>
  );
}

function Back({ t }: { t: Translate }) {
  return (
    <Link
      to="/actualites"
      className="press -mx-2 inline-flex min-h-9 items-center gap-1.5 px-2 text-sm text-muted-foreground transition-colors hover:text-brand-yellow"
    >
      <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t("newsfeed.backToNews")}
    </Link>
  );
}
