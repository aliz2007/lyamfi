export const CSE_SYMBOLS: ReadonlyArray<readonly [string, string]> = [
  ["CSEMA:MASI", "MASI"],
  ["CSEMA:IAM", "Maroc Telecom"],
  ["CSEMA:ATW", "Attijariwafa"],
  ["CSEMA:BCP", "Banque Populaire"],
  ["CSEMA:BOA", "Bank of Africa"],
  ["CSEMA:CDM", "Crédit du Maroc"],
  ["CSEMA:CIH", "CIH Bank"],
  ["CSEMA:EQD", "Eqdom"],
  ["CSEMA:LFA", "LafargeHolcim"],
  ["CSEMA:CIM", "Ciments du Maroc"],
  ["CSEMA:ADH", "Addoha"],
  ["CSEMA:RDS", "Res. Dar Saada"],
  ["CSEMA:RMA", "RMA"],
  ["CSEMA:MNG", "Managem"],
  ["CSEMA:CMT", "Minière Touissit"],
  ["CSEMA:SMI", "SMI"],
  ["CSEMA:TQM", "Taqa Morocco"],
  ["CSEMA:AFG", "Afriquia Gaz"],
  ["CSEMA:MSA", "Marsa Maroc"],
  ["CSEMA:HPS", "HPS"],
  ["CSEMA:LHM", "Label Vie"],
  ["CSEMA:MUT", "Mutandis"],
  ["CSEMA:OUL", "Oulmès"],
  ["CSEMA:LES", "Lesieur Cristal"],
  ["CSEMA:CDA", "Centrale Danone"],
  ["CSEMA:SNP", "SNEP"],
  ["CSEMA:SID", "Sonasid"],
  ["CSEMA:COL", "Colorado"],
  ["CSEMA:JET", "Jet Contractors"],
  ["CSEMA:WAA", "Wafa Assurance"],
  ["CSEMA:ATL", "AtlantaSanad"],
  ["CSEMA:AFM", "AFMA"],
  ["CSEMA:CTM", "CTM"],
  ["CSEMA:SOT", "Sothema"],
];

/** Groupes thématiques pour le widget de cotations en direct. */
export const CSE_GROUPS: { name: string; tickers: string[] }[] = [
  { name: "Indice & Télécom", tickers: ["MASI", "IAM"] },
  {
    name: "Banques & Assurances",
    tickers: ["ATW", "BCP", "BOA", "CDM", "CIH", "EQD", "WAA", "ATL", "AFM"],
  },
  {
    name: "Industrie & Matériaux",
    tickers: ["LFA", "CIM", "SNP", "SID", "COL", "JET", "SOT"],
  },
  { name: "Mines & Énergie", tickers: ["MNG", "CMT", "SMI", "TQM", "AFG"] },
  {
    name: "Consommation & Services",
    tickers: ["LHM", "MUT", "OUL", "LES", "CDA", "MSA", "HPS", "CTM", "ADH", "RDS", "RMA"],
  },
];

const NAME_BY_TICKER = new Map(
  CSE_SYMBOLS.map(([proName, title]) => [proName.split(":")[1]!, title]),
);

export const cseName = (ticker: string) => NAME_BY_TICKER.get(ticker.toUpperCase());

/** Vrai si la valeur dispose d'une cotation temps réel TradingView. */
export const hasCseQuote = (ticker: string) => NAME_BY_TICKER.has(ticker.toUpperCase());
