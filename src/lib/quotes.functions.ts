import { createServerFn } from "@tanstack/react-start";
import { CSE_SYMBOLS, MASI20_TICKER, MASI_TICKER } from "@/lib/cse-symbols";

export type LiveQuote = {
  ticker: string;
  name: string;
  price: number;
  changePct: number;
};

const SCANNER = "https://scanner.tradingview.com/morocco/scan";
const COLUMNS = ["name", "description", "close", "change"];

type ScanRow = { d: [string, string, number, number] };

async function scan(body: unknown): Promise<ScanRow[]> {
  const res = await fetch(SCANNER, {
    method: "POST",
    headers: { "content-type": "text/plain;charset=UTF-8" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Cotations indisponibles");
  const json = (await res.json()) as { data?: ScanRow[] };
  return json.data ?? [];
}

const toQuote = (r: ScanRow): LiveQuote => ({
  ticker: r.d[0],
  name: r.d[1],
  price: Number(r.d[2] ?? 0),
  changePct: Number(r.d[3] ?? 0),
});

/**
 * Reconnaît un indice de la cote au seul vu de son code, et lui donne le code
 * interne sous lequel l'interface l'interroge.
 *
 * Le symbole du MASI 20 chez TradingView n'est pas documenté et se rencontre
 * sous plusieurs graphies (MASI20, MSI20, MASI_20). Plutôt que de parier sur
 * l'une d'elles, on les accepte toutes et on range le résultat sous un code
 * unique.
 */
function indexByTicker(ticker: string): string | null {
  const t = ticker.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (t === MASI_TICKER) return MASI_TICKER;
  if (t === "MSI20" || (t.startsWith("MASI") && t.includes("20"))) return MASI20_TICKER;
  return null;
}

/**
 * Même reconnaissance, en s'autorisant en dernier ressort le libellé.
 *
 * Réservée aux réponses dont on sait déjà qu'elles ne contiennent QUE des
 * indices : appliquée au balayage général de la place, elle prendrait pour un
 * indice une société dont la raison sociale contiendrait « MASI » et « 20 ».
 */
function indexCode(ticker: string, description: string): string | null {
  const byTicker = indexByTicker(ticker);
  if (byTicker) return byTicker;
  const d = description.toUpperCase();
  if (d.includes("MASI") && /(^|[^0-9])20([^0-9]|$)/.test(d)) return MASI20_TICKER;
  return null;
}

/** Codes candidats du MASI 20, essayés si le balayage par type n'a rien donné. */
const INDEX_CANDIDATES = ["CSEMA:MASI", "CSEMA:MASI20", "CSEMA:MSI20", "CSEMA:MASI_20"];

/**
 * Les indices de la cote, MASI et MASI 20.
 *
 * Deux tentatives, dans cet ordre. La première demande à TradingView tout ce
 * qu'il classe comme indice sur CSEMA : elle découvre les codes au lieu de les
 * deviner, et survit donc à un renommage. La seconde interroge directement une
 * liste de codes plausibles, au cas où le filtre par type ne renverrait rien.
 *
 * Le tout est optionnel : sans indice, les cartes correspondantes ne
 * s'affichent pas, mais les cours des actions restent intacts.
 */
async function fetchIndices(): Promise<LiveQuote[]> {
  const found = new Map<string, LiveQuote>();

  const collect = (rows: ScanRow[]) => {
    for (const row of rows) {
      const code = indexCode(row.d[0] ?? "", row.d[1] ?? "");
      if (!code || found.has(code)) continue;
      const q = toQuote(row);
      if (q.price > 0) found.set(code, { ...q, ticker: code });
    }
  };

  try {
    collect(
      await scan({
        filter: [
          { left: "exchange", operation: "equal", right: "CSEMA" },
          { left: "type", operation: "equal", right: "index" },
        ],
        columns: COLUMNS,
        range: [0, 50],
      }),
    );
  } catch {
    /* on tente la liste de codes ci-dessous */
  }

  if (found.size < 2) {
    try {
      collect(await scan({ symbols: { tickers: INDEX_CANDIDATES }, columns: COLUMNS }));
    } catch {
      /* les indices restent optionnels */
    }
  }

  return [...found.values()];
}

/**
 * Rattrape les valeurs que le balayage par place ne renvoie pas.
 *
 * Le filtre `exchange = CSEMA` est un écran de sélection : il omet des valeurs
 * peu liquides (Agma, Auto Nejma, CMT, Dari Couspate, Delattre Levivier, Diac
 * Salaf, Zellidja en ont fait les frais), exactement comme il omettait déjà
 * l'indice MASI. L'interrogation par symbole, elle, ne trie rien : on demande
 * nommément ce qui manque, en une seule requête.
 *
 * L'absence d'un titre n'est donc plus une fatalité affichée en « N/A » : elle
 * ne le reste que si TradingView ne connaît vraiment pas le code.
 */
async function fetchBySymbol(symbols: string[]): Promise<LiveQuote[]> {
  if (symbols.length === 0) return [];
  try {
    return (await scan({ symbols: { tickers: symbols }, columns: COLUMNS }))
      .map(toQuote)
      .filter((q) => q.price > 0);
  } catch {
    // Le rattrapage est un bonus : son échec ne doit pas emporter la cote.
    return [];
  }
}

/**
 * Cotations en direct de la Bourse de Casablanca (source TradingView).
 * Appelée côté serveur pour éviter les restrictions CORS du navigateur.
 */
export const getLiveQuotes = createServerFn({ method: "GET" }).handler(
  async (): Promise<LiveQuote[]> => {
    const rows = (
      await scan({
        filter: [{ left: "exchange", operation: "equal", right: "CSEMA" }],
        columns: COLUMNS,
        range: [0, 300],
        sort: { sortBy: "market_cap_basic", sortOrder: "desc" },
      })
    )
      .map(toQuote)
      // Un indice renvoyé par le balayage général porte le code de la source ;
      // on le ramène tout de suite au code interne, sinon le complément
      // ci-dessous le récupérerait une seconde fois sous son autre graphie.
      .map((q) => {
        const code = indexByTicker(q.ticker);
        return code ? { ...q, ticker: code } : q;
      })
      .filter((r) => r.price > 0);

    const seen = new Set(rows.map((r) => r.ticker.toUpperCase()));
    const add = (quotes: LiveQuote[]) => {
      for (const q of quotes) {
        const code = q.ticker.toUpperCase();
        if (seen.has(code)) continue;
        rows.push({ ...q, ticker: code });
        seen.add(code);
      }
    };

    // Rattrapage nominatif des valeurs cotées que le balayage a laissées de
    // côté. La cote de référence est `CSE_SYMBOLS`, pas ce que TradingView a
    // bien voulu renvoyer.
    const missing = CSE_SYMBOLS.map(([symbol]) => symbol).filter(
      (symbol) => !seen.has(symbol.split(":")[1]!.toUpperCase()),
    );
    add(await fetchBySymbol(missing));

    // Les indices demandent un traitement à part : le code du MASI 20 n'est pas
    // documenté, il se découvre au lieu de se demander.
    if (!seen.has(MASI_TICKER) || !seen.has(MASI20_TICKER)) add(await fetchIndices());

    return rows;
  },
);
