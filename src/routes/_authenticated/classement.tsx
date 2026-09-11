import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CalendarRange, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import { getLiveQuotes } from "@/lib/quotes.functions";
import { useRecordDailyQuotes } from "@/lib/quotes.history";
import { leaderboardQuery, type LeaderboardRow } from "@/lib/leaderboard";
import {
  createLeague,
  joinLeague,
  leagueLeaderboardQuery,
  leagueStatus,
  leaguesQuery,
  type League,
  type LeagueStatus,
} from "@/lib/leagues";
import { myRoleQuery } from "@/lib/admin";
import { GoldenGoat } from "@/components/GoldenGoat";
import { EMPTY, useFormat, type Formatter } from "@/lib/format";
import { useI18n, usePageTitle, type Key, type Translate } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/classement")({
  head: () => ({
    meta: [
      { title: "Classement des portefeuilles | Lyamfi" },
      {
        name: "description",
        content:
          "Classement des portefeuilles virtuels Lyamfi, du meilleur rendement au moins bon, et ligues privées.",
      },
      { property: "og:title", content: "Classement | Lyamfi" },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const { t } = useI18n();
  const f = useFormat();
  usePageTitle("lb.title");

  const qc = useQueryClient();

  // Le classement valorise les positions d'après les cours enregistrés en base,
  // pas d'après les cotations du navigateur : arriver ici sans les rafraîchir
  // afficherait la valorisation du dernier passage de quelqu'un d'autre.
  const fetchQuotes = useServerFn(getLiveQuotes);
  const { data: quotes = [] } = useQuery({
    queryKey: ["cse-quotes"],
    queryFn: () => fetchQuotes(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  useRecordDailyQuotes(quotes, () => {
    void qc.invalidateQueries({ queryKey: ["leaderboard"] });
    // Le classement d'une ligue se valorise sur les mêmes clôtures : le relevé
    // qui rafraîchit l'un doit rafraîchir l'autre, sinon la ligue ouverte sous
    // la grille reste sur les cours du passage précédent.
    void qc.invalidateQueries({ queryKey: ["league-leaderboard"] });
  });

  const { data: rows = [], isLoading, error } = useQuery(leaderboardQuery);
  const you = rows.find((r) => r.is_self) ?? null;

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="rise">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-[var(--brand-yellow)]" />
          {/* « Classement Général » et non « Classement » : la page en porte
              deux désormais, celui de la plateforme et celui de chaque ligue.
              Sans l'adjectif, la section des ligues plus bas se lirait comme un
              second classement du même objet. */}
          <h1 className="text-3xl font-bold sm:text-4xl">{t("lb.generalTitle")}</h1>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t("lb.subtitle")}
        </p>
      </header>

      {error && (
        <p className="glass p-5 text-sm text-destructive">
          {t("lb.error", { reason: (error as Error).message })}
        </p>
      )}

      {!error && rows.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-2">
          <Kpi label={t("lb.participants")} value={String(rows.length)} />
          <Kpi
            label={t("lb.yourRank")}
            value={you ? `#${you.rank}` : EMPTY}
            hint={you ? `${f.mad(you.value, 0)} · ${f.pct(you.performance)}` : undefined}
          />
        </section>
      )}

      <section className="glass overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">{t("lb.loading")}</p>
        ) : rows.length === 0 ? (
          <div className="space-y-2 p-8 text-center">
            <p className="text-sm font-medium">{t("lb.empty")}</p>
            <p className="text-xs text-muted-foreground">{t("lb.emptyHint")}</p>
          </div>
        ) : (
          <Standings rows={rows} t={t} f={f} />
        )}
      </section>

      <Leagues t={t} f={f} />
    </div>
  );
}

/* ------------------------------------------------------------------ ligues */

/**
 * Les ligues, sous le classement général.
 *
 * Une ligue est un concours privé : sa propre dotation, sa propre fenêtre de
 * dates, son propre classement. La grille les montre toutes ; le formulaire de
 * création n'apparaît qu'aux administrateurs, exactement comme celui des
 * actualités, et pour la même raison — c'est là que sa sortie s'affiche.
 */
function Leagues({ t, f }: { t: Translate; f: Formatter }) {
  const qc = useQueryClient();
  const { data: role } = useQuery(myRoleQuery);
  const isAdmin = role === "admin";

  const { data: leagues = [], isLoading, error } = useQuery(leaguesQuery);
  const [openLeague, setOpenLeague] = useState<string | null>(null);

  const join = useMutation({
    // Le nom voyage avec la mutation plutôt que d'être relu dans la liste au
    // retour : `onSuccess` invalide justement cette liste, et la relire au
    // moment où elle est en vol donnait « Tu as rejoint . ».
    mutationFn: (v: { id: string; name: string }) => joinLeague(v.id),
    onSuccess: (_pfId, v) => {
      const leagueId = v.id;
      toast.success(t("league.joined", { name: v.name }));
      void qc.invalidateQueries({ queryKey: ["leagues"] });
      // Le sélecteur de la page Portefeuille lit la même liste : sans cette
      // invalidation, le portefeuille tout juste ouvert n'y figure pas encore.
      void qc.invalidateQueries({ queryKey: ["vportfolio"] });
      setOpenLeague(leagueId);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-[var(--brand-yellow)]" />
        <h2 className="text-2xl font-bold sm:text-3xl">{t("league.title")}</h2>
      </div>
      <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{t("league.intro")}</p>

      {isAdmin && <LeagueForm t={t} />}

      {error && (
        <p className="glass p-5 text-sm text-destructive">
          {t("league.error", { reason: (error as Error).message })}
        </p>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("league.loading")}</p>
      ) : leagues.length === 0 ? (
        !error && (
          <div className="glass space-y-2 p-8 text-center">
            <p className="text-sm font-medium">{t("league.empty")}</p>
            <p className="text-xs text-muted-foreground">
              {t(isAdmin ? "league.emptyAdmin" : "league.emptyHint")}
            </p>
          </div>
        )
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {leagues.map((l) => (
            <LeagueCard
              key={l.id}
              league={l}
              open={openLeague === l.id}
              onToggle={() => setOpenLeague((cur) => (cur === l.id ? null : l.id))}
              onJoin={() => join.mutate({ id: l.id, name: l.name })}
              joining={join.isPending && join.variables?.id === l.id}
              t={t}
              f={f}
            />
          ))}
        </div>
      )}

      {openLeague && <LeagueStandings leagueId={openLeague} leagues={leagues} t={t} f={f} />}
    </section>
  );
}

const STATUS_LABEL: Record<LeagueStatus, Key> = {
  upcoming: "league.statusUpcoming",
  open: "league.statusOpen",
  closed: "league.statusClosed",
};

function LeagueCard({
  league,
  open,
  onToggle,
  onJoin,
  joining,
  t,
  f,
}: {
  league: League;
  open: boolean;
  onToggle: () => void;
  onJoin: () => void;
  joining: boolean;
  t: Translate;
  f: Formatter;
}) {
  const status = leagueStatus(league);

  return (
    // ⚠️ `min-w-0` et `break-words` sur le nom, jamais `truncate` : la largeur
    // minimale d'un élément `nowrap` est la chaîne entière, et une piste de
    // grille se dimensionne sur le min-content de ses éléments. C'est ce qui
    // avait fait glisser toute la page /bourse de côté (cf. §9i du HANDOFF), et
    // un nom de ligue est saisi à la main, donc arbitrairement long.
    <div className="surface-raised flex min-w-0 flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 break-words font-semibold">{league.name}</h3>
        <span
          className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${
            status === "open"
              ? "border-[var(--success)]/40 text-[var(--success)]"
              : status === "upcoming"
                ? "border-primary/40 bg-accent text-accent-foreground"
                : "border-border text-muted-foreground"
          }`}
        >
          {t(STATUS_LABEL[status])}
        </span>
      </div>

      <dl className="space-y-2 text-xs">
        <Line
          icon={<CalendarRange className="h-3.5 w-3.5" />}
          label={t("league.window")}
          value={`${f.shortDate(league.startsAt)} → ${f.shortDate(league.endsAt)}`}
        />
        <Line label={t("league.capital")} value={f.mad(league.startCapital, 0)} strong />
        <Line
          icon={<Users className="h-3.5 w-3.5" />}
          label={t("league.members")}
          value={String(league.members)}
        />
      </dl>

      <div className="mt-auto flex flex-wrap gap-2">
        {league.joined ? (
          <>
            {/* « Accéder » mène là où on joue : le portefeuille de la ligue,
                sélectionné par le paramètre d'URL que la page Portefeuille lit. */}
            <Link
              to="/portefeuille"
              search={{ ligue: league.id }}
              className="press inline-flex min-h-9 flex-1 items-center justify-center whitespace-nowrap rounded-full bg-gradient-gold px-4 text-xs font-semibold text-primary-foreground"
            >
              {t("league.enter")}
            </Link>
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={open}
              className="press inline-flex min-h-9 items-center whitespace-nowrap rounded-full border border-border px-4 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              {t(open ? "league.hideStandings" : "league.standings")}
            </button>
          </>
        ) : status === "closed" ? (
          // Une ligue terminée ne se rejoint plus : la base le refuse, le
          // bouton le dit avant plutôt que de laisser buter dessus.
          <button
            type="button"
            disabled
            className="inline-flex min-h-9 w-full items-center justify-center whitespace-nowrap rounded-full border border-border px-4 text-xs text-muted-foreground opacity-60"
          >
            {t("league.closed")}
          </button>
        ) : (
          <button
            type="button"
            onClick={onJoin}
            disabled={joining}
            className="press inline-flex min-h-9 w-full items-center justify-center whitespace-nowrap rounded-full bg-gradient-gold px-4 text-xs font-semibold text-primary-foreground disabled:opacity-50"
          >
            {t(joining ? "league.joining" : "league.join")}
          </button>
        )}
      </div>
    </div>
  );
}

function Line({
  icon,
  label,
  value,
  strong,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="truncate">{label}</span>
      </dt>
      <dd className={`shrink-0 whitespace-nowrap tabular-nums ${strong ? "font-semibold" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

/** Le classement d'une ligue, dans le même tableau que le classement général. */
function LeagueStandings({
  leagueId,
  leagues,
  t,
  f,
}: {
  leagueId: string;
  leagues: League[];
  t: Translate;
  f: Formatter;
}) {
  const league = leagues.find((l) => l.id === leagueId) ?? null;
  const {
    data: rows = [],
    isLoading,
    error,
  } = useQuery(leagueLeaderboardQuery(leagueId, league?.startCapital ?? 0));

  return (
    <div className="glass overflow-hidden">
      <div className="border-b border-white/10 px-5 py-4 sm:px-6">
        <h3 className="text-sm font-semibold">
          {t("league.rankingOf", { name: league?.name ?? "" })}
        </h3>
        {league && (
          <p className="mt-1 text-xs text-muted-foreground">
            {t("league.rankingHint", { capital: f.mad(league.startCapital, 0) })}
          </p>
        )}
      </div>
      {error ? (
        <p className="p-6 text-sm text-destructive">
          {t("league.error", { reason: (error as Error).message })}
        </p>
      ) : isLoading ? (
        <p className="p-6 text-sm text-muted-foreground">{t("lb.loading")}</p>
      ) : rows.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">{t("league.noMembers")}</p>
      ) : (
        <Standings rows={rows} t={t} f={f} />
      )}
    </div>
  );
}

/* ------------------------------------------- formulaire d'administration */

/**
 * Création d'une ligue.
 *
 * Il vit sur la page où les ligues s'affichent, comme le formulaire des
 * actualités vit sur le flux : on voit tout de suite ce qu'on a produit. La
 * garde `isAdmin` de l'appelant n'est qu'un masque — `league_create` revérifie
 * `is_admin()` en base, et c'est elle qui protège.
 */
function LeagueForm({ t }: { t: Translate }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [capital, setCapital] = useState("100000");

  const capitalValue = Number(capital.replace(",", "."));
  const ready =
    name.trim() !== "" &&
    startsAt !== "" &&
    endsAt !== "" &&
    Number.isFinite(capitalValue) &&
    capitalValue > 0;

  const create = useMutation({
    mutationFn: () =>
      createLeague({
        name: name.trim(),
        // `datetime-local` rend « 2026-09-30T17:00 », sans fuseau. Le convertir
        // par `new Date(...)` l'interprète dans le fuseau du navigateur, ce qui
        // est exactement ce qu'un administrateur veut dire quand il saisit une
        // heure : celle de sa montre.
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        startCapital: capitalValue,
      }),
    onSuccess: () => {
      toast.success(t("league.created"));
      setName("");
      setStartsAt("");
      setEndsAt("");
      setCapital("100000");
      void qc.invalidateQueries({ queryKey: ["leagues"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const field =
    "w-full rounded-xl border border-input bg-background px-4 py-2.5 text-base outline-none transition-colors focus:border-primary sm:text-sm";

  return (
    <section className="surface-raised p-5 sm:p-7">
      <h3 className="text-sm font-semibold">{t("league.adminTitle")}</h3>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("league.adminHint")}</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="league-name">
            {t("league.fieldName")}
          </label>
          <input
            id="league-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            placeholder={t("league.namePlaceholder")}
            className={`mt-1.5 ${field}`}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground" htmlFor="league-start">
            {t("league.fieldStart")}
          </label>
          <input
            id="league-start"
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className={`mt-1.5 ${field}`}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground" htmlFor="league-end">
            {t("league.fieldEnd")}
          </label>
          <input
            id="league-end"
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className={`mt-1.5 ${field}`}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground" htmlFor="league-capital">
            {t("league.fieldCapital")}
          </label>
          <input
            id="league-capital"
            inputMode="decimal"
            value={capital}
            onChange={(e) => setCapital(e.target.value)}
            className={`mt-1.5 ${field}`}
          />
        </div>
      </div>

      <button
        type="button"
        disabled={!ready || create.isPending}
        onClick={() => create.mutate()}
        className="press mt-5 rounded-full bg-gradient-gold px-6 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {create.isPending ? t("common.saving") : t("league.create")}
      </button>
    </section>
  );
}

/* ------------------------------------------------------------- le tableau */

/**
 * Le tableau de classement, partagé par le général et les ligues.
 *
 * Les deux classent la même chose de la même façon — liquidités, investi,
 * valeur, performance — et seule la population change. Deux tableaux jumeaux
 * auraient divergé à la première correction.
 */
function Standings({ rows, t, f }: { rows: LeaderboardRow[]; t: Translate; f: Formatter }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="text-xs text-muted-foreground">
          <tr className="border-b border-white/10">
            <th className="w-16 px-5 py-3 text-start font-medium sm:px-6">{t("lb.colRank")}</th>
            <th className="px-3 py-3 text-start font-medium">{t("lb.colName")}</th>
            <th className="px-3 py-3 text-end font-medium">{t("lb.colCash")}</th>
            <th className="px-3 py-3 text-end font-medium">{t("lb.colInvested")}</th>
            <th className="px-3 py-3 text-end font-medium">{t("lb.colValue")}</th>
            <th className="px-5 py-3 text-end font-medium sm:px-6">{t("lb.colPerf")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <Row
              key={`${row.rank}-${row.name}`}
              row={row}
              youLabel={t("lb.you")}
              goatLabel={t("lb.goat")}
              f={f}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Row({
  row,
  youLabel,
  goatLabel,
  f,
}: {
  row: LeaderboardRow;
  youLabel: string;
  goatLabel: string;
  f: Formatter;
}) {
  // Les trois premiers portent l'or de la marque, le premier un peu plus fort.
  const podium = row.rank <= 3;
  const first = row.rank === 1;

  return (
    <tr
      className={`border-b border-white/[0.06] last:border-0 ${
        row.is_self ? "bg-[var(--brand-yellow)]/[0.06]" : ""
      }`}
    >
      <td className="px-5 py-4 sm:px-6">
        <span
          className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold tabular-nums ${
            first
              ? "bg-gradient-gold text-primary-foreground"
              : podium
                ? "border border-[var(--brand-yellow)]/50 text-brand-yellow"
                : "border border-border text-muted-foreground"
          }`}
        >
          {row.rank}
        </span>
      </td>
      <td className="px-3 py-4">
        <span className={`font-medium ${podium ? "text-brand-yellow" : ""}`}>{row.name}</span>
        {first && <GoldenGoat className="ml-2" />}
        {first && <span className="sr-only">{goatLabel}</span>}
        {row.is_self && (
          <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
            {youLabel}
          </span>
        )}
      </td>
      <td className="px-3 py-4 text-end tabular-nums text-muted-foreground">
        {f.mad(row.cash, 0)}
      </td>
      <td className="px-3 py-4 text-end tabular-nums text-muted-foreground">
        {f.mad(row.invested, 0)}
      </td>
      <td className="px-3 py-4 text-end font-medium tabular-nums">{f.mad(row.value, 0)}</td>
      <td
        className={`px-5 py-4 text-end font-semibold tabular-nums sm:px-6 ${
          row.performance >= 0 ? "text-[var(--success)]" : "text-destructive"
        }`}
      >
        {f.pct(row.performance)}
      </td>
    </tr>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string | undefined }) {
  return (
    <div className="glass p-6">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-3 text-2xl font-bold tabular-nums text-brand-yellow">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
