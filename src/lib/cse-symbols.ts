export const CSE_SYMBOLS: ReadonlyArray<readonly [string, string]> = [
  ["CSEMA:MASI", "MASI (indice)"],
  ["CSEMA:AFM", "AFMA"],
  ["CSEMA:AFI", "Afric Industries"],
  ["CSEMA:GAZ", "Afriquia Gaz"],
  ["CSEMA:AGM", "Agma"],
  ["CSEMA:AKT", "Akdital"],
  ["CSEMA:ADI", "Alliances Developpement Immobiliere"],
  ["CSEMA:ALM", "Aluminium du Maroc"],
  ["CSEMA:ARD", "Aradei Capital"],
  ["CSEMA:ATL", "AtlantaSanad"],
  ["CSEMA:ATW", "Attijariwafa Bank"],
  ["CSEMA:ATH", "Auto Hall"],
  ["CSEMA:NEJ", "Auto Nejma"],
  ["CSEMA:BOA", "Bank of Africa"],
  ["CSEMA:BCP", "Banque Centrale Populaire"],
  ["CSEMA:BCI", "Banque Marocaine pour le Commerce et l'Industrie"],
  ["CSEMA:CRS", "Cartier Saada"],
  ["CSEMA:CAP", "Cash plus"],
  ["CSEMA:CFG", "CFG Bank"],
  ["CSEMA:CMA", "Ciments du Maroc"],
  ["CSEMA:CMG", "CMGP GROUP"],
  ["CSEMA:COL", "Colorado"],
  ["CSEMA:CTM", "Compagnie de Transport au Maroc"],
  ["CSEMA:CMT", "Compagnie Miniere de Touissit"],
  ["CSEMA:CSR", "COSUMAR"],
  ["CSEMA:CDM", "Credit du Maroc"],
  ["CSEMA:CIH", "Credit Immobilier et Hotelier"],
  ["CSEMA:DRI", "DARI Couspate S.A."],
  ["CSEMA:DLM", "Delattre Levivier Maroc"],
  ["CSEMA:DHO", "Delta Holding"],
  ["CSEMA:DIA", "Diac Salaf"],
  ["CSEMA:DYT", "Disty Technologies"],
  ["CSEMA:DWY", "Disway"],
  ["CSEMA:ADH", "Douja Promotion Groupe Addoha"],
  ["CSEMA:NKL", "Ennakl"],
  ["CSEMA:FBR", "Fenie Brossette"],
  ["CSEMA:HPS", "Hightech Payment Systems"],
  ["CSEMA:LHM", "Holcim Maroc"],
  ["CSEMA:IBC", "IBMaroc.com"],
  ["CSEMA:IMO", "Immorente Invest"],
  ["CSEMA:INV", "Involys"],
  ["CSEMA:JET", "Jet Contractors"],
  ["CSEMA:LBV", "Label'Vie"],
  ["CSEMA:OUL", "Les Eaux Minerales d'Oulmes"],
  ["CSEMA:LES", "Lesieur Cristal"],
  ["CSEMA:M2M", "M2M Group"],
  ["CSEMA:MOX", "Maghreb Oxygene"],
  ["CSEMA:MAB", "Maghrebail"],
  ["CSEMA:MNG", "Managem"],
  ["CSEMA:MLE", "Maroc Leasing"],
  ["CSEMA:IAM", "Maroc Telecom"],
  ["CSEMA:MSA", "Marsa Maroc"],
  ["CSEMA:MDP", "Med Paper"],
  ["CSEMA:MIC", "Microdata"],
  ["CSEMA:MUT", "Mutandis"],
  ["CSEMA:SNP", "Nationale d'Electrolyse et de Petrochimie"],
  ["CSEMA:PRO", "Promopharm"],
  ["CSEMA:REB", "Rebab Company"],
  ["CSEMA:RDS", "Residences Dar Saada"],
  ["CSEMA:RIS", "Risma"],
  ["CSEMA:SLF", "Salafin"],
  ["CSEMA:SAH", "Sanlam Maroc"],
  ["CSEMA:EQD", "Societe d'Equipement Domestique et Menager"],
  ["CSEMA:SRM", "Societe de Realisations Mecaniques"],
  ["CSEMA:SBM", "Societe des Boissons du Maroc"],
  ["CSEMA:GTM", "Societe Generale des Travaux du Maroc"],
  ["CSEMA:BAL", "Societe Immobiliere Balima"],
  ["CSEMA:S2M", "Societe Maghrebine de Monetique"],
  ["CSEMA:SMI", "Societe Metallurgique d'Imiter"],
  ["CSEMA:SID", "SONASID"],
  ["CSEMA:SOT", "Sothema"],
  ["CSEMA:SNA", "Stokvis Nord Afrique"],
  ["CSEMA:STR", "STROC Industrie"],
  ["CSEMA:T2S", "T2S Group Holding"],
  ["CSEMA:TQM", "TAQA Morocco"],
  ["CSEMA:TMA", "TotalEnergies Marketing Maroc"],
  ["CSEMA:TGC", "Travaux Generaux de Construction de Casablanca"],
  ["CSEMA:UMR", "Unimer"],
  ["CSEMA:VCN", "Vicenne"],
  ["CSEMA:WAA", "Wafa Assurance"],
  ["CSEMA:ZEL", "Zellidja"],
];

/** Alias entre les tickers utilisés en base et les symboles TradingView. */
/**
 * Tickers hérités de la table `stocks` qui ne correspondent pas au code de la
 * cote. `DIS` y désigne Disway, alors que la Bourse de Casablanca cote Disway
 * sous DWY et Diac Salaf sous DIA : sans cet alias, les deux valeurs se
 * confondaient.
 */
const TV_ALIASES: Record<string, string> = {
  DIS: "DWY",
  LFA: "LHM",
  CIM: "CMA",
  AFG: "GAZ",
};

const NAME_BY_TICKER = new Map(
  CSE_SYMBOLS.map(([proName, title]) => [proName.split(":")[1]!, title]),
);

/** Symbole TradingView correspondant à un ticker de la base. */
export const tvSymbol = (ticker: string) => {
  const t = ticker.toUpperCase();
  return `CSEMA:${TV_ALIASES[t] ?? t}`;
};

export const cseName = (ticker: string) => NAME_BY_TICKER.get(tvSymbol(ticker).split(":")[1]!);

/** Vrai si la valeur dispose d'une cotation temps réel TradingView. */
export const hasCseQuote = (ticker: string) => NAME_BY_TICKER.has(tvSymbol(ticker).split(":")[1]!);

/** Tous les tickers TradingView, triés alphabétiquement par nom. */
export const CSE_TICKERS = CSE_SYMBOLS.map(([proName]) => proName.split(":")[1]!);

/* ------------------------------------------------------------------ indices */

/** Indice large de la Bourse de Casablanca. */
export const MASI_TICKER = "MASI";

/**
 * MASI 20, l'indice des vingt valeurs les plus liquides.
 *
 * Le code retenu ici est celui sous lequel l'application le range, pas
 * forcément celui que publie la source : `lib/quotes.functions.ts` accepte
 * plusieurs graphies (MASI20, MSI20, « MASI 20 ») et les ramène toutes à
 * celle-ci, parce que le symbole TradingView de cet indice n'est pas
 * documenté et a déjà changé.
 */
export const MASI20_TICKER = "MASI20";

/**
 * Ce qui est un indice et non une action.
 *
 * Les cotations servent aussi à peupler la liste des valeurs négociables du
 * portefeuille : sans ce filtre, un indice y apparaîtrait comme un titre
 * achetable.
 */
export const INDEX_TICKERS: ReadonlySet<string> = new Set([MASI_TICKER, MASI20_TICKER]);

export const isIndexTicker = (ticker: string) => INDEX_TICKERS.has(ticker.toUpperCase());

/** Page TradingView d'une valeur ou d'un indice de la cote de Casablanca. */
export const tradingViewUrl = (ticker: string) =>
  `https://www.tradingview.com/symbols/${tvSymbol(ticker).replace(":", "-")}/`;
