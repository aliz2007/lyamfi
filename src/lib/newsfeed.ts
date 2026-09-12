import { supabase } from "@/integrations/supabase/client";
import { callRpc, explain, rpc } from "@/lib/rpc";
import {
  fetchArticleBody,
  fetchNewsFeed,
  translateTexts,
  type FeedSource,
} from "@/lib/newsfeed.functions";
import { extractKeywords } from "@/lib/news-keywords";
import type { Lang } from "@/lib/i18n";

/**
 * Fil d'actualités multi-sources (Boursenews, Le Boursier — Medias24,
 * AlphaBourse) à mots-clés intelligents.
 *
 * Les sites sources sont moissonnés par les fonctions serveur de
 * `newsfeed.functions.ts` (CORS + HTML jamais renvoyé brut), puis mis en
 * cache en base : `news_items` pour les articles, `news_insights` pour le
 * commentaire de rédaction. Les traductions automatiques sont remplies à la
 * première lecture dans la langue et ne s'écrivent que dans les colonnes
 * encore vides côté base — premier arrivé gagne, personne ne réécrit le
 * texte d'un autre. Les mots-clés sont calculés au moment du moissonnage
 * (`extractKeywords`) et rattrapés sur les lignes en cache qui en manquent.
 *
 * ⚠️ `src/integrations/supabase/types.ts` est régénéré depuis la base et ne
 * connaît pas encore ces tables : la lecture passe par le même cast isolé que
 * `lib/news.ts` l'a fait avant lui. Éditer le fichier généré serait perdu à
 * la prochaine régénération.
 */

/** Source d'un article du fil. */
export type NewsSource = FeedSource;

/** Libellé affiché de chaque source. */
export const SOURCE_LABEL: Record<NewsSource, string> = {
  boursenews: "Boursenews",
  leboursier: "Le Boursier — Medias24",
  alphabourse: "AlphaBourse",
};

export type NewsFeedItem = {
  /** slug nu pour boursenews (legacy), « alphabourse:<hexid> », « leboursier:<id> ». */
  guid: string;
  source: NewsSource;
  category: string;
  url: string;
  imageUrl: string | null;
  publishedAt: string | null;
  title: string;
  excerpt: string;
  /** true si le contenu affiché est une traduction automatique (langue ≠ fr). */
  machineTranslated: boolean;
  hasBody: boolean;
  /** ≤6 ids « c:<TICKER> » ou « t:<theme> », triés par pertinence. */
  keywords: string[];
  insight: { body: string; originalLang: boolean } | null;
};

/** Le fil : les cartes, plus les sources injoignables pendant le moissonnage. */
export type NewsFeedResult = {
  items: NewsFeedItem[];
  /** Sources dont aucune page n'a répondu (challenge Cloudflare, 5xx…). */
  failedSources: string[];
};

/** Un article ouvert : la carte, plus le corps (et sa traduction éventuelle). */
export type NewsArticle = NewsFeedItem & {
  body: string | null;
  /** true si le corps affiché est une traduction automatique. */
  bodyMachineTranslated: boolean;
};

type ItemRow = {
  guid: string;
  source: NewsSource;
  category: string;
  url: string;
  title_fr: string;
  excerpt_fr: string;
  body_fr: string | null;
  image_url: string | null;
  published_at: string | null;
  keywords: string[];
  title_en: string | null;
  excerpt_en: string | null;
  body_en: string | null;
  title_ar: string | null;
  excerpt_ar: string | null;
  body_ar: string | null;
};

type InsightRow = {
  news_item_guid: string;
  body: string;
  lang: "fr" | "en" | "ar";
  body_en: string | null;
  body_ar: string | null;
};

type DbError = { message: string; code?: string } | null;

type OrderedQuery = {
  limit: (n: number) => Promise<{ data: ItemRow[] | null; error: DbError }>;
};

type ItemsTable = {
  select: (cols: string) => {
    order: (col: string, opts: { ascending: boolean; nullsFirst?: boolean }) => OrderedQuery;
    eq: (
      col: string,
      val: string,
    ) => {
      maybeSingle: () => Promise<{ data: ItemRow | null; error: DbError }>;
    };
    contains: (
      col: string,
      val: string[],
    ) => {
      order: (col: string, opts: { ascending: boolean; nullsFirst?: boolean }) => OrderedQuery;
    };
  };
};

type InsightsTable = {
  select: (cols: string) => Promise<{ data: InsightRow[] | null; error: DbError }>;
};

const itemsTable = () => supabase.from("news_items" as never) as unknown as ItemsTable;
const insightsTable = () => supabase.from("news_insights" as never) as unknown as InsightsTable;

/** Colonnes lues pour les cartes — source et keywords partout. */
const ITEM_COLS =
  "guid, source, category, url, title_fr, excerpt_fr, body_fr, image_url, published_at, keywords, title_en, excerpt_en, body_en, title_ar, excerpt_ar, body_ar";
const INSIGHT_COLS = "news_item_guid, body, lang, body_en, body_ar";

/** Colonne traduite d'une ligne, selon la langue demandée. */
function pick(row: ItemRow, field: "title" | "excerpt" | "body", lang: Lang): string | null {
  return row[`${field}_${lang}`];
}

/* ------------------------------------------------- pipeline cartes commun */

/**
 * Traduit les premières lignes dont la langue demandée manque, par lots de
 * 4 (8 textes par appel), et persiste dans les colonnes encore vides.
 * Mutation locale quoiqu'il arrive ; la base n'est écrite que pour de vraies
 * traductions (jamais les originaux français rendus en échec).
 */
async function translateMissingRows(rows: ItemRow[], lang: Lang): Promise<void> {
  if (lang === "fr") return;
  const pending = rows.filter((r) => pick(r, "title", lang) === null).slice(0, 15);
  for (let i = 0; i < pending.length; i += 4) {
    const batch = pending.slice(i, i + 4);
    try {
      const res = await translateTexts({
        data: {
          target: lang,
          texts: batch.flatMap((r) => [r.title_fr, r.excerpt_fr]),
        },
      });
      batch.forEach((r, j) => {
        const title = res.translations[j * 2];
        const excerpt = res.translations[j * 2 + 1];
        if (title === undefined || excerpt === undefined) return;
        // ⚠️ On ne persiste que de vraies traductions : en échec, le serveur
        // rend les originaux français, et les écrire dans une colonne
        // « premier arrivé gagne » y graverait du français.
        if (!res.failed) {
          void callRpc<void>("bnews_translation_set", {
            p_guid: r.guid,
            p_lang: lang,
            p_title: title,
            p_excerpt: excerpt,
          }).catch(() => {
            /* la traduction sera refaite à la prochaine lecture */
          });
        }
        // Les chaînes retournées servent localement quoiqu'il arrive.
        if (lang === "en") {
          r.title_en = title;
          r.excerpt_en = excerpt;
        } else {
          r.title_ar = title;
          r.excerpt_ar = excerpt;
        }
      });
    } catch {
      // Traduction indisponible : le français reste affiché pour ce lot.
    }
  }
}

/**
 * Lignes cache + insights → cartes affichées : traduction automatique des
 * manquantes, jointure du commentaire de rédaction, mapping. Passe commune
 * au fil (`newsFeedQuery`) et à la page par mot-clé (`newsKeywordQuery`).
 */
async function toFeedItems(
  rows: ItemRow[],
  insights: InsightRow[],
  lang: Lang,
): Promise<NewsFeedItem[]> {
  await translateMissingRows(rows, lang);
  const insightByGuid = new Map(insights.map((i) => [i.news_item_guid, i]));
  return rows.map((r) => mapRow(r, lang, insightByGuid.get(r.guid)));
}

/** Une ligne cache + son insight éventuel → la carte affichée. */
function mapRow(r: ItemRow, lang: Lang, insight: InsightRow | undefined): NewsFeedItem {
  const translatedTitle = lang === "fr" ? null : pick(r, "title", lang);
  const translatedExcerpt = lang === "fr" ? null : pick(r, "excerpt", lang);
  return {
    guid: r.guid,
    source: r.source,
    category: r.category,
    url: r.url,
    imageUrl: r.image_url,
    publishedAt: r.published_at,
    title: translatedTitle ?? r.title_fr,
    excerpt: translatedExcerpt ?? r.excerpt_fr,
    machineTranslated: translatedTitle !== null,
    hasBody: (lang === "fr" ? r.body_fr : (pick(r, "body", lang) ?? r.body_fr)) !== null,
    keywords: r.keywords,
    insight: insight ? mapInsight(insight, lang) : null,
  };
}

/**
 * L'insight dans la langue demandée, avec repli sur le texte de rédaction.
 * `originalLang` signale que ce qu'on lit est la langue de rédaction, pas
 * celle de l'interface : pour un francophone lisant un insight rédigé en
 * français, rien à signaler.
 */
function mapInsight(i: InsightRow, lang: Lang): { body: string; originalLang: boolean } {
  const translated =
    lang === "en" ? i.body_en : lang === "ar" ? i.body_ar : i.lang === "fr" ? i.body : null;
  return { body: translated ?? i.body, originalLang: translated === null };
}

/* ------------------------------------------------------------ le fil */

/**
 * Le fil complet, dans la langue demandée (repli français).
 *
 * Chorégraphie, dans l'ordre :
 *   1. moissonnage des trois sources (en échec → fil vide mais non bloquant,
 *      sources tombées signalées dans `failedSources`) ;
 *   2. dépôt du résultat dans le cache (la base revalide tout ; les mots-clés
 *      calculés au moissonnage partent avec) ;
 *   3. relecture du cache, qui fait foi (corps, traductions, insights), puis
 *      rattrapage des lignes encore sans mots-clés ;
 *   4. traduction automatique des premières cartes si la langue n'est pas le
 *      français, persistée dans les colonnes encore vides ;
 *   5. les articles tout juste moissonnés qui manqueraient encore au cache
 *      (dépôt refusé) sont fusionnés en français, à leur position de date.
 */
export const newsFeedQuery = (lang: Lang) => ({
  queryKey: ["bnews-feed", lang],
  queryFn: async (): Promise<NewsFeedResult> => {
    // 1.
    const feed = await fetchNewsFeed().catch((): { items: never[]; failedSources: string[] } => ({
      items: [],
      failedSources: [],
    }));

    // Mots-clés calculés une fois, au moment du scrape : ils partent dans
    // l'upsert et servent aux cartes fusionnées hors cache.
    const keywordsByGuid = new Map(
      feed.items.map((i) => [i.guid, extractKeywords(i.title, i.excerpt)]),
    );

    // 2. En garde-fou : le cache est un confort, pas une condition d'affichage.
    if (feed.items.length > 0) {
      try {
        await callRpc<void>("bnews_items_upsert", {
          p_items: feed.items.slice(0, 45).map((i) => ({
            guid: i.guid,
            source: i.source,
            category: i.category,
            url: i.url,
            title: i.title,
            excerpt: i.excerpt,
            image_url: i.imageUrl,
            published_at: i.publishedAt,
            keywords: keywordsByGuid.get(i.guid) ?? [],
          })),
        });
      } catch {
        // Le SELECT ci-dessous servira le cache existant ; le merge final
        // affichera quand même les nouveautés, en français.
      }
    }

    // 3.
    const [itemsRes, insightsRes] = await Promise.all([
      itemsTable()
        .select(ITEM_COLS)
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(40),
      insightsTable().select(INSIGHT_COLS),
    ]);

    let rows: ItemRow[];
    let insights: InsightRow[];
    if (itemsRes.error) {
      // Cache absent (migration non jouée) : le fil moissonné, s'il existe,
      // suffit à peupler l'écran ; sinon c'est une vraie panne.
      if (feed.items.length === 0) throw new Error(explain(itemsRes.error.message));
      rows = [];
      insights = [];
    } else {
      rows = itemsRes.data ?? [];
      insights = insightsRes.error ? [] : (insightsRes.data ?? []);
    }

    // 3b. Rattrapage : lignes en cache écrites avant l'arrivée des mots-clés
    // (keywords vide) → calcul local + dépôt, en parallèle et en garde-fou.
    const backfill = rows
      .filter((r) => r.keywords.length === 0)
      .map((r) => ({ row: r, keywords: extractKeywords(r.title_fr, r.excerpt_fr) }))
      .filter((b) => b.keywords.length > 0);
    if (backfill.length > 0) {
      await Promise.all(
        backfill.map(async ({ row, keywords }) => {
          try {
            await callRpc<void>("bnews_keywords_set", { p_guid: row.guid, p_keywords: keywords });
            row.keywords = keywords;
          } catch {
            /* RPC absente (migration non jouée) : nouvelle tentative à la
               prochaine lecture, l'affichage n'attend pas. */
          }
        }),
      );
    }

    // 4. Passe commune traduction + mapping.
    const items = await toFeedItems(rows, insights, lang);

    // 5. Moissonnés absents du cache (dépôt refusé à l'étape 2) : français
    // seul, fusionnés à leur position de date.
    const cached = new Set(rows.map((r) => r.guid));
    for (const i of feed.items) {
      if (cached.has(i.guid)) continue;
      items.push({
        guid: i.guid,
        source: i.source,
        category: i.category,
        url: i.url,
        imageUrl: i.imageUrl,
        publishedAt: i.publishedAt,
        title: i.title,
        excerpt: i.excerpt,
        machineTranslated: false,
        hasBody: false,
        keywords: keywordsByGuid.get(i.guid) ?? [],
        insight: null,
      });
    }
    items.sort((a, b) => {
      if (a.publishedAt && b.publishedAt) return b.publishedAt.localeCompare(a.publishedAt);
      if (a.publishedAt) return -1;
      if (b.publishedAt) return 1;
      return 0;
    });

    return { items, failedSources: feed.failedSources };
  },
  staleTime: 15 * 60_000,
});

/* ---------------------------------------------------- page par mot-clé */

/**
 * Les articles portant un mot-clé (« c:<TICKER> » ou « t:<theme> »), du plus
 * récent au plus ancien, ≤60. Le filtre `@>` est posé par la base (index
 * GIN) ; la passe de traduction et la jointure des insights sont celles du
 * fil (helper commun `toFeedItems`).
 */
export const newsKeywordQuery = (kw: string, lang: Lang) => ({
  queryKey: ["bnews-kw", kw, lang],
  queryFn: async (): Promise<NewsFeedItem[]> => {
    const [itemsRes, insightsRes] = await Promise.all([
      itemsTable()
        .select(ITEM_COLS)
        .contains("keywords", [kw])
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(60),
      insightsTable().select(INSIGHT_COLS),
    ]);
    if (itemsRes.error) throw new Error(explain(itemsRes.error.message, itemsRes.error.code));
    return toFeedItems(
      itemsRes.data ?? [],
      insightsRes.error ? [] : (insightsRes.data ?? []),
      lang,
    );
  },
  staleTime: 15 * 60_000,
});

/* ----------------------------------------------------------- l'article */

/**
 * Un article précis, pour la page de lecture.
 *
 * Servi depuis le fil plutôt que par une requête dédiée : le fil est déjà en
 * cache quand on clique une carte (même astuce que l'ancien `newsPostQuery`),
 * et la clé commence par « bnews-feed », donc invalider le fil invalide aussi
 * les articles ouverts. Le corps est ensuite complété : moissonné à la
 * première ouverture, traduit par morceaux à la première lecture dans la
 * langue.
 */
export const newsArticleQuery = (guid: string, lang: Lang) => ({
  queryKey: ["bnews-feed", lang, "article", guid],
  queryFn: async (): Promise<NewsArticle | null> => {
    const { items } = await newsFeedQuery(lang).queryFn();
    const item = items.find((i) => i.guid === guid);
    if (!item) return null;

    const { data: row, error } = await itemsTable()
      .select(
        "guid, title_fr, excerpt_fr, body_fr, title_en, excerpt_en, body_en, title_ar, excerpt_ar, body_ar",
      )
      .eq("guid", guid)
      .maybeSingle();
    // Sans ligne en cache (dépôt refusé), l'article vit du fil : pas de corps.
    if (error || !row) return { ...item, body: null, bodyMachineTranslated: false };

    // Corps français : moissonné à la première ouverture.
    let bodyFr = row.body_fr;
    if (bodyFr === null) {
      try {
        const { body } = await fetchArticleBody({ data: { url: item.url } });
        if (body) {
          bodyFr = body;
          void callRpc<void>("bnews_body_set", { p_guid: guid, p_body: body }).catch(() => {
            /* le corps sera re-moissonné à la prochaine ouverture */
          });
        }
      } catch {
        // Site source injoignable : la page affiche titre et extrait.
      }
    }

    if (lang === "fr" || bodyFr === null) {
      return { ...item, body: bodyFr, bodyMachineTranslated: false };
    }

    // Corps traduit : déjà en cache, ou à produire par morceaux.
    const cached = pick(row, "body", lang);
    if (cached !== null) return { ...item, body: cached, bodyMachineTranslated: true };

    const needMeta = pick(row, "title", lang) === null || pick(row, "excerpt", lang) === null;
    const chunks = chunkText(bodyFr, 3_500);
    const queue = [...(needMeta ? [row.title_fr, row.excerpt_fr] : []), ...chunks];

    const translated: string[] = [];
    let provider: string | null = null;
    let failed = false;
    // 8 textes par appel (borne du serveur) : méta d'abord, morceaux ensuite.
    for (let i = 0; i < queue.length; i += 8) {
      try {
        const res = await translateTexts({ data: { target: lang, texts: queue.slice(i, i + 8) } });
        translated.push(...res.translations);
        provider = provider ?? res.provider;
        failed = failed || res.failed;
      } catch {
        translated.push(...queue.slice(i, i + 8));
        failed = true;
      }
    }

    let title = item.title;
    let excerpt = item.excerpt;
    let bodyParts = translated;
    if (needMeta) {
      title = translated[0] ?? item.title;
      excerpt = translated[1] ?? item.excerpt;
      bodyParts = translated.slice(2);
    }
    const body = bodyParts.join("\n\n");

    // Même règle que le fil : on ne grave en base que de vraies traductions,
    // jamais les originaux français rendus en échec. Le corps traduit reste
    // en cache local quoiqu'il arrive.
    if (provider !== null && !failed) {
      void callRpc<void>("bnews_translation_set", {
        p_guid: guid,
        p_lang: lang,
        p_title: needMeta ? title : (pick(row, "title", lang) ?? row.title_fr),
        p_excerpt: needMeta ? excerpt : (pick(row, "excerpt", lang) ?? row.excerpt_fr),
        p_body: body,
      }).catch(() => {
        /* la traduction sera refaite à la prochaine lecture */
      });
    }

    return {
      ...item,
      title,
      excerpt,
      machineTranslated: !failed,
      body,
      bodyMachineTranslated: !failed,
    };
  },
  staleTime: 15 * 60_000,
});

/**
 * Découpe un long texte en morceaux ≤ `max` caractères, sur les paragraphes
 * autant que possible (borne des fournisseurs de traduction : 4 000, on garde
 * de la marge). Un paragraphe trop long est coupé à sec — rare, et chaque
 * morceau reste traduisible.
 */
function chunkText(text: string, max: number): string[] {
  const chunks: string[] = [];
  let cur = "";
  for (const p of text.split(/\n{2,}/)) {
    if (p.length > max) {
      if (cur) {
        chunks.push(cur);
        cur = "";
      }
      for (let i = 0; i < p.length; i += max) chunks.push(p.slice(i, i + max));
      continue;
    }
    if ((cur ? cur.length + 2 : 0) + p.length > max) {
      if (cur) chunks.push(cur);
      cur = p;
    } else {
      cur = cur ? `${cur}\n\n${p}` : p;
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}

/* ------------------------------------------------------ insight (admin) */

/**
 * Rédige ou retouche le commentaire de rédaction, puis le traduit dans les
 * deux autres langues. L'upsert est tenu par la base (is_admin) ; les
 * traductions sont un confort en garde-fou : si elles échouent, l'insight
 * reste enregistré et sera affiché dans sa langue de rédaction.
 */
export async function saveInsight(guid: string, body: string, lang: Lang): Promise<void> {
  await callRpc<void>("bnews_insight_upsert", { p_guid: guid, p_body: body, p_lang: lang });
  for (const target of (["fr", "en", "ar"] as Lang[]).filter((l) => l !== lang)) {
    try {
      const res = await translateTexts({ data: { target, texts: [body] } });
      // Une traduction avortée rend l'original : ne pas le graver dans une
      // colonne de langue étrangère.
      if (res.provider === null || res.failed) continue;
      await callRpc<void>("bnews_insight_translation_set", {
        p_guid: guid,
        p_lang: target,
        p_body: res.translations[0] ?? body,
      });
    } catch {
      /* traduction refaite à la prochaine retouche */
    }
  }
}

export async function deleteInsight(guid: string): Promise<void> {
  await callRpc<void>("bnews_insight_delete", { p_guid: guid });
}

// `rpc` reste importé pour la cohérence des appels directs éventuels.
void rpc;
