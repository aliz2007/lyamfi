import { createServerFn } from "@tanstack/react-start";
import { MASI20_TICKER, MASI_TICKER } from "@/lib/cse-symbols";

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

    // Le filtre par place ne renvoie pas systématiquement les indices : ils sont
    // complétés à part, et jamais dupliqués s'ils étaient déjà là.
    const seen = new Set(rows.map((r) => r.ticker.toUpperCase()));
    if (!seen.has(MASI_TICKER) || !seen.has(MASI20_TICKER)) {
      for (const q of await fetchIndices()) {
        if (!seen.has(q.ticker)) {
          rows.push(q);
          seen.add(q.ticker);
        }
      }
    }

    return rows;
  },
);
