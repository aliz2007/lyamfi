import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowDownWideNarrow,
  ArrowUp,
  ArrowUpNarrowWide,
  CalendarRange,
  Search,
  Star,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import {
  dy26,
  hasFundamentals,
  metricsQuery,
  per26,
  summaryMetrics,
  LIVE_METRICS,
} from "@/lib/metrics";
import { formatMetric } from "@/components/MetricValue";
import { getLiveQuotes } from "@/lib/quotes.functions";
import { EMPTY, useFormat } from "@/lib/format";
import { Sparkline } from "@/components/Sparkline";
import { CSE_SYMBOLS } from "@/lib/cse-symbols";
import { CATCH_ALL_SECTOR, SECTORS, sectorKey, sectorOf, type SectorId } from "@/lib/sectors";
import {
  QUOTATION_MODES,
  quotationKey,
  quotationOf,
  ytdOf,
  type QuotationMode,
} from "@/lib/quotation";
import { useFavourites } from "@/lib/favourites";
import { MarketSessionBadge } from "@/components/MarketSessionBadge";
import { chartSeries, recentHistoryQuery, useRecordDailyQuotes } from "@/lib/quotes.history";
import { getPriceHistory } from "@/lib/history.functions";
import { useI18n, usePageTitle, type Key, type Translate } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/bourse/")({
  head: () => ({
    meta: [
      { title: "Valeurs de la Bourse de Casablanca | Lyamfi" },
      {
        name: "description",
        content:
          "Cours en direct, graphiques et données fondamentales (BPA, DPA, PER, rendement) des valeurs cotées à la Bourse de Casablanca.",
      },
      { property: "og:title", content: "Valeurs cotées à la BVC | Lyamfi" },
      {
        property: "og:description",
        content: "Explore les valeurs de la Bourse de Casablanca.",
      },
    ],
  }),
  component: BoursePage,
});

/**
 * Tris disponibles. « changeDesc » et « changeAsc » répondent au besoin le
 * plus concret de la page : voir d'un coup les plus fortes hausses ou les
 * plus fortes baisses de la séance. « perAsc » et « dyDesc » sont les deux
 * lectures classiques d'un écran de valorisation : le moins cher payé pour un
 * bénéfice, le mieux rémunéré en dividende. « ytdDesc » sort de la séance et
 * lit l'année : c'est la question que pose un classeur de performance, et la
 * seule des huit dont les valeurs sans donnée ferment la liste.
 */
const SORTS = [
  "default",
  "changeDesc",
  "changeAsc",
  "ytdDesc",
  "perAsc",
  "dyDesc",
  "capDesc",
  "nameAsc",
] as const;
type Sort = (typeof SORTS)[number];

const SORT_LABEL: Record<Sort, Key> = {
  default: "bourse.sortDefault",
  changeDesc: "bourse.sortChangeDesc",
  changeAsc: "bourse.sortChangeAsc",
  ytdDesc: "bourse.sortYtdDesc",
  perAsc: "bourse.sortPerAsc",
  dyDesc: "bourse.sortDyDesc",
  capDesc: "bourse.sortCapDesc",
  nameAsc: "bourse.sortNameAsc",
};

const PAGE = 24;

function BoursePage() {
  const { t, locale } = useI18n();
  const f = useFormat();
  usePageTitle("bourse.title");

  const { data: metricsByCode } = useQuery(metricsQuery);
  const fetchQuotes = useServerFn(getLiveQuotes);
  const { data: quotes = [] } = useQuery({
    queryKey: ["cse-quotes"],
    queryFn: () => fetchQuotes(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // Archive la clôture du jour dans notre propre base : c'est elle qui
  // alimentera les graphiques, à la place du widget TradingView retiré.
  useRecordDailyQuotes(quotes);

  // Même source que la fiche valeur : l'historique TradingView, complété par
  // les clôtures relevées. Une requête pour les 81 vignettes, pas 81.
  const fetchHistory = useServerFn(getPriceHistory);
  const { data: tvHistory } = useQuery({
    queryKey: ["tv-history"],
    queryFn: () => fetchHistory(),
    staleTime: 30 * 60_000,
    retry: 1,
  });
  const { data: recordedByCode } = useQuery(recentHistoryQuery());

  const sparkByCode = useMemo(() => {
    const out = new Map<string, number[]>();
    const codes = new Set([
      ...Object.keys(tvHistory ?? {}),
      ...(recordedByCode ? [...recordedByCode.keys()] : []),
    ]);
    for (const code of codes) {
      const merged = chartSeries(tvHistory?.[code] ?? [], recordedByCode?.get(code) ?? []);
      if (merged.length >= 2)
        out.set(
          code,
          merged.map((p) => p.close),
        );
    }
    return out;
  }, [tvHistory, recordedByCode]);

  const [sector, setSector] = useState<SectorId | "all">("all");
  const [quotation, setQuotation] = useState<QuotationMode | "all">("all");
  const [sort, setSort] = useState<Sort>("default");
  const [onlyFavourites, setOnlyFavourites] = useState(false);
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(PAGE);

  const favourites = useFavourites();

  // Les libellés sont traduits : l'ordre des pastilles suit la langue affichée,
  // pas l'ordre des identifiants. « Autres » fait exception et ferme la liste :
  // un fourre-tout rangé à sa lettre, entre deux secteurs nommés, se lirait
  // comme un secteur de plus.
  const sectors = useMemo(
    () =>
      [...SECTORS].sort((a, b) => {
        if (a === CATCH_ALL_SECTOR) return 1;
        if (b === CATCH_ALL_SECTOR) return -1;
        return t(sectorKey(a)).localeCompare(t(sectorKey(b)), locale);
      }),
    [t, locale],
  );

  const quoteByCode = useMemo(
    () => new Map(quotes.map((x) => [x.ticker.toUpperCase(), x])),
    [quotes],
  );
  /** Toutes les valeurs cotées : celles dont les fondamentaux sont publiés d'abord. */
  const listings = useMemo(() => {
    const rows = CSE_SYMBOLS.filter(([symbol]) => symbol !== "CSEMA:MASI").map(
      ([symbol, title]) => {
        const code = symbol.split(":")[1]!.toUpperCase();
        const metrics = metricsByCode?.get(code);
        const live = quoteByCode.get(code) ?? null;
        const price = live?.price ?? null;

        return {
          symbol,
          code,
          // Le libellé de la cote fait foi : la table `stocks` porte encore des
          // raisons sociales périmées (Saham Assurance pour Sanlam Maroc), et
          // le classeur est en capitales.
          title,
          // Le secteur vient de `lib/sectors.ts`, pas de la table `stocks` :
          // celle-ci n'a jamais porté que vingt sociétés de démonstration, ce
          // qui laissait soixante valeurs sans secteur et vidait les filtres.
          sector: sectorOf(code),
          // Mode de cotation et performance annuelle viennent du même classeur
          // que le secteur (`lib/quotation.ts`). Le cours du 31/12 qui sert au
          // calcul reste dans ce module : seul l'écart qu'il mesure sort ici.
          quotation: quotationOf(code),
          price,
          changePct: live?.changePct ?? null,
          ytd: ytdOf(code, price),
          marketCap: metrics?.shares != null && price != null ? metrics.shares * price : null,
          covered: hasFundamentals(metrics),
          // Gardés à part des indicateurs mis en forme : le tri a besoin des
          // nombres, pas des libellés.
          per26: per26(metrics, price),
          dy26: dy26(metrics, price),
          metrics: summaryMetrics(metrics, price),
        };
      },
    );

    return rows.sort((a, b) => {
      if (a.covered !== b.covered) return a.covered ? -1 : 1;
      if (a.covered && b.covered) return (b.marketCap ?? 0) - (a.marketCap ?? 0);
      return a.title.localeCompare(b.title, "fr");
    });
  }, [metricsByCode, quoteByCode]);

  const filtered = useMemo(
    () =>
      listings.filter((l) => {
        const sectorOk = sector === "all" || l.sector === sector;
        const quotationOk = quotation === "all" || l.quotation === quotation;
        const favouriteOk = !onlyFavourites || favourites.codes.has(l.code);
        const needle = q.trim().toLowerCase();
        const qOk =
          !needle ||
          l.title.toLowerCase().includes(needle) ||
          l.code.toLowerCase().includes(needle);
        return sectorOk && quotationOk && favouriteOk && qOk;
      }),
    [listings, sector, quotation, q, onlyFavourites, favourites.codes],
  );

  /**
   * Tri appliqué après filtrage. Une valeur sans cours du jour n'a pas de
   * variation : elle est renvoyée en fin de liste dans les deux sens, sinon
   * elle occuperait le haut du classement des baisses avec un zéro trompeur.
   */
  const sorted = useMemo(() => {
    if (sort === "default") return filtered;
    const rows = [...filtered];
    if (sort === "nameAsc") {
      return rows.sort((a, b) => a.title.localeCompare(b.title, locale));
    }
    if (sort === "capDesc") {
      return rows.sort((a, b) => (b.marketCap ?? -1) - (a.marketCap ?? -1));
    }
    if (sort === "ytdDesc") {
      // Une valeur sans clôture du 31/12 dans le classeur n'a pas de
      // performance annuelle : elle ferme la liste plutôt que de s'y glisser
      // à zéro, qui se lirait comme une année blanche et non comme une donnée
      // absente.
      return rows.sort((a, b) => {
        const av = a.ytd;
        const bv = b.ytd;
        if (av === null && bv === null) return 0;
        if (av === null) return 1;
        if (bv === null) return -1;
        return bv - av;
      });
    }
    if (sort === "perAsc") {
      // Un PER négatif ou nul ne signale pas une valeur bon marché mais une
      // société qui perd de l'argent : il n'a rien à faire en tête d'un
      // classement du moins cher au plus cher, et rejoint la fin de liste avec
      // les valeurs sans PER calculable.
      return rows.sort((a, b) => {
        const av = a.per26 !== null && a.per26 > 0 ? a.per26 : null;
        const bv = b.per26 !== null && b.per26 > 0 ? b.per26 : null;
        if (av === null && bv === null) return 0;
        if (av === null) return 1;
        if (bv === null) return -1;
        return av - bv;
      });
    }
    if (sort === "dyDesc") {
      return rows.sort((a, b) => {
        const av = a.dy26;
        const bv = b.dy26;
        if (av === null && bv === null) return 0;
        if (av === null) return 1;
        if (bv === null) return -1;
        return bv - av;
      });
    }
    const dir = sort === "changeDesc" ? -1 : 1;
    return rows.sort((a, b) => {
      const av = a.changePct;
      const bv = b.changePct;
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return (av - bv) * dir;
    });
  }, [filtered, sort, locale]);

  useEffect(() => setLimit(PAGE), [q, sector, quotation, sort, onlyFavourites]);

  const coveredCount = listings.filter((l) => l.covered).length;
  const up = filtered.filter((l) => (l.changePct ?? 0) > 0).length;
  const down = filtered.filter((l) => (l.changePct ?? 0) < 0).length;

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="rise">
        <h1 className="text-3xl font-bold sm:text-4xl">{t("bourse.title")}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {t("bourse.intro", { total: CSE_SYMBOLS.length - 1, covered: coveredCount })}
        </p>
        <MarketSessionBadge className="mt-5" />
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--success)]/40 px-3 py-1 text-[var(--success)]">
            <ArrowUp className="h-3 w-3" /> {t("bourse.gainersToday", { n: up })}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 px-3 py-1 text-destructive">
            <ArrowDown className="h-3 w-3" /> {t("bourse.losersToday", { n: down })}
          </span>
        </div>
      </header>

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("bourse.searchPlaceholder")}
            // ⚠️ `text-base` sur mobile : en dessous de 16 px, Safari iOS zoome
            // sur le champ au moment de la saisie et ne dézoome jamais. C'est
            // la cause la plus courante d'une page « qui part de travers »
            // après une recherche.
            className="w-full rounded-xl border border-input bg-card py-3 pl-11 pr-4 text-base outline-none transition-colors focus:border-primary sm:text-sm"
          />
        </div>

        {/* Quinze secteurs, deux modes de cotation, huit tris : empilés, ils
            occupaient plusieurs lignes et repoussaient les cartes sous la
            ligne de flottaison du téléphone. Chaque famille glisse maintenant
            dans sa propre bande, qui ne peut plus élargir la page (cf.
            `chip-row` dans styles.css), et redevient un simple retour à la
            ligne dès la tablette. */}
        <div className="chip-row scrollbar-hide">
          <Chip active={sector === "all"} onClick={() => setSector("all")}>
            {t("bourse.allSectors")}
          </Chip>
          {sectors.map((id) => (
            <Chip key={id} active={sector === id} onClick={() => setSector(id)}>
              {t(sectorKey(id))}
            </Chip>
          ))}
        </div>

        {/* Le filtre par capitalisation a été retiré à la demande du
            commanditaire : la capitalisation reste lisible par le tri
            « capDesc » ci-dessous, et la bande des modes de cotation garde
            seule cette ligne. */}
        <div className="chip-row scrollbar-hide items-center">
          <Chip active={quotation === "all"} onClick={() => setQuotation("all")}>
            {t("bourse.allQuotations")}
          </Chip>
          {QUOTATION_MODES.map((m) => (
            <Chip key={m} active={quotation === m} onClick={() => setQuotation(m)}>
              {t(quotationKey(m))}
            </Chip>
          ))}
        </div>

        <div className="chip-row scrollbar-hide items-center border-t border-border/60 pt-3">
          <span className="self-center whitespace-nowrap text-xs text-muted-foreground">
            {t("bourse.sortBy")}
          </span>
          {SORTS.map((s) => (
            <Chip key={s} active={sort === s} onClick={() => setSort(s)}>
              <span className="inline-flex items-center gap-1.5">
                {s === "changeDesc" && <ArrowUp className="h-3 w-3" />}
                {s === "changeAsc" && <ArrowDown className="h-3 w-3" />}
                {s === "ytdDesc" && <CalendarRange className="h-3 w-3" />}
                {s === "perAsc" && <ArrowUpNarrowWide className="h-3 w-3" />}
                {s === "dyDesc" && <ArrowDownWideNarrow className="h-3 w-3" />}
                {t(SORT_LABEL[s])}
              </span>
            </Chip>
          ))}

          {/* Le filtre Favoris se pose au bout des tris, séparé par un trait :
              ce n'est pas un tri de plus mais une restriction de la liste, et
              il se combine avec le secteur, la cotation et la recherche. */}
          <span aria-hidden="true" className="mx-1 h-4 w-px bg-border" />
          <Chip active={onlyFavourites} onClick={() => setOnlyFavourites((v) => !v)}>
            <span className="inline-flex items-center gap-1.5">
              <Star
                className={`h-3 w-3 transition-colors ${
                  onlyFavourites ? "fill-brand-yellow text-brand-yellow" : "text-brand-yellow"
                }`}
              />
              {t("bourse.favourites")}
            </span>
          </Chip>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.slice(0, limit).map((l) => (
          // L'étoile est POSÉE À CÔTÉ du lien, pas dedans : un bouton imbriqué
          // dans une ancre est du HTML invalide, et le clavier ne saurait plus
          // atteindre l'un sans l'autre. La carte porte donc le relief et
          // l'effet de survol, le lien n'en garde que la surface cliquable —
          // ainsi le clic sur l'étoile n'a aucun chemin vers la navigation.
          // ⚠️ `min-w-0` N'EST PAS DÉCORATIF. Le titre porte `truncate`, donc
          // `white-space: nowrap`, dont la largeur minimale est la chaîne
          // entière : « Banque Marocaine pour le Commerce et l'Industrie »
          // mesurait 568 px. Une piste de grille se dimensionne sur le
          // min-content de ses éléments, et un élément de grille vaut
          // `min-width: auto` par défaut : la colonne prenait donc 568 px dans
          // un écran de 390, et TOUTE la page glissait de côté. C'est la cause
          // du défaut signalé ; le `overflow-x: clip` global n'en est que le
          // garde-fou.
          <div key={l.symbol} className="surface-raised card-hover relative min-w-0">
            <Link to="/bourse/$ticker" params={{ ticker: l.code }} className="block p-4 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{l.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {l.code} · {l.sector ? t(sectorKey(l.sector)) : "BVC"}
                  </p>
                </div>
                {/* La place de l'étoile est réservée dans le coin : sans cette
                  marge, un cours à quatre chiffres passerait dessous. */}
                <div className="shrink-0 pr-7 text-end">
                  <p className="whitespace-nowrap text-sm font-semibold tabular-nums">
                    {l.price === null ? EMPTY : `${f.price(l.price)} MAD`}
                  </p>
                  <p
                    className={`text-xs tabular-nums ${
                      l.changePct === null
                        ? "text-muted-foreground"
                        : l.changePct >= 0
                          ? "text-[var(--success)]"
                          : "text-destructive"
                    }`}
                  >
                    {l.changePct === null ? EMPTY : f.pct(l.changePct)}
                  </p>
                  {/* La performance annuelle se lit sous celle du jour, en plus
                      petit et sans couleur : c'est un repère, pas la mesure que
                      la carte est venue donner. Sans clôture du 31/12 au
                      classeur, le bloc ne s'affiche pas du tout — un « N/A »
                      dirait qu'on a cherché et trouvé zéro. */}
                  {l.ytd !== null && (
                    <p
                      title={t("bourse.ytdLabel")}
                      aria-label={t("bourse.ytdLabel")}
                      className="whitespace-nowrap text-[11px] tabular-nums text-muted-foreground"
                    >
                      {f.pct(l.ytd)} {t("bourse.ytdSuffix")}
                    </p>
                  )}
                </div>
              </div>

              {l.covered && (
                <span className="mt-3 inline-block rounded-full border border-primary/40 bg-accent px-2.5 py-0.5 text-[10px] font-medium text-accent-foreground">
                  {t("bourse.liquidBadge")}
                </span>
              )}

              <div className="-mx-1 mt-4">
                <Sparkline values={sparkByCode?.get(l.code) ?? []} />
              </div>

              {/* La vignette ne porte plus que les ratios de valorisation : cinq
                lignes au lieu de neuf. L'espacement est repris en conséquence,
                sinon la carte se tasse en haut et laisse un vide en bas. */}
              {l.metrics.length > 0 && (
                <dl className="mt-5 space-y-2.5 border-t border-border/50 pt-4 text-xs">
                  {/* Seuls les indicateurs calculables sont construits : rien à
                    masquer ici, la liste est déjà filtrée. */}
                  {l.metrics.map((m) => (
                    <Row
                      key={m.label}
                      label={t(m.label)}
                      value={formatMetric(m, f)}
                      live={LIVE_METRICS.has(m.label)}
                      strong={m.label === "metric.per26" || m.label === "metric.dy26"}
                    />
                  ))}
                </dl>
              )}
            </Link>

            <FavouriteStar
              on={favourites.codes.has(l.code)}
              onToggle={() => favourites.toggle(l.code)}
              name={l.title}
              t={t}
            />
          </div>
        ))}
        {sorted.length === 0 &&
          (onlyFavourites && favourites.codes.size === 0 ? (
            <div className="col-span-full flex flex-col items-center gap-3 py-14 text-center">
              <Star className="h-7 w-7 fill-brand-yellow/25 text-brand-yellow" />
              <p className="text-sm font-medium text-foreground">{t("bourse.noFavourites")}</p>
              <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
                {t("bourse.noFavouritesHint")}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("bourse.noMatch")}</p>
          ))}
      </div>

      {limit < sorted.length && (
        <div className="flex justify-center">
          <button
            onClick={() => setLimit((l) => l + PAGE)}
            className="press rounded-full border border-border px-6 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            {t("bourse.showMore", { rest: sorted.length - limit })}
          </button>
        </div>
      )}

      <p className="text-xs leading-relaxed text-muted-foreground">{t("bourse.footnote")}</p>
    </div>
  );
}

/**
 * L'étoile des favoris.
 *
 * Éteinte, elle n'est qu'un contour gris : la carte ne doit pas être bariolée
 * d'or avant qu'on ait rien choisi. Allumée, elle se remplit du jaune de la
 * marque, et la transition CSS porte à la fois la couleur et le remplissage
 * pour que le passage se voie sans être appuyé.
 *
 * `stopPropagation` est ceinture et bretelles : le bouton n'est pas dans le
 * lien, donc aucun clic ne peut déjà remonter jusqu'à lui. La ligne reste au
 * cas où la vignette redeviendrait un jour cliquable dans son ensemble.
 */
function FavouriteStar({
  on,
  onToggle,
  name,
  t,
}: {
  on: boolean;
  onToggle: () => void;
  name: string;
  t: Translate;
}) {
  const label = `${t(on ? "bourse.removeFavourite" : "bourse.addFavourite")} — ${name}`;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-pressed={on}
      aria-label={label}
      title={label}
      className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
    >
      <Star
        className={`h-4 w-4 transition-[fill,color,transform] duration-300 ${
          on
            ? "scale-110 fill-brand-yellow text-brand-yellow"
            : "fill-transparent text-muted-foreground hover:text-brand-yellow"
        }`}
        strokeWidth={1.75}
      />
    </button>
  );
}

function Row({
  label,
  value,
  strong,
  live,
}: {
  label: string;
  value: string;
  strong?: boolean;
  live?: boolean;
}) {
  return (
    // `min-w-0` sur le libellé, `whitespace-nowrap` sur la valeur : quand la
    // place manque c'est le libellé qui se rogne, jamais le chiffre. Un
    // « 1 234,5 » coupé à « 1 23 » se lit comme une autre valeur.
    <div className="flex items-baseline justify-between gap-2 border-b border-border/40 pb-1.5 last:border-0 last:pb-0">
      <dt className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
        <span className="truncate">{label}</span>
        {live && (
          <span
            aria-hidden="true"
            className="h-1 w-1 shrink-0 rounded-full bg-[var(--brand-yellow)]"
          />
        )}
      </dt>
      <dd
        className={`shrink-0 whitespace-nowrap tabular-nums ${
          strong ? "font-semibold" : "font-medium"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      // 36 px de haut : en dessous, la pastille se rate au doigt une fois sur
      // trois. Elle retrouve sa taille de bureau dès qu'il y a un pointeur.
      className={`press flex min-h-9 items-center whitespace-nowrap rounded-full border px-3.5 text-xs transition-colors sm:min-h-0 sm:py-1.5 ${
        active
          ? "border-primary/60 bg-accent text-accent-foreground"
          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
