import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { fundamentalsQuery, stocksQuery } from "@/lib/market";
import { getLiveQuotes } from "@/lib/quotes.functions";
import { compact, num, pct } from "@/lib/format";
import { TradingViewWidget } from "@/components/TradingViewWidget";
import { LazyTradingView } from "@/components/LazyTradingView";
import { CSE_SYMBOLS, tvSymbol } from "@/lib/cse-symbols";

export const Route = createFileRoute("/_authenticated/bourse/")({
  head: () => ({
    meta: [
      { title: "Valeurs de la Bourse de Casablanca — Lyamfi" },
      {
        name: "description",
        content:
          "Cours en direct, graphiques et données fondamentales (BPA, DPA, PER, rendement) des valeurs cotées à la Bourse de Casablanca.",
      },
      { property: "og:title", content: "Valeurs cotées à la BVC — Lyamfi" },
      { property: "og:description", content: "Explore les valeurs de la Bourse de Casablanca." },
    ],
  }),
  component: BoursePage,
});

const CAPS = [
  { id: "all", label: "Toutes capitalisations" },
  { id: "large", label: "> 20 Md MAD" },
  { id: "mid", label: "5 – 20 Md MAD" },
  { id: "small", label: "< 5 Md MAD" },
] as const;

const PAGE = 24;
const NR = "NR";

function BoursePage() {
  const { data: stocks = [] } = useQuery(stocksQuery);
  const { data: fundamentals = [] } = useQuery(fundamentalsQuery);
  const fetchQuotes = useServerFn(getLiveQuotes);
  const { data: quotes = [] } = useQuery({
    queryKey: ["cse-quotes"],
    queryFn: () => fetchQuotes(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const [sector, setSector] = useState("all");
  const [cap, setCap] = useState<string>("all");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [tableQ, setTableQ] = useState("");

  const sectors = useMemo(
    () => Array.from(new Set(stocks.map((s) => s.sector))).sort(),
    [stocks],
  );

  const fundByCode = useMemo(
    () => new Map(fundamentals.map((f) => [f.ticker.toUpperCase(), f])),
    [fundamentals],
  );
  const quoteByCode = useMemo(
    () => new Map(quotes.map((x) => [x.ticker.toUpperCase(), x])),
    [quotes],
  );
  const stockByCode = useMemo(
    () => new Map(stocks.map((s) => [tvSymbol(s.ticker).split(":")[1]!.toUpperCase(), s])),
    [stocks],
  );

  /** Toutes les valeurs cotées : fondamentaux renseignés (valeurs liquides) d'abord. */
  const listings = useMemo(() => {
    const rows = CSE_SYMBOLS.filter(([symbol]) => symbol !== "CSEMA:MASI").map(
      ([symbol, title]) => {
        const code = symbol.split(":")[1]!.toUpperCase();
        const f = fundByCode.get(code) ?? null;
        const live = quoteByCode.get(code) ?? null;
        const stock = stockByCode.get(code) ?? null;
        const price = live?.price ?? null;
        const per = (bpa: number | null) => (price && bpa && bpa > 0 ? price / bpa : null);
        const dy = (dpa: number | null) =>
          price && price > 0 && dpa !== null ? (dpa / price) * 100 : null;
        const n = (v: unknown) => (v === null || v === undefined ? null : Number(v));

        return {
          symbol,
          code,
          title: stock?.name ?? f?.name ?? title,
          sector: stock?.sector ?? null,
          stockTicker: stock?.ticker ?? null,
          covered: !!f,
          price,
          changePct: live?.changePct ?? null,
          marketCap: f && price ? price * Number(f.shares_m) * 1e6 : null,
          bpa25: n(f?.bpa_2025),
          bpa26: n(f?.bpa_2026e),
          dpa25: n(f?.dpa_2025),
          dpa26: n(f?.dpa_2026e),
          per25: per(n(f?.bpa_2025)),
          per26: per(n(f?.bpa_2026e)),
          dy25: dy(n(f?.dpa_2025)),
          dy26: dy(n(f?.dpa_2026e)),
        };
      },
    );

    return rows.sort((a, b) => {
      if (a.covered !== b.covered) return a.covered ? -1 : 1;
      if (a.covered && b.covered) return (b.marketCap ?? 0) - (a.marketCap ?? 0);
      return a.title.localeCompare(b.title, "fr");
    });
  }, [fundByCode, quoteByCode, stockByCode]);

  const filtered = useMemo(
    () =>
      listings.filter((l) => {
        const mc = l.marketCap ?? 0;
        const capOk =
          cap === "all" ||
          (l.marketCap !== null &&
            ((cap === "large" && mc > 20e9) ||
              (cap === "mid" && mc >= 5e9 && mc <= 20e9) ||
              (cap === "small" && mc < 5e9)));
        const sectorOk = sector === "all" || l.sector === sector;
        const needle = q.trim().toLowerCase();
        const qOk =
          !needle ||
          l.title.toLowerCase().includes(needle) ||
          l.code.toLowerCase().includes(needle);
        return capOk && sectorOk && qOk;
      }),
    [listings, cap, sector, q],
  );

  useEffect(() => setLimit(PAGE), [q, sector, cap]);

  const coveredCount = listings.filter((l) => l.covered).length;

  const tableSymbols = CSE_SYMBOLS.filter(
    ([proName, title]) =>
      !tableQ ||
      title.toLowerCase().includes(tableQ.toLowerCase()) ||
      proName.toLowerCase().includes(tableQ.toLowerCase()),
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold sm:text-4xl">Bourse de Casablanca</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Toutes les valeurs cotées ({CSE_SYMBOLS.length - 1}) avec leur cours en direct et leur
          graphique (TradingView). Les {coveredCount} valeurs les plus liquides — celles couvertes
          par le consensus d'analystes — apparaissent en premier avec leurs données fondamentales
          2025 / 2026e. Pour les autres, les fondamentaux sont indiqués « NR » (non renseigné).
        </p>
      </header>

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher une valeur ou un ticker"
            className="w-full rounded-xl border border-input bg-card py-3 pl-11 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip active={sector === "all"} onClick={() => setSector("all")}>
            Tous secteurs
          </Chip>
          {sectors.map((s) => (
            <Chip key={s} active={sector === s} onClick={() => setSector(s)}>
              {s}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {CAPS.map((c) => (
            <Chip key={c.id} active={cap === c.id} onClick={() => setCap(c.id)}>
              {c.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.slice(0, limit).map((l) => (
          <article key={l.symbol} className="surface-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {l.stockTicker ? (
                  <Link
                    to="/bourse/$ticker"
                    params={{ ticker: l.stockTicker }}
                    className="block transition-colors hover:text-primary"
                  >
                    <p className="truncate font-semibold">{l.title}</p>
                  </Link>
                ) : (
                  <p className="truncate font-semibold">{l.title}</p>
                )}
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {l.code} · {l.sector ?? "BVC"}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold">
                  {l.price === null ? "—" : `${l.price.toLocaleString("fr-MA")} MAD`}
                </p>
                <p
                  className={`text-xs ${
                    (l.changePct ?? 0) >= 0 ? "text-[var(--success)]" : "text-destructive"
                  }`}
                >
                  {l.changePct === null ? "—" : pct(l.changePct)}
                </p>
              </div>
            </div>

            {l.covered && (
              <span className="mt-3 inline-block rounded-full border border-primary/40 bg-accent px-2.5 py-0.5 text-[10px] font-medium text-accent-foreground">
                Valeur liquide · fondamentaux suivis
              </span>
            )}

            <LazyTradingView className="-mx-2 mt-3 h-[180px]">
              <TradingViewWidget
                widget="mini-symbol-overview"
                className="h-full w-full"
                config={{
                  symbol: l.symbol,
                  width: "100%",
                  height: "100%",
                  locale: "fr",
                  dateRange: "12M",
                  colorTheme: "dark",
                  isTransparent: true,
                  autosize: true,
                  chartOnly: false,
                  noTimeScale: false,
                }}
              />
            </LazyTradingView>

            <dl className="mt-4 space-y-2 text-xs">
              <Row label="Capitalisation" value={l.marketCap ? compact(l.marketCap) : NR} />
              <Row
                label="BPA 25 / 26e"
                value={
                  l.covered ? `${num(l.bpa25, 1)} / ${num(l.bpa26, 1)}` : NR
                }
              />
              <Row
                label="DPA 25 / 26e"
                value={l.covered ? `${num(l.dpa25, 1)} / ${num(l.dpa26, 1)}` : NR}
              />
              <Row
                label="PER 25 / 26e"
                value={l.covered ? `${num(l.per25, 1)}x / ${num(l.per26, 1)}x` : NR}
                strong
              />
              <Row
                label="Rendement 25 / 26e"
                value={l.covered ? `${num(l.dy25, 1)} % / ${num(l.dy26, 1)} %` : NR}
                strong
              />
            </dl>
          </article>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucune valeur ne correspond aux filtres.</p>
        )}
      </div>

      {limit < filtered.length && (
        <div className="flex justify-center">
          <button
            onClick={() => setLimit((l) => l + PAGE)}
            className="rounded-full border border-border px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Afficher plus ({filtered.length - limit} restantes)
          </button>
        </div>
      )}

      <section className="surface-card overflow-hidden p-2 sm:p-4">
        <h2 className="px-2 pb-2 pt-1 text-sm font-semibold">
          Toutes les valeurs cotées ({CSE_SYMBOLS.length})
        </h2>
        <div className="relative px-2 pb-3">
          <Search className="absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={tableQ}
            onChange={(e) => setTableQ(e.target.value)}
            placeholder="Rechercher dans la cote (nom ou ticker)"
            className="w-full rounded-xl border border-input bg-card py-2.5 pl-11 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>
        <TradingViewWidget
          key={tableSymbols.length}
          widget="market-quotes"
          className="h-[620px] w-full"
          config={{
            width: "100%",
            height: 580,
            symbolsGroups: [
              {
                name: "Bourse de Casablanca",
                symbols: tableSymbols.map(([proName, title]) => ({
                  name: proName,
                  displayName: title,
                })),
              },
            ],
            showSymbolLogo: true,
            isTransparent: true,
            colorTheme: "dark",
            locale: "fr",
          }}
        />
        <p className="px-2 pb-1 text-xs text-muted-foreground">
          Données de marché fournies par TradingView, différées ou temps réel selon la source.
        </p>
      </section>

      <p className="text-xs text-muted-foreground">
        Prévisions BPA / DPA issues d'un consensus d'analystes ; PER, rendement et capitalisation
        recalculés au cours du jour. « NR » signifie non renseigné pour l'instant. Outil pédagogique,
        ne constitue pas un conseil en investissement.
      </p>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-1.5 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={strong ? "font-semibold" : "font-medium"}>{value}</dd>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
        active
          ? "border-primary/60 bg-accent text-accent-foreground"
          : "border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
