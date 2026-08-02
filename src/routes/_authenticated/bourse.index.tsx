import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { stocksQuery } from "@/lib/market";
import { compact, num, pct } from "@/lib/format";
import { TradingViewWidget } from "@/components/TradingViewWidget";
import { CSE_GROUPS, cseName } from "@/lib/cse-symbols";

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

function BoursePage() {
  const { data: stocks = [], isLoading } = useQuery(stocksQuery);
  const [sector, setSector] = useState("all");
  const [cap, setCap] = useState<string>("all");
  const [q, setQ] = useState("");

  const sectors = useMemo(
    () => Array.from(new Set(stocks.map((s) => s.sector))).sort(),
    [stocks],
  );

  const filtered = stocks.filter((s) => {
    const mc = Number(s.market_cap);
    const capOk =
      cap === "all" ||
      (cap === "large" && mc > 20e9) ||
      (cap === "mid" && mc >= 5e9 && mc <= 20e9) ||
      (cap === "small" && mc < 5e9);
    const sectorOk = sector === "all" || s.sector === sector;
    const qOk =
      !q ||
      s.name.toLowerCase().includes(q.toLowerCase()) ||
      s.ticker.toLowerCase().includes(q.toLowerCase());
    return capOk && sectorOk && qOk;
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold sm:text-4xl">Bourse de Casablanca</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Cotations en direct de la BVC (TradingView) et fiches pédagogiques de {stocks.length}{" "}
          valeurs suivies.
        </p>
      </header>

      <section className="surface-card overflow-hidden p-2 sm:p-4">
        <h2 className="px-2 pb-2 pt-1 text-sm font-semibold">Cours en direct</h2>
        <TradingViewWidget
          widget="market-quotes"
          className="h-[620px] w-full"
          config={{
            width: "100%",
            height: 580,
            symbolsGroups: CSE_GROUPS.map((g) => ({
              name: g.name,
              symbols: g.tickers.map((t) => ({
                name: `CSEMA:${t}`,
                displayName: cseName(t) ?? t,
              })),
            })),
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

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement des valeurs…</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <Link
              key={s.id}
              to="/bourse/$ticker"
              params={{ ticker: s.ticker }}
              className="surface-card p-5 transition-colors hover:border-primary/50"
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{s.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {s.ticker} · {s.sector}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-xs ${
                    Number(s.change_pct) >= 0
                      ? "bg-[color-mix(in_oklab,var(--success)_18%,transparent)] text-[var(--success)]"
                      : "bg-destructive/15 text-destructive"
                  }`}
                >
                  {pct(Number(s.change_pct))}
                </span>
              </div>
              <p className="mt-5 text-2xl font-bold">
                {Number(s.price).toLocaleString("fr-MA")}{" "}
                <span className="text-sm font-normal text-muted-foreground">MAD</span>
              </p>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <dt className="text-muted-foreground">PER</dt>
                  <dd className="mt-0.5 font-medium">{num(Number(s.per), 1)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">DY</dt>
                  <dd className="mt-0.5 font-medium">{num(Number(s.dividend_yield), 1)} %</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Cap.</dt>
                  <dd className="mt-0.5 font-medium">{compact(Number(s.market_cap))}</dd>
                </div>
              </dl>
            </Link>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune valeur ne correspond aux filtres.</p>
          )}
        </div>
      )}
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
