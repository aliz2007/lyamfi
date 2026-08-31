import type { Key } from "@/lib/i18n";

/**
 * Le secteur d'activité de chaque valeur de la cote.
 *
 * POURQUOI CE FICHIER EXISTE
 *
 * Le filtre par secteur lisait `stocks.sector`, une table de démonstration qui
 * ne contient que vingt lignes. Le filtre était donc faux par construction :
 * « Agroalimentaire » ne remontait que Cosumar et les Boissons du Maroc, alors
 * que la cote en compte plusieurs autres, et les soixante valeurs absentes de
 * la table n'apparaissaient dans aucun secteur. Ce n'était pas un bug de
 * filtrage mais un manque de données.
 *
 * La cote fait quatre-vingts sociétés et ne bouge que de quelques lignes par
 * an : c'est une constante du produit, pas une donnée à administrer. Elle vit
 * donc ici, à côté de `CSE_SYMBOLS` qui liste les mêmes valeurs, et le test de
 * couverture ci-dessous garantit qu'une introduction en bourse ne peut pas être
 * ajoutée à la cote sans recevoir son secteur.
 *
 * Le découpage suit celui que publie la Bourse de Casablanca. Les banques y
 * sont séparées des sociétés de financement, les boissons de l'agroalimentaire,
 * et les holdings ne sont pas classées avec leurs participations.
 */

/** Les secteurs de la cote, dans l'ordre alphabétique du libellé français. */
export const SECTORS = [
  "agroalimentaire",
  "assurances",
  "banques",
  "batiment",
  "boissons",
  "chimie",
  "distributeurs",
  "electricite",
  "financement",
  "holdings",
  "immobilier",
  "informatique",
  "ingenierie",
  "loisirs",
  "mines",
  "papier",
  "petrole",
  "pharmacie",
  "sante",
  "telecoms",
  "transport",
] as const;

export type SectorId = (typeof SECTORS)[number];

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
 * ou LFA pour Holcim).
 */
export const SECTOR_BY_CODE: Readonly<Record<string, SectorId>> = {
  /* ------------------------------------------- agroalimentaire et boissons */
  CRS: "agroalimentaire", // Cartier Saada
  CSR: "agroalimentaire", // Cosumar
  DRI: "agroalimentaire", // Dari Couspate
  LES: "agroalimentaire", // Lesieur Cristal
  MUT: "agroalimentaire", // Mutandis
  UMR: "agroalimentaire", // Unimer
  OUL: "boissons", // Les Eaux Minérales d'Oulmès
  SBM: "boissons", // Société des Boissons du Maroc

  /* ------------------------------------------------ banques et assurances */
  ATW: "banques", // Attijariwafa Bank
  BCP: "banques", // Banque Centrale Populaire
  BOA: "banques", // Bank of Africa
  BCI: "banques", // BMCI
  CDM: "banques", // Crédit du Maroc
  CFG: "banques", // CFG Bank
  CIH: "banques", // CIH Bank
  AFM: "assurances", // AFMA (courtage)
  AGM: "assurances", // Agma (courtage)
  ATL: "assurances", // AtlantaSanad
  SAH: "assurances", // Sanlam Maroc
  WAA: "assurances", // Wafa Assurance

  /* ------------------------------ sociétés de financement et portefeuilles */
  CAP: "financement", // Cash Plus
  DIA: "financement", // Diac Salaf
  MAB: "financement", // Maghrebail
  MLE: "financement", // Maroc Leasing
  SLF: "financement", // Salafin
  DHO: "holdings", // Delta Holding
  REB: "holdings", // Rebab Company
  ZDJ: "holdings", // Zellidja

  /* -------------------------------- bâtiment, matériaux et infrastructures */
  AFI: "batiment", // Afric Industries
  ALM: "batiment", // Aluminium du Maroc
  CMA: "batiment", // Ciments du Maroc
  GTM: "batiment", // SGTM
  JET: "batiment", // Jet Contractors
  LHM: "batiment", // Holcim Maroc
  SID: "batiment", // Sonasid
  TGC: "batiment", // TGCC

  /* ------------------------------- ingénierie et biens d'équipement */
  CMG: "ingenierie", // CMGP Group
  DLM: "ingenierie", // Delattre Levivier Maroc
  FBR: "ingenierie", // Fenie Brossette
  SRM: "ingenierie", // Société de Réalisations Mécaniques
  STR: "ingenierie", // Stroc Industrie

  /* ----------------------------------------------- immobilier et foncières */
  ADH: "immobilier", // Douja Promotion Groupe Addoha
  ADI: "immobilier", // Alliances Développement Immobilier
  ARD: "immobilier", // Aradei Capital
  BAL: "immobilier", // Société Immobilière Balima
  IMO: "immobilier", // Immorente Invest
  RDS: "immobilier", // Résidences Dar Saada

  /* --------------------------------------------- informatique et paiements */
  DWY: "informatique", // Disway
  DYT: "informatique", // Disty Technologies
  HPS: "informatique", // Hightech Payment Systems
  IBC: "informatique", // IB Maroc
  INV: "informatique", // Involys
  M2M: "informatique", // M2M Group
  MIC: "informatique", // Microdata
  S2M: "informatique", // S2M
  T2S: "informatique", // T2S Group Holding

  /* ----------------------------------------------------------- industrie */
  COL: "chimie", // Colorado
  MOX: "chimie", // Maghreb Oxygène
  SNP: "chimie", // Snep
  MDP: "papier", // Med Paper
  PRO: "pharmacie", // Promopharm
  SOT: "pharmacie", // Sothema
  AKT: "sante", // Akdital
  VCN: "sante", // Vicenne

  /* ------------------------------------------------------ mines et énergie */
  CMT: "mines", // Compagnie Minière de Touissit
  MNG: "mines", // Managem
  SMI: "mines", // Société Métallurgique d'Imiter
  GAZ: "petrole", // Afriquia Gaz
  TMA: "petrole", // TotalEnergies Marketing Maroc
  TQM: "electricite", // Taqa Morocco

  /* ------------------------------------- distribution, transport, services */
  ATH: "distributeurs", // Auto Hall
  EQD: "distributeurs", // Société d'Équipement Domestique et Ménager
  LBV: "distributeurs", // Label'Vie
  NEJ: "distributeurs", // Auto Nejma
  NKL: "distributeurs", // Ennakl
  SNA: "distributeurs", // Stokvis Nord Afrique
  CTM: "transport", // Compagnie de Transports au Maroc
  MSA: "transport", // Marsa Maroc
  RIS: "loisirs", // Risma
  IAM: "telecoms", // Maroc Telecom
};

/** Le secteur d'une valeur, ou `null` si son code est inconnu. */
export const sectorOf = (code: string): SectorId | null =>
  SECTOR_BY_CODE[code.toUpperCase()] ?? null;
