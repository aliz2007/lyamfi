import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Search } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { fundamentalsQuery, stocksQuery } from "@/lib/market";
import { getLiveQuotes } from "@/lib/quotes.functions";
import { EMPTY, useFormat } from "@/lib/format";
import { Sparkline } from "@/components/Sparkline";
import { CSE_SYMBOLS, tvSymbol } from "@/lib/cse-symbols";
import { MarketSessionBadge } from "@/components/MarketSessionBadge";
import { recentHistoryQuery, useRecordDailyQuotes } from "@/lib/quotes.history";
import { useI18n, usePageTitle, type Key } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/bourse/")({
  head: () => ({
    meta: [
      { title: "Valeurs de la Bourse de Casablanca | Lyamfi" },
      {
        name: "description",
        content:
          "Cours en direct, graphiques et données fondamentales (BPA, DPA, PER, rendement) des valeurs cotées à la Bourse de Casablanca.",
      },
      { property: "og:title", content: "Valeurs cotées à la BVC | Lyamfi" },
      {
        property: "og:description",
        content: "Explore les valeurs de la Bourse de Casablanca.",
      },
    ],
  }),
  component: BoursePage,
});

const CAPS: { id: string; label: Key }[] = [
  { id: "all", label: "bourse.capAll" },
  { id: "large", label: "bourse.capLarge" },
  { id: "mid", label: "bourse.capMid" },
  { id: "small", label: "bourse.capSmall" },
];

/**
 * Tris disponibles. « changeDesc » et « changeAsc » répondent au besoin le
 * plus concret de la page : voir d'un coup les plus fortes hausses ou les
 * plus fortes baisses de la séance.
 */
const SORTS = ["default", "changeDesc", "changeAsc", "capDesc", "nameAsc"] as const;
type Sort = (typeof SORTS)[number];

const SORT_LABEL: Record<Sort, Key> = {
  default: "bourse.sortDefault",
  changeDesc: "bourse.sortChangeDesc",
  changeAsc: "bourse.sortChangeAsc",
  capDesc: "bourse.sortCapDesc",
  nameAsc: "bourse.sortNameAsc",
};

const PAGE = 24;
const NR = "NR";

function BoursePage() {
  const { t, locale } = useI18n();
  const f = useFormat();
  usePageTitle("bourse.title");

  const { data: stocks = [] } = useQuery(stocksQuery);
  const { data: fundamentals = [] } = useQuery(fundamentalsQuery);
  const fetchQuotes = useServerFn(getLiveQuotes);
  const { data: quotes = [] } = useQuery({
    queryKey: ["cse-quotes"],
    queryFn: () => fetchQuotes(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // Archive la clôture du jour dans notre propre base : c'est elle qui
  // alimentera les graphiques, à la place du widget TradingView retiré.
  useRecordDailyQuotes(quotes);

  const { data: sparkByCode } = useQuery(recentHistoryQuery());

  const [sector, setSector] = useState("all");
  const [cap, setCap] = useState("all");
  const [sort, setSort] = useState<Sort>("default");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(PAGE);

  const sectors = useMemo(() => Array.from(new Set(stocks.map((s) => s.sector))).sort(), [stocks]);

  const fundByCode = useMemo(
    () => new Map(fundamentals.map((x) => [x.ticker.toUpperCase(), x])),
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
        const fund = fundByCode.get(code) ?? null;
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
          title: stock?.name ?? fund?.name ?? title,
          sector: stock?.sector ?? null,
          stockTicker: stock?.ticker ?? null,
          covered: !!fund,
          price,
          changePct: live?.changePct ?? null,
          marketCap: fund && price ? price * Number(fund.shares_m) * 1e6 : null,
          bpa25: n(fund?.bpa_2025),
          bpa26: n(fund?.bpa_2026e),
          dpa25: n(fund?.dpa_2025),
          dpa26: n(fund?.dpa_2026e),
          per25: per(n(fund?.bpa_2025)),
          per26: per(n(fund?.bpa_2026e)),
          dy25: dy(n(fund?.dpa_2025)),
          dy26: dy(n(fund?.dpa_2026e)),
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

  /**
   * Tri appliqué après filtrage. Une valeur sans cours du jour n'a pas de
   * variation : elle est renvoyée en fin de liste dans les deux sens, sinon
   * elle occuperait le haut du classement des baisses avec un zéro trompeur.
   */
  const sorted = useMemo(() => {
    if (sort === "default") return filtered;
    const rows = [...filtered];
    if (sort === "nameAsc") {
      return rows.sort((a, b) => a.title.localeCompare(b.title, locale));
    }
    if (sort === "capDesc") {
      return rows.sort((a, b) => (b.marketCap ?? -1) - (a.marketCap ?? -1));
    }
    const dir = sort === "changeDesc" ? -1 : 1;
    return rows.sort((a, b) => {
      const av = a.changePct;
      const bv = b.changePct;
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return (av - bv) * dir;
    });
  }, [filtered, sort, locale]);

  useEffect(() => setLimit(PAGE), [q, sector, cap, sort]);

  const coveredCount = listings.filter((l) => l.covered).length;
  const up = filtered.filter((l) => (l.changePct ?? 0) > 0).length;
  const down = filtered.filter((l) => (l.changePct ?? 0) < 0).length;

  return (
    <div className="space-y-8">
      <header className="rise">
        <h1 className="text-3xl font-bold sm:text-4xl">{t("bourse.title")}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {t("bourse.intro", { total: CSE_SYMBOLS.length - 1, covered: coveredCount })}
        </p>
        <MarketSessionBadge className="mt-5" />
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--success)]/40 px-3 py-1 text-[var(--success)]">
            <ArrowUp className="h-3 w-3" /> {t("bourse.gainersToday", { n: up })}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 px-3 py-1 text-destructive">
            <ArrowDown className="h-3 w-3" /> {t("bourse.losersToday", { n: down })}
          </span>
        </div>
      </header>

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("bourse.searchPlaceholder")}
            className="w-full rounded-xl border border-input bg-card py-3 pl-11 pr-4 text-sm outline-none transition-colors focus:border-primary"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Chip active={sector === "all"} onClick={() => setSector("all")}>
            {t("bourse.allSectors")}
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
              {t(c.label)}
            </Chip>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
          <span className="text-xs text-muted-foreground">{t("bourse.sortBy")}</span>
          {SORTS.map((s) => (
            <Chip key={s} active={sort === s} onClick={() => setSort(s)}>
              <span className="inline-flex items-center gap-1.5">
                {s === "changeDesc" && <ArrowUp className="h-3 w-3" />}
                {s === "changeAsc" && <ArrowDown className="h-3 w-3" />}
                {t(SORT_LABEL[s])}
              </span>
            </Chip>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.slice(0, limit).map((l) => (
          // La vignette entière mène à la fiche interne. Auparavant seules les
          // 20 valeurs présentes dans `stocks` étaient cliquables, et le
          // graphique incrusté renvoyait vers tradingview.com.
          <Link
            key={l.symbol}
            to="/bourse/$ticker"
            params={{ ticker: l.code }}
            className="surface-raised card-hover block p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{l.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {l.code} · {l.sector ?? "BVC"}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold tabular-nums">
                  {l.price === null ? EMPTY : `${f.price(l.price)} MAD`}
                </p>
                <p
                  className={`text-xs tabular-nums ${
                    l.changePct === null
                      ? "text-muted-foreground"
                      : l.changePct >= 0
                        ? "text-[var(--success)]"
                        : "text-destructive"
                  }`}
                >
                  {l.changePct === null ? EMPTY : f.pct(l.changePct)}
                </p>
              </div>
            </div>

            {l.covered && (
              <span className="mt-3 inline-block rounded-full border border-primary/40 bg-accent px-2.5 py-0.5 text-[10px] font-medium text-accent-foreground">
                {t("bourse.liquidBadge")}
              </span>
            )}

            <div className="-mx-1 mt-3">
              <Sparkline values={sparkByCode?.get(l.code) ?? []} />
            </div>

            <dl className="mt-4 space-y-2 text-xs">
              <Row
                label={t("bourse.marketCap")}
                value={l.marketCap ? f.compact(l.marketCap) : NR}
              />
              <Row
                label={t("bourse.eps")}
                value={l.covered ? `${f.num(l.bpa25, 1)} / ${f.num(l.bpa26, 1)}` : NR}
              />
              <Row
                label={t("bourse.dps")}
                value={l.covered ? `${f.num(l.dpa25, 1)} / ${f.num(l.dpa26, 1)}` : NR}
              />
              <Row
                label={t("bourse.per")}
                value={l.covered ? `${f.num(l.per25, 1)}x / ${f.num(l.per26, 1)}x` : NR}
                strong
              />
              <Row
                label={t("bourse.dy")}
                value={l.covered ? `${f.num(l.dy25, 1)} % / ${f.num(l.dy26, 1)} %` : NR}
                strong
              />
            </dl>
          </Link>
        ))}
        {sorted.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("bourse.noMatch")}</p>
        )}
      </div>

      {limit < sorted.length && (
        <div className="flex justify-center">
          <button
            onClick={() => setLimit((l) => l + PAGE)}
            className="rounded-full border border-border px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            {t("bourse.showMore", { rest: sorted.length - limit })}
          </button>
        </div>
      )}

      <p className="text-xs leading-relaxed text-muted-foreground">{t("bourse.footnote")}</p>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-1.5 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`tabular-nums ${strong ? "font-semibold" : "font-medium"}`}>{value}</dd>
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
      aria-pressed={active}
      className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
        active
          ? "border-primary/60 bg-accent text-accent-foreground"
          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
