import type { Key } from "@/lib/i18n";

/**
 * Le secteur d'activité de chaque valeur de la cote.
 *
 * POURQUOI CE FICHIER EXISTE
 *
 * Le filtre par secteur lisait `stocks.sector`, une table de démonstration qui
 * ne contient que vingt lignes. Le filtre était donc faux par construction :
 * « Agroalimentaire » ne remontait que Cosumar et les Boissons du Maroc, alors
 * que la cote en compte sept, et les soixante valeurs absentes de la table
 * n'apparaissaient dans aucun secteur. Ce n'était pas un bug de filtrage mais
 * un manque de données.
 *
 * D'OÙ VIENT CE DÉCOUPAGE
 *
 * Du classeur fourni par Lyamfi (« Secteur Action Lyamfi »), et de lui seul.
 * Ce n'est pas la nomenclature officielle de la Bourse de Casablanca : le
 * classeur regroupe les boissons avec l'agroalimentaire, isole l'automobile,
 * range les foncières sous OPCI, et garde un fourre-tout « Autres » plutôt que
 * de créer une case par valeur isolée. C'est un découpage de produit, pensé
 * pour un filtre lisible, et c'est celui qui fait foi ici.
 *
 * La cote fait quatre-vingts sociétés et ne bouge que de quelques lignes par
 * an : c'est une constante du produit, pas une donnée à administrer. Elle vit
 * donc ici, à côté de `CSE_SYMBOLS` qui liste les mêmes valeurs, et le contrôle
 * de couverture (voir §5 du HANDOFF) garantit qu'une introduction en bourse ne
 * peut pas rejoindre la cote sans recevoir son secteur.
 */

/**
 * Les secteurs du classeur.
 *
 * « autres » est un fourre-tout assumé : il ferme la liste des pastilles au
 * lieu de se ranger à sa lettre entre deux secteurs nommés.
 */
export const SECTORS = [
  "agro",
  "assurances",
  "automobile",
  "banques",
  "materiaux",
  "distribution",
  "energie",
  "immobilier",
  "industrie",
  "mines",
  "opci",
  "sante",
  "financiers",
  "technologies",
  "autres",
] as const;

export type SectorId = (typeof SECTORS)[number];

/** Le fourre-tout, épinglé en fin de liste plutôt que trié à sa lettre. */
export const CATCH_ALL_SECTOR: SectorId = "autres";

/**
 * La clé de traduction d'un secteur.
 *
 * Le type littéral impose que `sector.<id>` existe dans le dictionnaire : un
 * secteur ajouté sans son libellé ne compile pas.
 */
export const sectorKey = (id: SectorId): Key => `sector.${id}`;

/**
 * Le secteur de chaque valeur, par son code de cotation.
 *
 * Les codes sont ceux de `CSE_SYMBOLS`, c'est-à-dire ceux de la Bourse de
 * Casablanca, pas ceux de la table `stocks` (qui porte encore DIS pour Disway
 * ou LFA pour Holcim). Le commentaire de chaque ligne reprend le libellé du
 * classeur, pour que la comparaison avec lui reste faisable à l'œil.
 */
export const SECTOR_BY_CODE: Readonly<Record<string, SectorId>> = {
  /* --------------------------------------------------- agro-alimentaire (7) */
  CRS: "agro", // Cartier Saada
  CSR: "agro", // Cosumar
  DRI: "agro", // Dari Couspate
  LES: "agro", // Lesieur Cristal
  MUT: "agro", // Mutandis
  OUL: "agro", // Oulmès
  SBM: "agro", // Société des Boissons du Maroc

  /* ---------------------------------------------------------- assurances (6) */
  AFM: "assurances", // AFMA
  AGM: "assurances", // Agma
  ATL: "assurances", // AtlantaSanad Assurance
  MAB: "assurances", // Maghrebail
  SAH: "assurances", // Sanlam Maroc
  WAA: "assurances", // Wafa Assurance

  /* ---------------------------------------------------------- automobile (3) */
  ATH: "automobile", // Auto Hall
  NEJ: "automobile", // Auto Nejma
  NKL: "automobile", // Ennakl Automobiles

  /* ------------------------------------------------------------- banques (7) */
  ATW: "banques", // Attijariwafa bank
  BOA: "banques", // Bank of Africa
  BCP: "banques", // BCP
  BCI: "banques", // BMCI
  CDM: "banques", // CDM
  CFG: "banques", // CFG Bank
  CIH: "banques", // CIH Bank

  /* ---------------------------------------- matériaux de construction (2) */
  CMA: "materiaux", // Ciments du Maroc
  LHM: "materiaux", // LafargeHolcim Maroc

  /* -------------------------------------------------------- distribution (6) */
  DYT: "distribution", // Disty Technologies
  DWY: "distribution", // Disway
  FBR: "distribution", // Fenie Brossette
  LBV: "distribution", // Label'Vie
  SRM: "distribution", // Réalisations Mécaniques
  SNA: "distribution", // Stokvis Nord Afrique

  /* ------------------------------------------------------------- énergie (4) */
  GAZ: "energie", // Afriquia Gaz
  MOX: "energie", // Maghreb Oxygène
  TQM: "energie", // Taqa Morocco
  TMA: "energie", // TotalEnergies Marketing Maroc

  /* ---------------------------------------------------------- immobilier (3) */
  ADH: "immobilier", // Addoha
  ADI: "immobilier", // Alliances
  RDS: "immobilier", // Résidences Dar Saada

  /* --------------------------------------------------- industrie et BTP (9) */
  AFI: "industrie", // Afric Industries
  ALM: "industrie", // Aluminium du Maroc
  JET: "industrie", // Jet Contractors
  GTM: "industrie", // SGTM
  SMI: "industrie", // SMI
  SNP: "industrie", // SNEP
  SID: "industrie", // Sonasid
  STR: "industrie", // Stroc Industrie
  TGC: "industrie", // TGCC

  /* --------------------------------------------------------------- mines (3) */
  MNG: "mines", // Managem
  CMT: "mines", // Minière de Touissit
  REB: "mines", // Rebab Company

  /* ---------------------------------------------------------------- OPCI (4) */
  ARD: "opci", // Aradei Capital
  BAL: "opci", // Balima
  IMO: "opci", // Immorente Invest
  RIS: "opci", // Risma

  /* --------------------------------------------------------------- santé (3) */
  AKT: "sante", // Akdital
  T2S: "sante", // T2S Group Holding
  VCN: "sante", // Vicenne

  /* -------------------------------------------------- services financiers (5) */
  CAP: "financiers", // Cash Plus
  DIA: "financiers", // Diac Salaf
  EQD: "financiers", // Eqdom
  MLE: "financiers", // Maroc Leasing
  SLF: "financiers", // Salafin

  /* -------------------------------------------------------- technologies (4) */
  HPS: "technologies", // HPS
  IBC: "technologies", // IB Maroc.com
  INV: "technologies", // Involys
  MIC: "technologies", // Microdata

  // ⚠️ Absent du classeur, seule valeur de la cote qui n'y figure pas. S2M
  // édite du logiciel monétique, le métier exact de HPS, que le classeur range
  // ici : c'est la case la moins arbitraire. À corriger si Lyamfi la veut
  // ailleurs.
  S2M: "technologies", // Société Maghrébine de Monétique

  /* -------------------------------------------------------------- autres (14) */
  IAM: "autres", // Itissalat Al-Maghrib (Maroc Telecom)
  MSA: "autres", // Marsa Maroc
  CTM: "autres", // CTM
  SOT: "autres", // Sothema
  COL: "autres", // Colorado
  M2M: "autres", // M2M Group
  MDP: "autres", // Med Paper
  PRO: "autres", // Promopharm
  ZDJ: "autres", // Zellidja
  DHO: "autres", // Delta Holding
  UMR: "autres", // Unimer
  DLM: "autres", // Delattre Levivier Maroc
  CMG: "autres", // CMGP
};

/** Le secteur d'une valeur, ou `null` si son code est inconnu. */
export const sectorOf = (code: string): SectorId | null =>
  SECTOR_BY_CODE[code.toUpperCase()] ?? null;
