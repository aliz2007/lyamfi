import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ArrowLeft, LineChart, Tag } from "lucide-react";
import { NewsCard } from "@/components/NewsCard";
import { THEME_KEY } from "@/components/keywordLabel";
import { newsKeywordQuery } from "@/lib/newsfeed";
import { companyNameForTicker, parseKeywordId } from "@/lib/news-keywords";
import { useFormat } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/actualites/mot/$kw")({
  head: () => ({
    meta: [
      { title: "Mot-clé | Lyamfi" },
      {
        name: "description",
        content: "Tous les articles du fil Lyamfi portant ce mot-clé.",
      },
      { property: "og:title", content: "Mot-clé | Lyamfi" },
    ],
  }),
  component: KeywordPage,
});

/**
 * La page d'un mot-clé (« c:<TICKER> » société cotée ou « t:<theme> ») :
 * tous les articles du fil qui le portent, du plus récent au plus ancien.
 *
 * Pour une société, un raccourci mène à sa fiche de la cote
 * (`/bourse/$ticker`) : le lecteur qui suit une valeur passe des articles à
 * l'instrument sans retour en arrière. L'édition des insights reste sur le
 * fil et la page article — ici, lecture seule.
 */
function KeywordPage() {
  const { kw } = Route.useParams();
  const { t, lang } = useI18n();
  const f = useFormat();

  const parsed = parseKeywordId(kw);
  const company =
    parsed?.kind === "company"
      ? { ticker: parsed.ticker, name: companyNameForTicker(parsed.ticker) ?? parsed.ticker }
      : null;
  const title =
    company !== null
      ? company.name
      : parsed !== null && parsed.kind === "theme"
        ? t(THEME_KEY[parsed.theme])
        : kw;

  const { data: items = [], isLoading, error } = useQuery(newsKeywordQuery(kw, lang));

  // Le titre de l'onglet suit le mot-clé (une donnée, pas une clé du
  // dictionnaire : effet à la main, comme sur la page article).
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.title = `${title} | Lyamfi`;
  }, [title]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <Link
        to="/actualites"
        className="press -mx-2 inline-flex min-h-9 items-center gap-1.5 px-2 text-sm text-muted-foreground transition-colors hover:text-brand-yellow"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t("newsfeed.backToNews")}
      </Link>

      <header className="rise space-y-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-0.5 font-medium text-brand-yellow">
            <Tag className="h-3 w-3" aria-hidden="true" />
            {t(company ? "newsfeed.kwCompany" : "newsfeed.kwTheme")}
          </span>
        </div>
        <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
        {company && (
          <p>
            <Link
              to="/bourse/$ticker"
              params={{ ticker: company.ticker }}
              className="inline-flex items-center gap-1.5 text-sm text-brand-yellow underline-offset-4 transition-colors hover:underline"
            >
              <LineChart className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              {t("newsfeed.kwViewStock")}
            </Link>
          </p>
        )}
      </header>

      {error ? (
        <div className="glass p-8 text-center">
          <p className="text-sm text-destructive">{t("newsfeed.fetchError")}</p>
        </div>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">{t("newsfeed.loadingFeed")}</p>
      ) : items.length === 0 ? (
        <div className="glass p-8 text-center">
          <p className="text-sm font-medium">{t("newsfeed.kwEmpty")}</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <NewsCard key={item.guid} item={item} t={t} f={f} />
          ))}
        </div>
      )}
    </div>
  );
}
