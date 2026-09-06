import type { Key } from "@/lib/i18n";
import { MASI20_TICKER, MASI_TICKER } from "@/lib/cse-symbols";

/**
 * Mode de cotation et cours de référence de chaque valeur de la cote.
 *
 * POURQUOI CE FICHIER EXISTE
 *
 * Le classeur « Secteur Action Lyamfi » a gagné deux colonnes : le mode de
 * cotation de chaque valeur (continu ou fixing) et son cours de clôture au
 * 31/12. La première fait un filtre, la seconde fait la performance depuis le
 * début de l'année. Ce sont les deux mêmes lignes que `lib/sectors.ts`, lues
 * dans le même classeur, et elles vivent ici pour la même raison : la cote
 * bouge de quelques lignes par an, ce n'est pas une donnée à administrer.
 *
 * ⚠️ LE COURS DU 31/12 NE S'AFFICHE JAMAIS. Il ne sert qu'au calcul, en
 * arrière-plan. Ce qui se lit à l'écran est l'écart qu'il produit, pas le
 * chiffre lui-même : un cours de clôture posé à côté d'un cours en direct se
 * lirait comme une seconde cotation du jour.
 *
 * TROIS ABSENCES, TOUTES VOLONTAIRES
 *
 *   * `DIA` et `DLM` figurent au classeur avec un mode mais un tiret à la place
 *     du cours : il ne publie pas leur clôture. `close2025` vaut `null`, et la
 *     performance annuelle ne s'affiche pas pour elles. Elles restent
 *     filtrables par mode, et le tri par performance les renvoie en fin de
 *     liste.
 *   * `S2M` ne figure pas au classeur du tout — la seule valeur de la cote dans
 *     ce cas. Elle n'a donc ni mode ni cours de référence.
 *
 * ⚠️ ET CE N'EST PAS CE QU'A FAIT `lib/sectors.ts`. Là-bas, S2M a reçu un
 * secteur PAR DÉDUCTION (« technologies », le métier de HPS), avec un
 * commentaire qui l'assume. Ici, non : la consigne du brief est de ne se baser
 * que sur le fichier fourni, et un mode de cotation inventé affirmerait sur la
 * Bourse un fait qu'on ne tient de nulle part — un secteur se raisonne, une
 * procédure de cotation se lit.
 *
 * La conséquence est visible et il faut la connaître : S2M n'apparaît sous
 * AUCUNE des deux pastilles de mode, ni « Continu » ni « Fixing ». Elle reste
 * dans « Tous modes de cotation », qui est le réglage par défaut. Une ligne
 * dans le classeur la ferait rentrer dans le rang ; c'est la seule chose qui
 * manque, et elle appartient au propriétaire du classeur.
 */

/** Les deux modes de cotation de la Bourse de Casablanca. */
export const QUOTATION_MODES = ["continu", "fixing"] as const;

export type QuotationMode = (typeof QUOTATION_MODES)[number];

/**
 * La clé de traduction d'un mode de cotation.
 *
 * Comme `sectorKey`, le type littéral impose que `quotation.<mode>` existe dans
 * le dictionnaire : un mode ajouté sans son libellé ne compile pas.
 */
export const quotationKey = (mode: QuotationMode): Key => `quotation.${mode}`;

type Listing = {
  readonly mode: QuotationMode;
  /** Clôture du 31/12, `null` quand le classeur ne la publie pas. */
  readonly close2025: number | null;
};

/**
 * Une ligne du classeur par valeur, sous son code de cotation.
 *
 * Les codes sont ceux de `CSE_SYMBOLS`, post-alias (Disway est `DWY`), et le
 * commentaire reprend le libellé du classeur pour que la relecture à l'œil
 * reste faisable. L'ordre est celui du classeur, secteur par secteur.
 */
const LISTING_BY_CODE: Readonly<Record<string, Listing>> = {
  /* ---------------------------------------------------- agro-alimentaire (7) */
  CRS: { mode: "continu", close2025: 34.03 }, // Cartier Saada
  CSR: { mode: "continu", close2025: 206.87 }, // Cosumar
  DRI: { mode: "fixing", close2025: 3615 }, // Dari Couspate
  LES: { mode: "continu", close2025: 380 }, // Lesieur Cristal
  MUT: { mode: "continu", close2025: 250 }, // Mutandis
  OUL: { mode: "fixing", close2025: 1229 }, // Oulmès
  SBM: { mode: "continu", close2025: 2292 }, // Société des Boissons du Maroc

  /* ---------------------------------------------------------- assurances (6) */
  AFM: { mode: "fixing", close2025: 1230 }, // AFMA
  AGM: { mode: "fixing", close2025: 6348 }, // Agma
  ATL: { mode: "continu", close2025: 152.09 }, // AtlantaSanad Assurance
  MAB: { mode: "fixing", close2025: 943 }, // Maghrebail
  SAH: { mode: "continu", close2025: 2253 }, // Sanlam Maroc
  WAA: { mode: "continu", close2025: 4963 }, // Wafa Assurance

  /* ---------------------------------------------------------- automobile (3) */
  ATH: { mode: "continu", close2025: 94.55 }, // Auto Hall
  NEJ: { mode: "fixing", close2025: 4380 }, // Auto Nejma
  NKL: { mode: "continu", close2025: 53.38 }, // Ennakl Automobiles

  /* ------------------------------------------------------------- banques (7) */
  ATW: { mode: "continu", close2025: 745.49 }, // Attijariwafa bank
  BOA: { mode: "continu", close2025: 229.5 }, // Bank of Africa
  BCP: { mode: "continu", close2025: 288.54 }, // BCP
  BCI: { mode: "continu", close2025: 603.85 }, // BMCI
  CDM: { mode: "continu", close2025: 1100.06 }, // CDM
  CFG: { mode: "continu", close2025: 234.4 }, // CFG Bank
  CIH: { mode: "continu", close2025: 419.19 }, // CIH Bank

  /* ------------------------------------------- matériaux de construction (2) */
  CMA: { mode: "continu", close2025: 1904.06 }, // Ciments du Maroc
  LHM: { mode: "continu", close2025: 1856.92 }, // LafargeHolcim Maroc

  /* -------------------------------------------------------- distribution (6) */
  DYT: { mode: "continu", close2025: 350 }, // Disty Technologies
  DWY: { mode: "continu", close2025: 858.97 }, // Disway
  FBR: { mode: "continu", close2025: 391.55 }, // Fenie Brossette
  LBV: { mode: "continu", close2025: 4683.3 }, // Label'Vie
  SRM: { mode: "fixing", close2025: 491 }, // Réalisations Mécaniques
  SNA: { mode: "continu", close2025: 99 }, // Stokvis Nord Afrique

  /* ------------------------------------------------------------- énergie (4) */
  GAZ: { mode: "continu", close2025: 4059.97 }, // Afriquia Gaz
  MOX: { mode: "continu", close2025: 414 }, // Maghreb Oxygène
  TQM: { mode: "continu", close2025: 2153.68 }, // Taqa Morocco
  TMA: { mode: "continu", close2025: 1810.51 }, // TotalEnergies Marketing Maroc

  /* ---------------------------------------------------------- immobilier (3) */
  ADH: { mode: "continu", close2025: 35.31 }, // Addoha
  ADI: { mode: "continu", close2025: 536.69 }, // Alliances
  RDS: { mode: "continu", close2025: 170.81 }, // Résidences Dar Saada

  /* ---------------------------------------------------- industrie et BTP (9) */
  AFI: { mode: "continu", close2025: 337 }, // Afric Industries
  ALM: { mode: "continu", close2025: 1797 }, // Aluminium du Maroc
  JET: { mode: "continu", close2025: 2528.95 }, // Jet Contractors
  GTM: { mode: "continu", close2025: 933.42 }, // SGTM
  SMI: { mode: "continu", close2025: 3834.09 }, // SMI
  SNP: { mode: "continu", close2025: 490 }, // SNEP
  SID: { mode: "continu", close2025: 2269.33 }, // Sonasid
  STR: { mode: "continu", close2025: 245 }, // Stroc Industrie
  TGC: { mode: "continu", close2025: 936.25 }, // TGCC

  /* --------------------------------------------------------------- mines (3) */
  MNG: { mode: "continu", close2025: 6083.27 }, // Managem
  CMT: { mode: "continu", close2025: 1839.46 }, // Minière de Touissit
  REB: { mode: "fixing", close2025: 106.3 }, // Rebab Company

  /* ---------------------------------------------------------------- OPCI (4) */
  ARD: { mode: "continu", close2025: 429.13 }, // Aradei Capital
  BAL: { mode: "fixing", close2025: 244 }, // Balima
  IMO: { mode: "continu", close2025: 91.64 }, // Immorente Invest
  RIS: { mode: "continu", close2025: 370 }, // Risma

  /* --------------------------------------------------------------- santé (3) */
  AKT: { mode: "continu", close2025: 1239.94 }, // Akdital
  T2S: { mode: "continu", close2025: 223 }, // T2S Group Holding
  VCN: { mode: "continu", close2025: 459 }, // Vicenne

  /* ------------------------------------------------- services financiers (5) */
  CAP: { mode: "continu", close2025: 308.9 }, // Cash Plus
  DIA: { mode: "fixing", close2025: null }, // Diac Salaf
  EQD: { mode: "fixing", close2025: 1294 }, // Eqdom
  MLE: { mode: "fixing", close2025: 364 }, // Maroc Leasing
  SLF: { mode: "continu", close2025: 532 }, // Salafin

  /* -------------------------------------------------------- technologies (4) */
  HPS: { mode: "continu", close2025: 553.79 }, // HPS
  IBC: { mode: "continu", close2025: 68.58 }, // IB Maroc.com
  INV: { mode: "continu", close2025: 182 }, // Involys
  MIC: { mode: "continu", close2025: 800 }, // Microdata

  /* ------------------------------------------------------------- autres (13) */
  IAM: { mode: "continu", close2025: 111.1 }, // Itissalat Al-Maghrib (Maroc Telecom)
  MSA: { mode: "continu", close2025: 967.97 }, // Marsa Maroc
  CTM: { mode: "continu", close2025: 905 }, // CTM
  SOT: { mode: "continu", close2025: 1946.31 }, // Sothema
  COL: { mode: "continu", close2025: 83.41 }, // Colorado
  M2M: { mode: "continu", close2025: 464 }, // M2M Group
  MDP: { mode: "continu", close2025: 26.66 }, // Med Paper
  PRO: { mode: "fixing", close2025: 1488 }, // Promopharm
  ZDJ: { mode: "continu", close2025: 207 }, // Zellidja
  DHO: { mode: "continu", close2025: 75.62 }, // Delta Holding
  UMR: { mode: "fixing", close2025: 160 }, // Unimer
  DLM: { mode: "fixing", close2025: null }, // Delattre Levivier Maroc
  CMG: { mode: "continu", close2025: 376.74 }, // CMGP
};

/**
 * Les clôtures du 31/12 des deux indices de la cote.
 *
 * Elles viennent du brief et non du classeur, qui ne liste que des sociétés.
 * Même traitement et même affichage que pour une valeur : c'est le même
 * calcul, sur la même référence.
 */
const INDEX_CLOSE_2025: Readonly<Record<string, number>> = {
  [MASI_TICKER]: 18846,
  [MASI20_TICKER]: 1485,
};

/** Le mode de cotation d'une valeur, ou `null` si le classeur ne la porte pas. */
export const quotationOf = (code: string): QuotationMode | null =>
  LISTING_BY_CODE[code.toUpperCase()]?.mode ?? null;

/**
 * La clôture du 31/12 d'une valeur ou d'un indice, `null` à défaut.
 *
 * ⚠️ NON EXPORTÉE, et c'est ce qui tient la règle du haut de fichier. « Le
 * cours du 31/12 ne s'affiche jamais » était un commentaire, donc une promesse
 * qu'un `import` d'une ligne pouvait rompre depuis n'importe quelle route.
 * Fermer le module la rend vraie par construction : ce qui sort d'ici est un
 * écart en pourcentage, jamais le cours qui l'a produit.
 *
 * Les indices sont consultés d'abord : leurs codes ne sont pas des codes de
 * société, et l'ordre lève l'ambiguïté d'avance si l'un venait à le devenir.
 */
const close2025Of = (code: string): number | null => {
  const key = code.toUpperCase();
  return INDEX_CLOSE_2025[key] ?? LISTING_BY_CODE[key]?.close2025 ?? null;
};

/**
 * La performance depuis le 1er janvier, en pourcentage, arrondie au centième.
 *
 * `null` dès qu'un des deux termes manque, et le zéro compte pour une absence
 * des deux côtés. C'est la règle du produit (cf. §9 du HANDOFF) : une valeur
 * non cotée du jour arrive à zéro, et « 0 ÷ 34,03 » est un −100 % parfaitement
 * fini qui se lirait comme un effondrement plutôt que comme une absence de
 * cotation. Un dénominateur nul est écarté pour la même raison.
 *
 * Le zéro est renormalisé : `Math.round(-0,29)` vaut `-0`, qui n'a rien à faire
 * dans une donnée qu'on trie et qu'on compare. Le garde qui compte pour
 * l'affichage vit ailleurs — `pct()` dans `lib/format.ts`, sur le chemin commun
 * à la variation du jour, à cette performance-ci et à la plus-value latente.
 */
export function ytdPct(
  price: number | null | undefined,
  close2025: number | null | undefined,
): number | null {
  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) return null;
  if (typeof close2025 !== "number" || !Number.isFinite(close2025) || close2025 <= 0) return null;
  const pct = Math.round(((price - close2025) / close2025) * 10000) / 100;
  return pct === 0 ? 0 : pct;
}

/** La performance annuelle d'une valeur ou d'un indice à son cours du moment. */
export const ytdOf = (code: string, price: number | null | undefined): number | null =>
  ytdPct(price, close2025Of(code));
