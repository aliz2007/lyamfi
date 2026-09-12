import { CSE_SYMBOLS } from "@/lib/cse-symbols";

/**
 * Moteur de mots-clés des actualités.
 *
 * À partir du titre et de l'extrait FR d'une carte, produit ≤6 ids :
 *   - « c:<TICKER> » pour une société cotée (CSE_SYMBOLS) repérée par son
 *     ticker en majuscules ou par un alias de nom distinctif (« akdital »,
 *     « attijariwafa », « labelvie »…) ;
 *   - « t:<theme> » pour un thème de presse financière (18 ids, motifs FR).
 *
 * Module pur, sans I/O : testable sous node. La même extraction sert au
 * dépôt initial (upsert) et au rattrapage des lignes déjà en cache.
 */

export const THEME_IDS = [
  "marche",
  "resultats",
  "dividendes",
  "ipo",
  "opa",
  "taux",
  "inflation",
  "petrole",
  "change",
  "banques",
  "assurances",
  "immobilier",
  "mines",
  "energie",
  "tourisme",
  "agriculture",
  "regulation",
  "international",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

/** Plafond contractuel de la liste rendue (et de la colonne en base). */
const MAX_KEYWORDS = 6;

/* -------------------------------------------------------- normalisation */

/**
 * NFD, diacritiques ôtés, minuscules, blancs tassés. Les élisions françaises
 * (l', d', qu'…) sont décollées en début de mot (« l'industrie » →
 * « l industrie ») pour que ni les alias ni les motifs n'héritent d'un
 * monstre fusionné (« lindustrie ») ; les autres apostrophes sont laissées
 * en place, chaque variante décide de leur sort.
 */
function normalizeBase(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/(^|\s)(l|d|qu|j|n|s|t|c|m)['’`]/g, "$1$2 ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Variante « fusionnée » : apostrophes restantes supprimées (« Label'Vie »
 * et « LabelVie » donnent tous deux « labelvie »). Sert aux raisons sociales.
 */
const normalize = (s: string): string => normalizeBase(s).replace(/['’`]/g, "");

/**
 * Variante « élidée » : apostrophe restante = séparateur. Proche de la
 * fusionnée depuis que les élisions sont décollées dans normalizeBase ;
 * conservée pour les apostrophes non élidées (« Akdital l'inaugure »).
 */
const normalizeSpaced = (s: string): string => normalizeBase(s).replace(/['’`]/g, " ");

/**
 * Construit une regex de « phrase entière » : chaque suite non alphanumérique
 * du motif épouse n'importe quel séparateur du texte (« bank al maghrib »
 * trouve « Bank Al-Maghrib »), les bords interdisent les sous-mots (« ope »
 * ne trouve pas « europe ») et un « s » final optionnel couvre les pluriels
 * (« énergétique » trouve « énergétiques »).
 */
function phraseRe(phrase: string, plural: boolean): RegExp {
  const core = phrase
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("[^a-z0-9]+");
  return new RegExp(`(?:^|[^a-z0-9])(${core}${plural ? "s?" : ""})(?:[^a-z0-9]|$)`);
}

/** Position de la première occurrence du motif, MAX_SAFE_INTEGER si absent. */
function firstIndex(re: RegExp, text: string): number {
  const m = re.exec(text);
  return m ? m.index : Number.MAX_SAFE_INTEGER;
}

/* ------------------------------------------------------------- sociétés */

/**
 * Acronymes qui ne sont JAMAIS un ticker, même en majuscules dans le titre :
 * institutions, agrégats et sigles de la presse financière. Sans cette
 * denylist, « BCE » ou « OPA » deviendraient de fausses sociétés.
 */
const TICKER_DENYLIST: ReadonlySet<string> = new Set([
  "BCE",
  "FED",
  "MASI",
  "OPA",
  "OPV",
  "IPO",
  "MAD",
  "PIB",
  "DH",
  "MDH",
  "MMDH",
  "BAM",
  "AMMC",
  "FMI",
  "OCDE",
  "UE",
  "USA",
  "PNB",
  "PER",
  "ROE",
  "BDT",
  "OPCI",
  "TAEG",
  "YTD",
  "T1",
  "T2",
  "S1",
  "S2",
]);

/**
 * Mots vides des raisons sociales : jamais un alias à eux seuls. La liste du
 * cahier des charges (groupe, holding, bank…) est étendue des mots
 * GÉNÉRIQUES du vocabulaire d'entreprise (« capital », « credit »,
 * « immobilier »…) : les prendre pour alias produirait un faux positif à
 * chaque occurrence du mot courant (« Capital-risque » → Aradei Capital).
 */
const NAME_STOPWORDS: ReadonlySet<string> = new Set([
  "groupe",
  "holding",
  "bank",
  "banque",
  "maroc",
  "du",
  "de",
  "la",
  "societe",
  "sa",
  // — extension « mot générique » —
  "compagnie",
  "company",
  "group",
  "capital",
  "credit",
  "credits",
  "generale",
  "centrale",
  "marocaine",
  "commerce",
  "residences",
  "afrique",
  "immobilier",
  "immobiliere",
  "developpement",
  "promotion",
  "technologies",
  "industrie",
  "industries",
  "invest",
  "investissement",
  "travaux",
  "transport",
  "equipement",
  "marketing",
  "leasing",
  "assurance",
  "assurances",
  "energie",
  "energies",
]);

type Company = {
  ticker: string;
  name: string;
  /** Regex du ticker en majuscules, mot entier, sur le texte ORIGINAL. */
  tickerRe: RegExp | null;
  /** Nom complet normalisé (« maroc telecom »). */
  nameRe: RegExp;
  /** Alias distinctif (« attijariwafa », « labelvie »), null si aucun. */
  alias: string | null;
  aliasRe: RegExp | null;
};

function buildCompanies(): Company[] {
  // Fréquence de chaque mot dans l'ensemble des raisons sociales : l'alias
  // le plus distinctif est le mot significatif le plus RARE.
  const freq = new Map<string, number>();
  const wordsOf = (norm: string) => norm.split(/[^a-z0-9]+/).filter(Boolean);
  const entries = CSE_SYMBOLS.filter(([pro]) => pro !== "CSEMA:MASI");
  for (const [, name] of entries) {
    for (const w of new Set(wordsOf(normalize(name)))) {
      freq.set(w, (freq.get(w) ?? 0) + 1);
    }
  }

  return entries.map(([pro, name]) => {
    const ticker = pro.split(":")[1]!;
    const norm = normalize(name);

    const alias =
      wordsOf(norm)
        .filter((w) => w.length >= 5 && !NAME_STOPWORDS.has(w))
        .sort((a, b) => {
          const d = (freq.get(a) ?? 0) - (freq.get(b) ?? 0);
          return d !== 0 ? d : b.length - a.length || a.localeCompare(b);
        })[0] ?? null;

    const tickerRe =
      /^[A-Z0-9]{2,5}$/.test(ticker) && !TICKER_DENYLIST.has(ticker)
        ? new RegExp(`(?<![\\p{L}\\p{N}])${ticker}(?![\\p{L}\\p{N}])`, "u")
        : null;

    return {
      ticker,
      name,
      tickerRe,
      nameRe: phraseRe(norm, false),
      alias,
      aliasRe: alias && alias !== norm ? phraseRe(alias, false) : null,
    };
  });
}

const COMPANIES: Company[] = buildCompanies();

/* --------------------------------------------------------------- thèmes */

/**
 * Motifs de presse financière francophone, déjà normalisés (sans diacritiques,
 * apostrophes fusionnées). Plusieurs motifs d'un même thème ne comptent
 * qu'une fois : le score est par thème, pas par motif.
 */
const THEME_PATTERNS: Record<ThemeId, string[]> = {
  marche: [
    "bourse de casablanca",
    "bourse de casablanca",
    "masi",
    "marche boursier",
    "seance boursiere",
    "cote de casablanca",
    "les indices",
    "la cote",
  ],
  resultats: [
    "resultats",
    "resultat net",
    "chiffre d affaires",
    "benefice",
    "benefices",
    "comptes annuels",
    "comptes semestriels",
  ],
  dividendes: ["dividende", "dividendes", "coupon", "distribution de dividendes"],
  ipo: ["ipo", "introduction en bourse", "admission a la cote", "premiere cotation"],
  opa: ["opa", "ope", "offre publique", "prise de controle", "rachat de"],
  taux: [
    "taux directeur",
    "taux d interet",
    "taux",
    "bank al maghrib",
    "bons du tresor",
    "obligataire",
    "politique monetaire",
  ],
  inflation: [
    "inflation",
    "inflationniste",
    "inflationnistes",
    "hausse des prix",
    "indice des prix",
    "rencherissement",
  ],
  petrole: ["petrole", "petrolier", "petroliers", "brent", "wti", "opep", "baril", "barils"],
  change: [
    "dirham",
    "dirhams",
    "change",
    "changes",
    "devises",
    "marche des changes",
    "euro",
    "dollar",
    "dollars",
    "parite",
  ],
  banques: ["banque", "banques", "bancaire", "bancaires", "credit bancaire", "credits bancaires"],
  assurances: ["assurance", "assurances", "assureur", "assureurs", "reassurance"],
  immobilier: [
    "immobilier",
    "immobiliere",
    "immobiliers",
    "logement",
    "logements",
    "promoteur",
    "promoteurs",
    "foncier",
  ],
  mines: ["mine", "mines", "minier", "miniere", "phosphate", "phosphates", "ocp"],
  energie: [
    "energie",
    "energies",
    "energetique",
    "electricite",
    "electrique",
    "onee",
    "solaire",
    "eolien",
    "carburant",
    "carburants",
  ],
  tourisme: ["tourisme", "touriste", "touristes", "touristique", "hotellerie", "hotel", "hotels"],
  agriculture: [
    "agriculture",
    "agricole",
    "agricoles",
    "recolte",
    "recoltes",
    "cereales",
    "secheresse",
    "agrumes",
  ],
  regulation: [
    "ammc",
    "conseil de la concurrence",
    "regulateur",
    "reglementation",
    "sanction",
    "sanctions",
    "amende",
    "amendes",
    "loi de finances",
  ],
  international: [
    "bce",
    "fed",
    "wall street",
    "europe",
    "europeenne",
    "etats unis",
    "fmi",
    "ocde",
    "banque mondiale",
    "mondial",
    "mondiale",
    "international",
    "internationale",
    "chine",
    "chinois",
    "etranger",
    "etrangere",
    "washington",
  ],
};

const THEME_RES: ReadonlyArray<readonly [ThemeId, RegExp[]]> = (
  Object.entries(THEME_PATTERNS) as [ThemeId, string[]][]
).map(([id, patterns]) => [id, patterns.map((p) => phraseRe(p, true))]);

/* ------------------------------------------------------------ extraction */

type Hit = { id: string; score: number; pos: number };

/**
 * Les mots-clés d'une carte, triés par pertinence (score desc, puis ordre
 * d'apparition), plafonnés à 6. Peut rendre moins, voire rien : une carte
 * hors société et hors thème reste sans mot-clé.
 *
 * Barème : ticker +4 ; nom/alias dans le titre +3, dans l'extrait +1 ;
 * thème dans le titre +2, dans l'extrait +1.
 */
export function extractKeywords(title: string, excerpt: string): string[] {
  const normTitle = normalize(title);
  const normExcerpt = normalize(excerpt);
  // Variante élidée pour les thèmes (« l'inflation » → « l inflation »).
  const normTitleS = normalizeSpaced(title);
  const normExcerptS = normalizeSpaced(excerpt);
  const hits: Hit[] = [];

  for (const c of COMPANIES) {
    let score = 0;
    let pos = Number.MAX_SAFE_INTEGER;

    // Ticker : mot entier en MAJUSCULES dans le texte original, +4.
    if (c.tickerRe) {
      const pt = firstIndex(c.tickerRe, title);
      const pe = firstIndex(c.tickerRe, excerpt);
      if (pt !== Number.MAX_SAFE_INTEGER || pe !== Number.MAX_SAFE_INTEGER) {
        score += 4;
        pos = Math.min(pos, pt, pe === Number.MAX_SAFE_INTEGER ? pe : 100_000 + pe);
      }
    }

    // Nom complet ou alias, sur le texte normalisé : titre +3, extrait +1.
    const namePosT = Math.min(
      firstIndex(c.nameRe, normTitle),
      c.aliasRe ? firstIndex(c.aliasRe, normTitle) : Number.MAX_SAFE_INTEGER,
    );
    const namePosE = Math.min(
      firstIndex(c.nameRe, normExcerpt),
      c.aliasRe ? firstIndex(c.aliasRe, normExcerpt) : Number.MAX_SAFE_INTEGER,
    );
    if (namePosT !== Number.MAX_SAFE_INTEGER) {
      score += 3;
      pos = Math.min(pos, namePosT);
    } else if (namePosE !== Number.MAX_SAFE_INTEGER) {
      score += 1;
      pos = Math.min(pos, 100_000 + namePosE);
    }

    if (score > 0) hits.push({ id: `c:${c.ticker}`, score, pos });
  }

  for (const [id, res] of THEME_RES) {
    let posT = Number.MAX_SAFE_INTEGER;
    let posE = Number.MAX_SAFE_INTEGER;
    for (const re of res) {
      posT = Math.min(posT, firstIndex(re, normTitle), firstIndex(re, normTitleS));
      posE = Math.min(posE, firstIndex(re, normExcerpt), firstIndex(re, normExcerptS));
    }
    if (posT !== Number.MAX_SAFE_INTEGER) hits.push({ id: `t:${id}`, score: 2, pos: posT });
    else if (posE !== Number.MAX_SAFE_INTEGER)
      hits.push({ id: `t:${id}`, score: 1, pos: 100_000 + posE });
  }

  hits.sort((a, b) => b.score - a.score || a.pos - b.pos || a.id.localeCompare(b.id));
  return hits.slice(0, MAX_KEYWORDS).map((h) => h.id);
}

/* ------------------------------------------------------------- helpers */

/**
 * Décompose un id de mot-clé. « c:AKT » → société ; « t:petrole » → thème
 * (seuls les 18 ids connus sont acceptés) ; toute autre forme → null.
 */
export function parseKeywordId(
  id: string,
): { kind: "company"; ticker: string } | { kind: "theme"; theme: ThemeId } | null {
  const m = /^([ct]):([A-Za-z0-9+-]{2,40})$/.exec(id);
  if (!m) return null;
  if (m[1] === "c") return { kind: "company", ticker: m[2]! };
  const theme = m[2]!;
  return (THEME_IDS as readonly string[]).includes(theme)
    ? { kind: "theme", theme: theme as ThemeId }
    : null;
}

/** Raison sociale d'un ticker de la cote, null si inconnu. */
export function companyNameForTicker(ticker: string): string | null {
  const up = ticker.toUpperCase();
  const hit = CSE_SYMBOLS.find(([pro]) => pro.split(":")[1] === up);
  return hit ? hit[1] : null;
}
