import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { newsKeywordQuery, SOURCE_LABEL } from "@/lib/newsfeed";
import { useFormat } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

/**
 * Les articles du fil qui citent la valeur (mot-clé « c:<CODE> »), au bas de
 * sa fiche : la presse récente rejoint l'instrument, chaque titre ouvre la
 * page de lecture de l'article, et le lien de pied mène à la page du mot-clé
 * pour la liste complète.
 *
 * La requête est celle de la page par mot-clé — même clé de cache, les deux
 * écrans partagent le résultat. La section ne se montre que s'il y a de quoi
 * lire : ni en chargement (pas de squelette, rien ne saute en bas de page),
 * ni en erreur (fil en panne ou migration non jouée — ce n'est pas le
 * problème de la fiche), ni quand aucun article ne cite la valeur.
 */
export function StockNews({ code }: { code: string }) {
  const { t, lang } = useI18n();
  const f = useFormat();
  const kw = `c:${code}`;
  const { data: items = [], isSuccess } = useQuery(newsKeywordQuery(kw, lang));

  if (!isSuccess || items.length === 0) return null;

  return (
    <section className="glass p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">{t("stock.newsTitle")}</h2>
        <Link
          to="/actualites/mot/$kw"
          params={{ kw }}
          className="press inline-flex min-h-9 items-center gap-1 text-xs text-brand-yellow underline-offset-4 transition-colors hover:underline"
        >
          {t("stock.newsAll")}
          <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
        </Link>
      </div>
      <ul className="mt-3 divide-y divide-border/60">
        {items.slice(0, 6).map((item) => (
          <li key={item.guid}>
            <Link
              to="/actualites/$id"
              params={{ id: item.guid }}
              className="press group -mx-2 block rounded-md px-2 py-2.5"
            >
              <p className="text-sm font-medium leading-snug transition-colors group-hover:text-brand-yellow">
                {item.title}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {SOURCE_LABEL[item.source]}
                {item.publishedAt ? ` · ${f.weekdayDate(item.publishedAt)}` : ""}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
