import { createServerFn } from "@tanstack/react-start";

/**
 * Moissonnage et traduction du fil Boursenews.
 *
 * Exécuté côté serveur (modèle : `lib/quotes.functions.ts`) pour deux raisons :
 * le navigateur serait bloqué par CORS en appelant boursenews.ma, et la clé
 * d'entrée des traductions ne doit pas transiter par le client. Le HTML est
 * transformé en TEXTE BRUT ici, jamais renvoyé tel quel : l'interface n'a
 * ainsi aucune tentation de l'injecter (`dangerouslySetInnerHTML` reste
 * proscrit partout).
 *
 * Le parsing est volontairement à base d'expressions régulières sur la
 * structure des cartes et de l'article : pas de dépendance DOM côté serveur.
 * Les expressions ont été éprouvées sur des échantillons réels des pages
 * (`/articles/{cat}` et `/article/{cat}/{slug}`).
 */

export type NewsCategory = "marches" | "actualite" | "decryptage";

export const NEWS_CATEGORIES: NewsCategory[] = ["marches", "actualite", "decryptage"];

/** Une carte du fil, déjà nettoyée (texte, entités déséchappées, URL absolues). */
export type FeedItem = {
  guid: string;
  category: NewsCategory;
  url: string;
  title: string;
  excerpt: string;
  imageUrl: string | null;
  publishedAt: string | null;
};

export type FeedResult = {
  items: FeedItem[];
  /** Catégories dont la page n'a pas pu être récupérée (réseau, 5xx…). */
  failedCategories: string[];
};

const BASE = "https://www.boursenews.ma";

/** Un navigateur ordinaire : le site filtre les clients trop évidents. */
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

/** GET avec garde-fou : un site tiers qui traîne ne doit pas figer l'écran. */
async function fetchText(url: string, timeoutMs: number): Promise<string> {
  const res = await fetch(url, {
    headers: { "user-agent": BROWSER_UA, accept: "text/html,application/xhtml+xml" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/* --------------------------------------------------------- entités HTML */

// Carte minimale + accentués et signes rencontrés dans les articles. Tout ce
// qui n'est pas reconnu est laissé tel quel plutôt que déformé.
const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  eacute: "é",
  egrave: "è",
  agrave: "à",
  acirc: "â",
  ccedil: "ç",
  ecirc: "ê",
  euml: "ë",
  icirc: "î",
  iuml: "ï",
  ocirc: "ô",
  ouml: "ö",
  ugrave: "ù",
  ucirc: "û",
  uuml: "ü",
  oelig: "œ",
  laquo: "«",
  raquo: "»",
  rsquo: "’",
  lsquo: "‘",
  ldquo: "“",
  rdquo: "”",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  deg: "°",
  euro: "€",
  Agrave: "À",
  Acirc: "Â",
  Ccedil: "Ç",
  Egrave: "È",
  Eacute: "É",
  Ecirc: "Ê",
  Euml: "Ë",
  Icirc: "Î",
  Iuml: "Ï",
  Ocirc: "Ô",
  Ugrave: "Ù",
  Ucirc: "Û",
};

/** Déséchappe les entités nommées connues et les entités numériques. */
function unescapeHtml(s: string): string {
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, name: string) => {
    if (name.startsWith("#")) {
      const code =
        name[1] === "x" || name[1] === "X"
          ? parseInt(name.slice(2), 16)
          : parseInt(name.slice(1), 10);
      return Number.isNaN(code) ? m : String.fromCodePoint(code);
    }
    return ENTITIES[name] ?? m;
  });
}

const stripTags = (s: string): string => s.replace(/<[^>]*>/g, "");

/* ------------------------------------------------------------- dates FR */

const MONTHS: Record<string, number> = {
  janvier: 1,
  février: 2,
  fevrier: 2,
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  août: 8,
  aout: 8,
  septembre: 9,
  octobre: 10,
  novembre: 11,
  décembre: 12,
  decembre: 12,
};

/**
 * « Vendredi 11 Septembre 2026 » → ISO, midi UTC pour ne pas glisser d'un
 * jour selon le fuseau du serveur. Le jour de la semaine est ignoré : il est
 * redondant avec la date et n'ajoute qu'un risque de faute. Échec → null,
 * une carte sans date reste affichable (rangée en fin de fil).
 */
function parseFrenchDate(text: string): string | null {
  const m = /(\d{1,2})\s+([A-Za-zÀ-ÿ]+)\s+(\d{4})/.exec(text);
  if (!m) return null;
  const month = MONTHS[m[2]!.toLowerCase()];
  if (!month) return null;
  const day = Number(m[1]);
  const year = Number(m[3]);
  if (day < 1 || day > 31) return null;
  return new Date(Date.UTC(year, month - 1, day, 12)).toISOString();
}

/** Rend absolue une URL du site source (les href/src des cartes sont relatifs). */
const absolutize = (u: string): string => (u.startsWith("http") ? u : `${BASE}${u}`);

/* ------------------------------------------------------- page de liste */

/**
 * Extrait les cartes d'une page `/articles/{cat}`.
 *
 * Structure visée (éprouvée sur échantillon) : chaque carte est un
 * `<h3><a href="/article/{cat}/{slug}">titre<span>date</span></a></h3>`
 * suivi d'un `<p>extrait</p>`, et l'illustration est un `<img>` enveloppé
 * d'une ancre vers le même slug plus haut dans la carte. L'image est donc
 * retrouvée par slug plutôt que par position : la mise en page peut changer,
 * le lien image↔article, lui, tient à l'URL.
 */
function parseListing(html: string, category: NewsCategory): FeedItem[] {
  const images = new Map<string, string>();
  const imgRe = /<a[^>]*href="\/article\/[a-z]+\/([a-z0-9-]+)"[^>]*>\s*<img[^>]*src="([^"]+)"/g;
  for (const m of html.matchAll(imgRe)) images.set(m[1]!, m[2]!);

  const cardRe =
    /<h3>\s*<a\s+href="(\/article\/([a-z]+)\/([a-z0-9-]+))"[^>]*>([\s\S]*?)<\/a>\s*<\/h3>\s*<p>([\s\S]*?)<\/p>/g;

  const items: FeedItem[] = [];
  for (const m of html.matchAll(cardRe)) {
    const [, path, cat, slug, inner, excerptRaw] = m as unknown as [
      string,
      string,
      string,
      string,
      string,
      string,
    ];
    if (cat !== category) continue;

    const spanIdx = inner.indexOf("<span>");
    const title = unescapeHtml(stripTags(spanIdx === -1 ? inner : inner.slice(0, spanIdx)))
      .replace(/\s+/g, " ")
      .trim();
    // Le titre fait foi : une carte sans titre est une carte illisible.
    if (!title) continue;

    const dateText = spanIdx === -1 ? "" : unescapeHtml(stripTags(inner.slice(spanIdx)));
    const excerpt = unescapeHtml(stripTags(excerptRaw)).replace(/\s+/g, " ").trim();

    items.push({
      guid: slug,
      category,
      url: absolutize(path),
      title,
      excerpt,
      imageUrl: images.has(slug) ? absolutize(images.get(slug)!) : null,
      publishedAt: parseFrenchDate(dateText),
    });
    // 15 par catégorie suffisent au fil ; au-delà on ne fait que grossir le
    // cache et le lot validé par la base (borné à 25 au total... voir RPC).
    if (items.length >= 15) break;
  }
  return items;
}

/**
 * Le fil des trois catégories, fusionné et trié du plus récent au plus
 * ancien (articles sans date en fin). Une catégorie injoignable est signalée
 * dans `failedCategories` plutôt que de faire échouer tout le fil.
 */
export const fetchBoursenewsFeed = createServerFn({ method: "GET" }).handler(
  async (): Promise<FeedResult> => {
    const pages = await Promise.allSettled(
      NEWS_CATEGORIES.map(async (cat) => ({
        cat,
        html: await fetchText(`${BASE}/articles/${cat}`, 8_000),
      })),
    );

    const items: FeedItem[] = [];
    const failedCategories: string[] = [];
    for (const p of pages) {
      if (p.status === "fulfilled") items.push(...parseListing(p.value.html, p.value.cat));
      else failedCategories.push(NEWS_CATEGORIES[pages.indexOf(p)]!);
    }

    items.sort((a, b) => {
      if (a.publishedAt && b.publishedAt) return b.publishedAt.localeCompare(a.publishedAt);
      if (a.publishedAt) return -1;
      if (b.publishedAt) return 1;
      return 0;
    });

    return { items, failedCategories };
  },
);

/* ---------------------------------------------------------- page article */

/**
 * Retire les blocs `<div>…</div>` dont la balise ouvrante satisfait `pred`,
 * en comptant l'imbrication (le corps d'article contient des divs légitimes).
 */
function removeDivBlocks(html: string, pred: (openTag: string) => boolean): string {
  const openRe = /<div\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = openRe.exec(html))) {
    if (!pred(m[0])) continue;
    let depth = 1;
    const tagRe = /<\/?div\b[^>]*>/gi;
    tagRe.lastIndex = m.index + m[0].length;
    let t: RegExpExecArray | null;
    let end = -1;
    while ((t = tagRe.exec(html))) {
      depth += t[0].startsWith("</") ? -1 : 1;
      if (depth === 0) {
        end = tagRe.lastIndex;
        break;
      }
    }
    // Bloc non refermable : on laisse la page telle quelle plutôt que de
    // couper au mauvais endroit.
    if (end === -1) return html;
    return removeDivBlocks(html.slice(0, m.index) + html.slice(end), pred);
  }
  return html;
}

/**
 * Convertit le HTML du corps d'article en texte brut.
 *
 * Étapes : isoler `.article_detail_description`, retirer ce qui n'est pas du
 * texte (scripts, styles, cadres, formulaires, commentaires), retirer les
 * blocs sans valeur de lecture (pavés publicitaires `div-gpt-ad`, colonne
 * flottante `detail_article_left`, étiquettes `list_tages`), poser un saut de
 * ligne par bloc (`p`, `br`, `div`, `li`), supprimer toutes les autres
 * balises, déséchapper les entités et tasser les lignes vides. Plafond aligné
 * sur la borne de la base (30 000).
 */
export function articleHtmlToText(html: string): string {
  const startRe = /<div[^>]*class="[^"]*article_detail_description[^"]*"[^>]*>/i;
  const sm = startRe.exec(html);
  if (!sm) return "";

  // Fin du bloc : comptage d'imbrication des divs, comme removeDivBlocks.
  let depth = 1;
  const tagRe = /<\/?div\b[^>]*>/gi;
  tagRe.lastIndex = sm.index + sm[0].length;
  let t: RegExpExecArray | null;
  let end = html.length;
  while ((t = tagRe.exec(html))) {
    depth += t[0].startsWith("</") ? -1 : 1;
    if (depth === 0) {
      end = t.index;
      break;
    }
  }
  let body = html.slice(sm.index + sm[0].length, end);

  body = body.replace(/<!--[\s\S]*?-->/g, "");
  body = body.replace(/<(script|style|noscript|iframe|form)\b[\s\S]*?<\/\1>/gi, "");
  body = removeDivBlocks(body, (tag) => /div-gpt-ad|detail_article_left|list_tages/i.test(tag));
  body = body.replace(/<br\s*\/?>/gi, "\n");
  body = body.replace(/<\/(p|div|li|h[1-6])>/gi, "\n");
  body = stripTags(body);
  body = unescapeHtml(body);
  body = body
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .join("\n");
  body = body.replace(/\n{3,}/g, "\n\n").trim();
  return body.slice(0, 30_000);
}

/**
 * Le corps d'un article. Seules les URL d'articles du site source sont
 * acceptées : la fonction est un relais de téléchargement, elle ne doit pas
 * servir à aller lire n'importe quel site sous l'identité du serveur.
 */
export const fetchBoursenewsBody = createServerFn({ method: "POST" })
  .validator((data: unknown): { url: string } => {
    const url = (data as { url?: unknown })?.url;
    if (typeof url !== "string" || !/^https?:\/\/(www\.)?boursenews\.ma\/article\//i.test(url)) {
      throw new Error("URL d'article invalide");
    }
    return { url };
  })
  .handler(async ({ data }): Promise<{ body: string }> => {
    const html = await fetchText(data.url, 8_000);
    return { body: articleHtmlToText(html) };
  });

/* ------------------------------------------------------------ traduction */

export type TranslateResult = {
  translations: string[];
  /** Fournisseur(s) ayant répondu, null si tous ont échoué. */
  provider: string | null;
  /** true si au moins un texte n'a pas pu être traduit (original conservé). */
  failed: boolean;
};

type Provider = {
  name: string;
  translate: (q: string, target: "en" | "ar") => Promise<string>;
};

async function fetchJson(url: string, timeoutMs: number): Promise<unknown> {
  const res = await fetch(url, {
    headers: { "user-agent": BROWSER_UA },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * La chaîne de fournisseurs, premier succès gagne. Aucun n'est officiel ni
 * garanti : ce sont des points d'accès publics gratuits, d'où le repli en
 * cascade plutôt que le pari sur l'un d'eux. La traduction reste marquée
 * « automatique » dans l'interface.
 */
const PROVIDERS: Provider[] = [
  {
    name: "lingva",
    translate: async (q, target) => {
      const json = (await fetchJson(
        `https://lingva.ml/api/v1/fr/${target}/${encodeURIComponent(q)}`,
        7_000,
      )) as { translation?: string };
      if (typeof json.translation !== "string" || !json.translation) throw new Error("vide");
      return json.translation;
    },
  },
  {
    name: "google-gtx",
    translate: async (q, target) => {
      // Réponse : tableaux imbriqués, chaque segment traduit en [i][0].
      const json = (await fetchJson(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=fr&tl=${target}&dt=t&q=${encodeURIComponent(q)}`,
        7_000,
      )) as [string[][]?];
      const parts = json?.[0];
      if (!Array.isArray(parts)) throw new Error("forme inattendue");
      const out = parts.map((seg) => (Array.isArray(seg) ? (seg[0] ?? "") : "")).join("");
      if (!out) throw new Error("vide");
      return out;
    },
  },
  {
    name: "mymemory",
    translate: async (q, target) => {
      const json = (await fetchJson(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=fr|${target}`,
        7_000,
      )) as { responseData?: { translatedText?: string } };
      const out = json.responseData?.translatedText;
      if (typeof out !== "string" || !out) throw new Error("vide");
      return out;
    },
  },
];

/**
 * Traduit un petit lot de textes français vers en/ar.
 *
 * Jamais de throw : la traduction est un confort, et l'interface doit pouvoir
 * afficher le français en secours. En échec total, `translations` rend les
 * originaux et `failed` vaut true ; en échec partiel, seuls les textes non
 * traduits restent en français.
 */
export const translateTexts = createServerFn({ method: "POST" })
  .validator((data: unknown): { target: "en" | "ar"; texts: string[] } => {
    const d = data as { target?: unknown; texts?: unknown };
    if (d?.target !== "en" && d?.target !== "ar") throw new Error("Langue cible invalide");
    if (!Array.isArray(d.texts) || d.texts.length > 8) {
      throw new Error("8 textes au maximum");
    }
    const texts = d.texts.map((x) => {
      if (typeof x !== "string" || x.length > 4_000) {
        throw new Error("Texte invalide ou trop long (4000 caractères)");
      }
      return x;
    });
    return { target: d.target, texts };
  })
  .handler(async ({ data }): Promise<TranslateResult> => {
    const out: (string | null)[] = data.texts.map(() => null);
    const used = new Set<string>();

    for (const provider of PROVIDERS) {
      for (let i = 0; i < data.texts.length; i++) {
        if (out[i] !== null) continue;
        const source = data.texts[i]!;
        // Rien à traduire : le vide reste le vide, sans appel réseau.
        if (!source.trim()) {
          out[i] = source;
          continue;
        }
        try {
          out[i] = await provider.translate(source, data.target);
          used.add(provider.name);
        } catch {
          // Ce fournisseur laisse ce texte au suivant.
        }
      }
      if (out.every((x) => x !== null)) break;
    }

    let failed = false;
    const translations = out.map((x, i) => {
      if (x !== null) return x;
      failed = true;
      return data.texts[i]!;
    });

    return { translations, provider: used.size ? [...used].join("+") : null, failed };
  });
