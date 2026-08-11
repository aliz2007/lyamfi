import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { stocksQuery } from "@/lib/market";
import { compact, num } from "@/lib/format";
import { TradingViewWidget } from "@/components/TradingViewWidget";
import { LazyTradingView } from "@/components/LazyTradingView";
import { CSE_SYMBOLS, tvSymbol } from "@/lib/cse-symbols";

export const Route = createFileRoute("/_authenticated/bourse/")({
  head: () => ({
    meta: [
      { title: "Valeurs de la Bourse de Casablanca — Lyamfi" },
      {
        name: "description",
        content: "Cours, secteur, capitalisation et ratios de valorisation des valeurs cotées à la BVC.",
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

function BoursePage() {
  const { data: stocks = [] } = useQuery(stocksQuery);
  const [sector, setSector] = useState("all");
  const [cap, setCap] = useState<string>("all");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [tableQ, setTableQ] = useState("");

  const sectors = useMemo(
    () => Array.from(new Set(stocks.map((s) => s.sector))).sort(),
    [stocks],
  );

  /** Toutes les valeurs cotées (TradingView), enrichies des données pédagogiques en base. */
  const listings = useMemo(() => {
    const byTv = new Map(stocks.map((s) => [tvSymbol(s.ticker), s]));
    return CSE_SYMBOLS.map(([symbol, title]) => ({
      symbol,
      code: symbol.split(":")[1]!,
      title,
      stock: byTv.get(symbol) ?? null,
    })).sort((a, b) => a.title.localeCompare(b.title, "fr"));
  }, [stocks]);

  const filtered = useMemo(
    () =>
      listings.filter(({ symbol, title, stock }) => {
        const mc = Number(stock?.market_cap ?? 0);
        const capOk =
          cap === "all" ||
          (!!stock &&
            ((cap === "large" && mc > 20e9) ||
              (cap === "mid" && mc >= 5e9 && mc <= 20e9) ||
              (cap === "small" && mc < 5e9)));
        const sectorOk = sector === "all" || stock?.sector === sector;
        const needle = q.toLowerCase();
        const qOk =
          !q || title.toLowerCase().includes(needle) || symbol.toLowerCase().includes(needle);
        return capOk && sectorOk && qOk;
      }),
    [listings, cap, sector, q],
  );

  useEffect(() => setLimit(PAGE), [q, sector, cap]);

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
          Toutes les valeurs cotées ({CSE_SYMBOLS.length}) avec leur cours en direct et l'évolution
          du cours (TradingView), classées par ordre alphabétique.
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
        {filtered.slice(0, limit).map(({ symbol, code, title, stock }) => (
          <div key={symbol} className="surface-card p-5">
            {stock ? (
              <Link
                to="/bourse/$ticker"
                params={{ ticker: stock.ticker }}
                className="block transition-colors hover:text-primary"
              >
                <p className="truncate font-semibold">{stock.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {code} · {stock.sector}
                </p>
              </Link>
            ) : (
              <>
                <p className="truncate font-semibold">{title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{code} · BVC</p>
              </>
            )}

            <LazyTradingView className="-mx-2 mt-3 h-[180px]">
              <TradingViewWidget
                widget="mini-symbol-overview"
                className="h-full w-full"
                config={{
                  symbol,
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

            {stock && (
              <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <dt className="text-muted-foreground">PER</dt>
                  <dd className="mt-0.5 font-medium">{num(Number(stock.per), 1)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">DY</dt>
                  <dd className="mt-0.5 font-medium">{num(Number(stock.dividend_yield), 1)} %</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Cap.</dt>
                  <dd className="mt-0.5 font-medium">{compact(Number(stock.market_cap))}</dd>
                </div>
              </dl>
            )}
          </div>
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
