import { createServerFn } from "@tanstack/react-start";

export type LiveQuote = {
  ticker: string;
  name: string;
  price: number;
  changePct: number;
};

/**
 * Cotations en direct de la Bourse de Casablanca (source TradingView).
 * Appelée côté serveur pour éviter les restrictions CORS du navigateur.
 */
export const getLiveQuotes = createServerFn({ method: "GET" }).handler(async (): Promise<LiveQuote[]> => {
  const res = await fetch("https://scanner.tradingview.com/morocco/scan", {
    method: "POST",
    headers: { "content-type": "text/plain;charset=UTF-8" },
    body: JSON.stringify({
      filter: [{ left: "exchange", operation: "equal", right: "CSEMA" }],
      columns: ["name", "description", "close", "change"],
      range: [0, 300],
      sort: { sortBy: "market_cap_basic", sortOrder: "desc" },
    }),
  });
  if (!res.ok) throw new Error("Cotations indisponibles");
  const json = (await res.json()) as { data?: { s: string; d: [string, string, number, number] }[] };

  const rows = (json.data ?? []).map((r) => ({
    ticker: r.d[0],
    name: r.d[1],
    price: Number(r.d[2] ?? 0),
    changePct: Number(r.d[3] ?? 0),
  }));

  // L'indice MASI n'est pas toujours renvoyé par le filtre exchange.
  if (!rows.some((r) => r.ticker === "MASI")) {
    try {
      const idx = await fetch("https://scanner.tradingview.com/morocco/scan", {
        method: "POST",
        headers: { "content-type": "text/plain;charset=UTF-8" },
        body: JSON.stringify({
          symbols: { tickers: ["CSEMA:MASI"] },
          columns: ["name", "description", "close", "change"],
        }),
      });
      const j = (await idx.json()) as { data?: { d: [string, string, number, number] }[] };
      const m = j.data?.[0];
      if (m) rows.push({ ticker: m.d[0], name: m.d[1], price: Number(m.d[2]), changePct: Number(m.d[3]) });
    } catch {
      /* l'indice reste optionnel */
    }
  }

  return rows.filter((r) => r.price > 0);
});
