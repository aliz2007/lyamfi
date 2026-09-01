import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { ArticleBody } from "@/components/ArticleBody";
import { newsPostQuery } from "@/lib/news";
import { useFormat } from "@/lib/format";
import { useI18n, type Translate } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/actualites/$id")({
  head: () => ({
    meta: [
      { title: "Actualité | Lyamfi" },
      {
        name: "description",
        content: "Une actualité de la Bourse de Casablanca publiée par Lyamfi.",
      },
      { property: "og:title", content: "Actualité | Lyamfi" },
    ],
  }),
  component: ArticlePage,
});

function ArticlePage() {
  const { id } = Route.useParams();
  const { t } = useI18n();
  const f = useFormat();

  const { data: post, isLoading, error } = useQuery(newsPostQuery(id));

  // Le titre de l'onglet suit l'article. `usePageTitle` attend une clé de
  // dictionnaire ; ici le titre est une donnée, d'où l'effet à la main.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.title = post ? `${post.title} | Lyamfi` : t("news.title");
  }, [post, t]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Back t={t} />
        <p className="text-sm text-muted-foreground">{t("news.loading")}</p>
      </div>
    );
  }

  if (error || !post) {
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
        <p className="text-sm font-medium text-brand-yellow">{f.weekdayDate(post.publishedAt)}</p>
        <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">
          {post.title}
        </h1>
        <div className="hairline" aria-hidden="true" />
      </header>

      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt=""
          className="w-full rounded-2xl border border-border object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}

      <ArticleBody content={post.body} />

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
      <ArrowLeft className="h-4 w-4" /> {t("news.back")}
    </Link>
  );
}
