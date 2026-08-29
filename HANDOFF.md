# Lyamfi: Codebase Handoff

_Written 2026-08-18, last revised 2026-08-29. Everything below was read from the source and, where marked ✅, executed._

> **Latest change (2026-08-29):** Actualités **rebuilt** as a searchable feed of horizontal cards leading to a full reading page, a **macroeconomic dashboard** at `/macroeconomie`, **Budget renamed Simulateurs** with a new **credit simulator**, **auto-login**, a **15 % capital-gains tax** on sales, and fixes for the **missing quotes** and the **frozen leaderboard**. One migration to apply: see §12.
>
> _2026-08-27:_ the Actualités section itself, leaner `/bourse` cards with two new sorts, order execution tied to the real trading session, and the MASI / MASI 20 pair on the dashboard.

---

## 1. What Lyamfi is

A French-language financial-education platform for the **Bourse de Casablanca (BVC)**: Morocco's stock exchange. It teaches retail investors to read the market before risking money in it. Dark-mode, mobile-first, gold-on-black.

**Live:** https://lyamfi.lovable.app

Eight surfaces:

| Surface | Route | What it does |
|---|---|---|
| Landing | `/` | Value prop, 4 module teasers, sign-up CTA |
| Dashboard | `/dashboard` | Portfolio value, MASI + MASI 20, day's top 5 gainers/losers, learning progress |
| Bourse | `/bourse`, `/bourse/$ticker` | 81 listed companies, live prices, charts, fundamentals |
| Portefeuille | `/portefeuille` | Paper-trading with 100 000 MAD, market + limit orders, session-aware order book, vs-MASI curve |
| Classement | `/classement` | Leaderboard by portfolio value, cash / invested split |
| Académie | `/academie`, `/academie/$slug` | 14 lessons in 3 gated levels, quiz + badge per lesson |
| Actualités | `/actualites`, `/actualites/$id` | Searchable news feed, full reading page, admin CRUD |
| Macroéconomie | `/macroeconomie` | 5 TradingView charts on the Moroccan economy |
| Simulateurs | `/simulateurs` | Compound interest (3 risk profiles) and a credit simulator |

Nav order is fixed in `components/AppShell.tsx`: Actualités sits between Académie and Simulateurs. `/macroeconomie` is reached from the banner atop `/actualites`, not from the nav. `/budget` still resolves: it redirects to `/simulateurs` so old links keep working.

**Origin:** built with [Lovable](https://lovable.dev). 93 commits, 2026-07-31 → 2026-08-18. The repo syncs bidirectionally with the Lovable editor: see `AGENTS.md`: **never force-push, rebase, amend, or squash already-pushed commits**, it corrupts project history on Lovable's side.

> ⚠️ **`README.md` is not documentation.** It is the original Lovable *prompt*: the product spec that generated the app. Read it for design intent, not for how anything works. Some of it was never built (sector-concentration scoring, diversification score, allocation pie chart) and some of it was superseded (the portfolio became a real paper-trading engine rather than the "% weighting" simulator described).

---

## 2. Verified status ✅

I ran these in a clean checkout:

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ **Clean.** Zero type errors, under a genuinely strict config (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`). Re-run 2026-08-27. |
| `npm run build` | ✅ **Succeeds** in a few seconds. Emits a Cloudflare Workers bundle (`.output/`, auto-generated `wrangler.json`, `nodejs_compat`). Re-run 2026-08-27. |
| `npm run lint` | ❌ **~590 problems**: but **584 are Prettier formatting** and auto-fixable, and the other 6 are benign `react-refresh` warnings inside vendored shadcn/ui files. **Zero real code-quality errors.** `npm run format` clears it. Every file touched since is formatted and lint-clean. |
| `supabase/setup.sql` | ✅ **Applied twice in a row** against a throwaway PostgreSQL 16 with stand-ins for the `auth` and `storage` schemas, 2026-08-27. Clean both times, so it is genuinely re-runnable. |
| Tests | **None exist.** No test runner, no test files, no CI workflow. |

The codebase is in good mechanical health. The lint number looks alarming and isn't.

---

## 3. Getting it running: read this first

### The install trap 🚩

**`bun install` fails outside Lovable's sandbox.** `bun.lock` hardcodes tarball URLs pointing at Lovable's private registry:

```
europe-west4-npm.pkg.dev/lovable-core-prod/sandbox-npm-cache/...
```

Ten entries are pinned this way: every `@supabase/*` package, the `@lovable.dev/*` plugins, and `iceberg-js`. From anywhere else they return **403**, and `bun install --registry=...` does *not* override them because the lockfile stores resolved URLs.

Every one of those packages **is** on public npm. Two ways through:

```bash
npm install          # ignores bun.lock entirely, this is what I used ✅
# or regenerate: rm bun.lock && bun install
```

If you regenerate `bun.lock`, note `bunfig.toml` enforces a 24-hour supply-chain delay (`minimumReleaseAge = 86400`) with an allowlist for `@lovable.dev/*` packages.

### Environment

`.env` supplies six variables (each Supabase value is duplicated with a `VITE_` prefix for the client bundle):

```
SUPABASE_URL / VITE_SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY / VITE_SUPABASE_PUBLISHABLE_KEY
SUPABASE_PROJECT_ID / VITE_SUPABASE_PROJECT_ID
```

Supabase project id: `pwbrjfdxkcpndowwtjea` (`supabase/config.toml`).

> ⚠️ **`.env` is committed to git and is not in `.gitignore`.** Nothing secret is exposed *today*, it holds only the project URL, id, and the publishable (anon) key, all of which ship in the client bundle by design. The risk is forward-looking: `src/integrations/supabase/client.server.ts` already expects a `SUPABASE_SERVICE_ROLE_KEY`, and the moment anyone adds it to that file it gets committed to a repo that syncs to Lovable. **Add `.env` to `.gitignore` now.**

### Commands

```bash
npm run dev      # vite dev server
npm run build    # production build → .output/
npm run preview  # serve the build
npm run lint     # eslint (see note above)
npm run format   # prettier --write .
```

---

## 4. Stack

- **TanStack Start** (`^1.168`): file-based routing, SSR, server functions. Not Next.js: `src/routes/README.md` explicitly warns against Next/Remix conventions.
- **React 19**, TypeScript strict
- **TanStack Query** for all server state
- **Supabase**: Postgres + email/password auth + RLS
- **Tailwind v4** (CSS-first `@theme`, no `tailwind.config.js`) + **shadcn/ui** (~50 vendored components in `src/components/ui/`)
- **Recharts** for charts, **TradingView embeds** for live market widgets
- **Cloudflare Workers** deploy target via Nitro
- **`@lovable.dev/vite-tanstack-config`** (a meta-config that bundles the TanStack Start plugin, React, Tailwind, tsconfig-paths, Nitro, and env injection. `vite.config.ts` is 15 lines because of it, and **carries an explicit warning not to add those plugins manually**), duplicates break the app.

### Entry points

- `src/start.ts`: registers global middleware: `attachSupabaseAuth` (attaches the user's bearer token to every server-function RPC), an error-normalising middleware, and **an explicitly re-added CSRF middleware** (defining `start.ts` opts out of Start's automatic one, so it's manually restored).
- `src/server.ts`: SSR entry wrapper. Exists to defeat a specific h3 behaviour: h3 swallows in-handler throws into an opaque `{"unhandled":true,"message":"HTTPError"}` 500 with no stack. `src/lib/error-capture.ts` monkey-patches `console.error` to record the real error out-of-band, and `server.ts` recovers it and renders a proper error page.
- `src/router.tsx`: QueryClient + router factory.
- `src/routeTree.gen.ts`: **auto-generated, never edit.**

---

## 5. The data model: understand this before touching anything

**This is the single most important section.** Stock data comes from **four** sources that are joined at runtime by ticker, and they disagree with each other.

| # | Source | Size | Freshness | Used for |
|---|---|---|---|---|
| 1 | **`CSE_SYMBOLS`**: hardcoded array in `src/lib/cse-symbols.ts` | 82 entries (81 companies + MASI) | Manual | **The master list.** Decides what appears on `/bourse` at all, and drives the ticker tape. |
| 2 | **TradingView scanner**: `getLiveQuotes()` server fn | ~live universe | Live, 60s refetch | Every price and % change shown anywhere in the app. |
| 3 | **`stock_metrics`** table | 80 rows | The fundamentals workbook, seeded 2026-08-25 | Everything price-independent (share count, BPA, DPA, book value…). Market cap, PER, yield, P/B, P/S and P/FCF are *derived at render time* against the live price. The older `stock_fundamentals` (37 rows) is no longer read by the market pages. |
| 4 | **`stocks`** table | 20 rows | Seeded 2026-07-31, **stale** | Sector filter, company description, the `/bourse/$ticker` detail page, and its PER/BPA/PEG/target-price block. |

### How they join

DB tickers and TradingView tickers don't always match, so `cse-symbols.ts` keeps an alias map:

```ts
const TV_ALIASES = { DIS: "DWY", LFA: "LHM", CIM: "CMA", AFG: "GAZ" };
```

Everything funnels through `tvSymbol(ticker)` → `"CSEMA:XXX"`. I verified all 20 `stocks` rows and all 37 `stock_fundamentals` rows resolve cleanly into `CSE_SYMBOLS`: **no orphans today**, but adding a row with a mismatched ticker will silently produce a card with no price.

### What this means on screen (`/bourse`): exact numbers ✅

Of the **81** company cards:

- **37 are "covered"**, they have a `stock_fundamentals` row, get a *"Valeur liquide · fondamentaux suivis"* badge, sort first, and show real BPA/DPA/PER/yield.
- **44 show "NR"** (non renseigné) for every fundamental.
- **Only 20 are clickable** through to a detail page: precisely those with a row in the `stocks` table. The other 61 are dead-end cards.
- Of the 20 clickable: **16 are also covered**, 4 are clickable but show NR.
- **21 cards are covered but not clickable**: full fundamentals, no detail page.

That asymmetry is the biggest content gap in the product. Closing it means backfilling the `stocks` table (sector + description + id) for the other 61 listings.

### Stale-data caveat

`stocks.price` and `stocks.change_pct` are July-2026 seed values. They're only used as a **fallback** on the detail page when the live quote is missing (`bourse.$ticker.tsx:62-63`): so a detail page can silently render a months-old price. The detail page's PER/BPA/PEG/target-price come *entirely* from that stale seed, unlike the list page which recomputes against live prices. **The same stock can show different PERs on the list and the detail page.**

Also unused: `stock_fundamentals.per_2025`, `per_2026e`, `dy_2025`, `dy_2026e` are stored but **never read**: the UI always recomputes them from the live price. Keep them in sync or drop them.

---

## 6. Routing & auth

File-based, `src/routes/`. Auth boundary is the `_authenticated` layout route:

```ts
// src/routes/_authenticated/route.tsx
ssr: false,
beforeLoad: async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw redirect({ to: "/auth" });
  return { user: data.user };
}
```

Consequences worth knowing:

- **The entire authenticated app is client-rendered** (`ssr: false`). Only `/` and `/auth` are server-rendered, which is the right call for SEO, since those are the public pages, and all five authed routes still define proper `head()` meta.
- Auth is **email/password only**, via `supabase.auth`. Sessions live in `localStorage`, auto-refreshed.
- Sign-up honours email confirmation: if `signUp` returns no session, the user is told to check their inbox.
- `/auth?mode=signup` toggles the form; validated with a small Zod schema (email, 6–72 char password).

**UX snag:** the landing page's secondary CTA *"Explorer les valeurs"* links to `/bourse`, which is behind the auth gate: an anonymous visitor is bounced straight to `/auth`. Either make a public read-only bourse view or relabel the button.

---

## 7. Database

Five migrations in `supabase/migrations/`. **Every table has RLS enabled** and the policies are correct: user-owned tables scope by `auth.uid()`, and child tables (`portfolio_*`) check ownership through an `EXISTS` subquery on `portfolios`.

| Table | Rows seeded | Access |
|---|---|---|
| `profiles` | N/A | own row only; auto-created by an `on_auth_user_created` trigger |
| `stocks` | 20 | public read |
| `stock_prices` | 12 months × 20 | public read |
| `stock_fundamentals` | 37 | public read |
| `lessons` | 6 | public read |
| `lesson_progress` | N/A | own rows |
| `portfolios` | N/A | own rows (`cash` numeric, default 100000) |
| `portfolio_holdings` | N/A | own, via portfolio |
| `portfolio_trades` | N/A | own, via portfolio |
| `portfolio_snapshots` | N/A | own, via portfolio; unique on `(portfolio_id, date)` |
| `portfolio_orders` | N/A | own, via portfolio; `pending`/`filled`/`cancelled`, `order_type` `market`/`limit`, `updated_at` trigger |
| `stock_quotes_daily` | grows | public read; one real close per stock per session |
| `stock_metrics` | 80 | public read; the fundamentals workbook |
| `user_roles` | N/A | read own (admins read all); written only through `admin_set_role` |
| `news_posts` | N/A | **read** for `authenticated`; **no write grant at all**, see §9f |

Nice touches: the `handle_new_user()` trigger is `SECURITY DEFINER` with a pinned `search_path`, and migration #2 exists solely to `REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated` on it, that's a deliberate hardening pass.

`supabase/setup.sql` is the whole schema in one re-runnable file, generated by `scripts/build-setup-sql.py`. **Never edit it by hand: add a migration and regenerate.**

**Orphaned schema (v1 leftovers, safe to drop):**
- `portfolio_positions` table: the original "% weighting" model, fully replaced by `portfolio_holdings`. Nothing reads it.
- `portfolios.capital` column: replaced by `cash`. Nothing reads it.

---

## 8. Feature notes

### Portefeuille (`portefeuille.tsx`: the biggest file)

The most complex module. Starts every user at **100 000 MAD**, auto-creating a portfolio row on first visit.

**Orders can be entered around the clock; they only execute during the session.** The session is the real one: Monday to Friday, 09:30–15:30 Casablanca time, public holidays excluded, computed by `lib/market-session.ts` and read through the `useSessionStatus()` hook (`hooks/useMarketSession.ts`, re-evaluated every 30 s).

- **Market orders, session open:** execute immediately at the live price, as before.
- **Market orders, session closed:** persist to `portfolio_orders` with `order_type = 'market'` and `limit_price = NULL`, and go out at the next open, oldest first.
- **Limit orders** persist the same way with `order_type = 'limit'`, and fill when `price ≤ limit` (buy) or `price ≥ limit` (sell), at the *current* price rather than the limit: a realistic favourable fill. They too are frozen outside the session, so a Saturday order can no longer fill on Friday's close.
- The execution loop **runs only while `marketOpen`**, one order per pass (see §10), and the badge above the order form says which of the two is happening: green *Séance ouverte*, amber *Marché fermé, ordre mis en attente*.
- **A sale that realises a gain is taxed 15 %**, Morocco's rate on disposals of listed securities. The maths is `lib/tax.ts`: the tax falls on the gain alone, never on the sale amount, and a loss is neither taxed nor credited. It is withheld at the moment of sale, so `portfolios.cash` receives the NET proceeds; the trade row still records the gross price, because `portfolio_trades` has no tax column and the portfolio's value is derived from cash and holdings, not from the trade log. The order form previews the tax before you sell, the confirmation restates it, and the bottom of the page explains it.
- All `portfolio_orders` access is isolated in **`lib/orders.ts`** (`listPendingOrders`, `placeOrder`, `markOrderFilled`, `cancelOrder`, `fillsAt`), because the generated Supabase types do not know `order_type` yet.
- `applyTrade()` does the whole thing client-side: recompute weighted average cost, upsert the holding, adjust `portfolios.cash`, insert a `portfolio_trades` row.
- **Performance vs MASI** is rebased to 100 from the first snapshot that carries a MASI value.
- **Reset** wipes holdings, trades, snapshots, and orders, and restores cash to 100 000.

P&L baseline is the hardcoded `START_CAPITAL` constant, not the portfolio's actual initial funding: correct only because reset always restores exactly 100 000.

### Académie

6 lessons, 2 per level (Débutant / Intermédiaire / Avancé). `buildLevelProgress()` in `lib/market.ts` implements **strict sequential gating**: a level unlocks only when *every* module of the previous level is complete. The lock is enforced both on the index grid and inside the lesson route.

> **The quizzes are effectively all-or-nothing.** `PASS_SCORE = 80`, but the seeded quizzes have only **2 or 3 questions** (14 total across all 6 lessons). At 3 questions, 2/3 = 67% → fail. At 2 questions, 1/2 = 50% → fail. So every module requires a **perfect score**, and one wrong answer blocks an entire level. This is almost certainly not intended: either lower `PASS_SCORE` or (better) write more questions.

Related copy bugs:
- `academie.index.tsx` meta description advertises **"15 modules"**: there are 6.
- `academie.$slug.tsx` meta advertises a **"quiz de 10 questions"**, they're 2–3.
- Lesson bodies strip `**` markers rather than rendering bold (`content.split("\n\n")` + `.replace(/\*\*/g, "")`), so the seeded Markdown emphasis is discarded.

### Budget

Self-contained, no backend. Monthly-compounded loop over 1–40 years at 3.5% / 6.5% / 9.5%, charting compounded growth against flat savings. Correctly framed as pedagogical hypotheses, with the `<Disclaimer />` component displayed. Nothing to watch out for here.

### TradingView integration

`TradingViewWidget` injects the official embed script per mount and fully tears down on unmount (guards against HMR/navigation duplicates). `LazyTradingView` wraps each `/bourse` card in an IntersectionObserver (200px margin) so 24 iframes don't mount at once. The ticker tape in `__root.tsx` renders on **every** page, including the landing page.

---

## 9. Design system

All tokens are in `src/styles.css` as **OKLCH** CSS variables under Tailwind v4's `@theme inline`. There is no `tailwind.config.js`.

- Near-black background `oklch(0.16 0 0)`, off-white text, gold primary `oklch(0.82 0.15 88)`
- `--gradient-gold` drives every CTA and headline number
- Inter, loaded from Google Fonts in the root `head()`
- Dark-only: there is no light theme, and `--radius: 1rem` gives the rounded-2xl look

The palette has never changed. What was added on top of it, to stop pages reading as flat rectangles on black:

| Utility | What it does |
|---|---|
| `surface-raised` | card with a top-lit gradient instead of a flat fill; replaced `surface-card` everywhere |
| `card-hover` | lift plus a gold-tinted border and shadow, self-contained (no `hover:` variant needed at the call site) |
| `aurora` | diffuse gold radial glow behind page headers |
| `grid-lines` | faint masked grid, gives the background texture without drawing the eye |
| `eyebrow` | uppercase tracked gold section label |
| `hairline` | thin gold-to-transparent rule |
| `rise`, `sheen` | entrance animation and a slow gradient drift on the hero headline |

Every animation is disabled under `prefers-reduced-motion`.

Formatting helpers live in `lib/format.ts`. They are **locale-aware**: components call `useFormat()`, which binds the current language (`1 234,50 MAD` in French, `MAD 1,234.50` in English). The bare functions are still exported for the rare call outside a component and default to French.

Two decisions worth knowing:

- **Numbers use a different locale from dates.** ICU groups thousands with a full stop in `fr-MA`, so 123 457 renders `123.457`. That is the Moroccan convention, but in a column of amounts with no decimals it reads as "123 point 457", off by a factor of a thousand. `NUMBER_LOCALE` maps French numbers to `fr-FR`, which groups with a narrow no-break space and keeps the decimal comma. Dates still use `fr-MA`.
- **Nothing non-finite reaches the screen.** `Intl.NumberFormat.format(NaN)` returns the string `"NaN"`, so a field that is missing (a schema newer than the deployed client, a null from a join) would print `NaN MAD` in a table of amounts. Every helper returns `EMPTY` (`N/A`) instead for `null`, `undefined`, `NaN` and `Infinity`.

---

## 9b. Bilingual French / English

The whole interface switches language from a control in the header, on the landing page, the auth pages and inside the app. The choice is stored in `localStorage` under `lyamfi.lang` and applied to `<html lang>`.

| File | Role |
|---|---|
| `lib/locales/fr.ts` | **source of truth.** `as const`, so its keys define the dictionary type |
| `lib/locales/en.ts` | typed as `Record<keyof typeof fr, string>`, so a missing key is a compile error, never a raw key on screen |
| `lib/i18n.ts` | context, `useI18n()`, `useT()`, `usePageTitle()`, `{token}` interpolation |
| `components/LanguageProvider.tsx` | the provider component, kept apart so Vite fast refresh can track it |
| `components/LanguageSwitcher.tsx` | the FR / EN toggle |
| `lib/levels.ts` | maps the French level names stored in `lessons.level` to translation keys |

Two deliberate limits:

- **Page `<title>` and meta tags declared in `head()` stay French.** Route heads are evaluated outside React and cannot follow state. SEO keeps the French version (the audience is francophone); the tab title follows the language at runtime through `usePageTitle()`, called by each page component.
- **Lesson content is French only.** The 14 modules and their 140 quiz questions live in the database, seeded from the course PDF. Translating them is a content project, not a code change: it needs a `lessons` schema that carries both languages plus a full translation pass on ~130 KB of prose.

Adding a string: put it in `fr.ts`, then in `en.ts`. TypeScript will not compile until both exist.

---

## 9c. Two tiers of administrator

Requested so customer support can be delegated without handing over the keys.

| | Principal (`lyamcorpo@gmail.com`) | Secondary admin |
|---|---|---|
| See accounts and their activity | ✅ | ✅ |
| Grant or revoke admin | ✅ | ❌ |
| Rename an account | ✅ | ❌ |
| Reset a password | ✅ | ❌ |
| Delete an account | ✅ | ❌ |

The split is enforced in the database, not the interface: every sensitive RPC opens with `is_principal_admin()`, which resolves the caller's e-mail from `auth.users`. Hiding the buttons is cosmetic.

Protections that cannot be clicked away: the principal account cannot be deleted (by itself or anyone else) and cannot be demoted, so the admin console can never become permanently unreachable.

### On reading passwords

The brief asked for the principal admin to be able to see every account's password. **That is not possible, and not because of a missing feature.** `auth.users.encrypted_password` holds a bcrypt digest: a one-way function. The password a user typed is stored nowhere, so no query, no API and no amount of privilege can return it. That property is exactly what protects the accounts if the database ever leaks.

What ships instead is the operation that actually solves "I can't log in": `admin_set_user_password` sets a **new** password, shows it once to the principal admin (with a generator and a copy button), and deletes that account's open sessions so a device already signed in loses access. The panel explains this in the interface rather than leaving it as a silent omission.

---

## 9d. Stock detail pages and price history

The market cards used to embed a TradingView `mini-symbol-overview` widget. That widget is an iframe, so any click on it left the site for tradingview.com. It is gone, along with the `market-quotes` table that sat at the bottom of `/bourse` for the same reason. The only TradingView embed left anywhere is the ticker tape in `__root.tsx`; remove it the same way if the outbound click bothers you there too.

What replaced them:

- **Every one of the 81 listed stocks now has an internal page.** `/bourse/$ticker` is keyed on the CSE code (post-alias, e.g. `DIS` resolves to `DWY`), not on `stocks.ticker`, so coverage is no longer limited to the 20 rows in the `stocks` table.
- **The chart is the TradingView `advanced-chart` widget**, embedded in the detail page. It was briefly a Lightweight Charts canvas fed by a series reconstructed from the screener's performance windows; seven points across a year is a real chart but a thin one, and the widget gives full history plus TradingView's own tooling. The original complaint was about the **list**, where clicking a stock left the site instead of opening a page, and that stays fixed: cards link here.
- **Cards carry a local SVG sparkline** (`components/Sparkline.tsx`) fed by one bulk query, not 81.

### Where the chart data comes from

The detail page chart is TradingView's own widget, so it brings its own data.

The **sparklines on the list** are local SVG, fed by `lib/history.functions.ts`. TradingView publishes no plain-HTTP endpoint for daily bars, but its screener exposes each stock's performance over fixed windows, so the past price follows from the latest close:

```
price(t) = close / (1 + perf(t) / 100)
```

One request covers all 81 stocks. `buildHistory()` is exported apart from the fetch so the reconstruction is unit-testable without network.

`stock_quotes_daily` records the real close of every stock once per session and backs the sparklines when TradingView cannot be reached. `stock_prices`, the legacy table, is synthetic (a sine wave over `md5(ticker)`) and is charted nowhere.

### What the market cards show

Since 2026-08-27 the `/bourse` cards carry **only the valuation ratios**: market cap, PER 26, PER 27e, D/Y 26, D/Y 27e. BPA 26 / 27e and DPA 26 / 27e were dropped from the list. Nothing was deleted: `detailGroups()` still builds the full dashboard on `/bourse/$ticker`, and the workbook is untouched. Only `summaryMetrics()` changed, and the card spacing was rebalanced for five rows instead of nine.

Two sorts were added next to the existing ones, sharing the same chip row: **PER 26 ascending** (a negative or zero PER is not a cheap stock but a loss-making one, so it goes to the end of the list with the uncomputable ones) and **D/Y 26 descending**. Both read `per26()` and `dy26()`, exported from `lib/metrics.ts` so the sort gets numbers rather than formatted labels.

### Fundamentals

`stock_metrics` holds the Lyamfi fundamentals workbook, 80 stocks, seeded by `scripts/build-stock-metrics.py` from the xlsx. Regenerate rather than editing the migration by hand. The parser handles what the workbook actually contains: thousands separated by non-breaking spaces (`1 000 000`), and two different blank markers, `_` and `—`.

The table stores **only what does not depend on the price**: share count, EPS 26 / 27e, DPS 26 / 27e, book value, sales and free cash flow per share, and the closed-year profitability ratios. Everything price-derived is computed at render time in `lib/metrics.ts`, because storing it would be stale by the next session:

| Derived live | Formula |
|---|---|
| Market cap | `shares × price` |
| P/E 26, P/E 27e | `price ÷ EPS` |
| Dividend yield 26, 27e | `DPS ÷ price × 100` |
| P/B, P/S, P/FCF 25 | `price ÷ book value, sales per share, FCF per share` |

The ratio columns are stored as fractions, so `0.163` renders as `16,3 %`.

**A missing indicator is not rendered at all.** No `N/A`, no `0`, no empty card: an absent card reads as "not published", a zero would read as a measurement. `lib/metrics.ts` only ever constructs indicators it could compute, so the components have nothing to filter. Three things count as uncomputable: a missing input, a zero denominator, and a **non-positive price** — that last one matters, because a stock with no quote for the day arrives as `0` and `0 ÷ EPS` is a perfectly finite `0` that would render as `0,0x`.

A group with no computable indicator is dropped too, so the detail page never shows an orphan heading. Diac Salaf, which the workbook has no figures for, shows only its market cap (the share count is known) and is not counted among stocks with fundamentals.

---

## 9e. Leaderboard

`/classement`, sitting between Portefeuille and Académie in the nav.

Ranked by portfolio value, highest first, broken down into cash and invested, with the return against the 100 000 MAD starting capital beside it. Cash plus invested always equals the value, so the row adds up on screen. Gold for the top three, and `components/GoldenGoat.tsx` puts the golden goat next to number one.

The whole thing is one `SECURITY DEFINER` RPC, `leaderboard()`, because RLS correctly forbids reading someone else's portfolio. It returns only what a leaderboard needs: name, cash, invested, value, return, and a server-computed `is_self` flag. **No e-mail, no user id, no individual holdings, no order count.**

The database cannot value positions (it has no live prices, those come from TradingView in the browser), so the only valued figure it holds is `portfolio_snapshots.value`, which is already cash plus positions at snapshot time. Invested is therefore derived as `value - cash`. That holds while the two are from the same moment, which the Portfolio page keeps true by rewriting the day's snapshot whenever the total moves, so immediately after a trade. If the snapshot is nonetheless stale enough to sit below current cash, invested falls back to cost basis rather than to zero, which would erase the holdings of anyone in that window. Two rules are enforced in SQL, not in the interface:

- the principal admin is excluded (they run the platform, they don't compete)
- everyone else is listed, including accounts that have never bought anything: they show at the starting capital. The query therefore starts from `auth.users` and left-joins the portfolio, because a member who has never opened the Portfolio page has no `portfolios` row at all.

Value comes from the most recent `portfolio_snapshots` row, which already carries the valued total. With no snapshot it falls back to cash plus cost basis, i.e. a return that ignores unrealised P/L. Snapshots are written client-side on visit (see 🟠 below), so a player who never returns has a stale ranking.

**`public/golden-goat.png` is not in the repo.** The image was pasted into a chat rather than uploaded as a file, so it has to be committed by hand. `GoldenGoat.tsx` hides itself on a load error, so the leaderboard is correct without it, just goatless.

---

## 9f. Actualités

`/actualites`, between Académie and Simulateurs in the nav. Rebuilt on 2026-08-29 as a press feed rather than a card wall:

- **`/actualites`** is a search box over article titles (filtered as you type, no round trip) and a vertical list of **horizontal** cards: thumbnail left, text right, stacked on mobile. Each card shows the title, the date in full (*Vendredi 28 août 2026*) and a three-line excerpt clamped by CSS. The whole card links through; the admin buttons sit outside the anchor, because a button inside a link is invalid markup and would open the article on its way to deleting it.
- **`/actualites/$id`** is the reading page: back link, date, large title, illustration, then the body in a `max-w-4xl` column.
- **`components/ArticleBody.tsx`** renders a small Markdown subset (`##` headings, `-` and `1.` lists, `---` rules, `**bold**`) into React elements. Never `dangerouslySetInnerHTML`: articles are written by admins, but a compromised admin account must not be able to run script in every member's browser. `lib/excerpt.ts` strips the same markup for the feed, where a stray `##` would read as a typo.
- The admin form carries Image, **Date**, Titre and Corps. The date is optional in the database: absent, a new article is stamped now and an edited one keeps the date it had.

**The split of rights lives in the database, not the interface.** `authenticated` holds `SELECT` on `news_posts` and nothing else, because the migration does `REVOKE ALL … FROM authenticated, anon` and *then* grants back the single privilege it wants. Enumerating what to remove is not enough: a Supabase project carries `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated`, so the table is born with everything granted, and naming `INSERT, UPDATE, DELETE` leaves `TRUNCATE`, `REFERENCES` and `TRIGGER` behind (this is exactly what shipped first and had to be corrected). Publishing, editing and deleting go through `news_create`, `news_update` and `news_delete`, three `SECURITY DEFINER` functions that each open with `is_admin()`. Hiding the buttons is cosmetic, exactly as for the admin console. Both admin tiers may write: publishing an article is editorial work, not a privileged operation on an account.

The database also does the validation, so it cannot be bypassed from a console: title and body are trimmed and refused when empty (200 and 20 000 characters max), and an image URL is either empty (stored `NULL`) or starts with `http://` or `https://`.

Illustrations can be pasted as a URL **or** uploaded. Uploads go to a public Storage bucket named `news`, created by the same migration, with write reserved to admins by four `storage.objects` policies. That whole block is wrapped in an exception handler: `storage.objects` belongs to `supabase_storage_admin`, and the SQL editor runs the file as one transaction, so a privilege refusal there would otherwise roll back every migration. If the bucket is missing, uploading shows a specific message and pasting a URL still works.

Client code: `lib/news.ts` (queries, RPC wrappers, upload) and `routes/_authenticated/actualites.tsx` (feed, editor, per-card edit/delete with a self-disarming confirm).

---

## 9g. Simulateurs (`/simulateurs`, ex-`/budget`)

Two calculators on one page. The compound-interest projection is unchanged, only retitled *Investissement et intérêts composés*.

The **credit simulator** below it exists to make one point: the rate a bank advertises is not what the loan costs. `lib/credit.ts` runs a constant-annuity amortisation and, from the payments actually leaving the account (instalment **plus** monthly fees), solves for the APR by bisection rather than Newton, because bisection cannot diverge on an absurd input someone types out of curiosity. The APR is the effective annual rate, `(1 + monthly)¹² − 1`, so a 0.5 % monthly rate reads 6.17 % and not 6 %.

Fees default to **300 MAD a month**, the going Moroccan average for insurance and arrangement fees, and are editable. A donut splits the total outlay into capital (gold, the only part that is not a cost), interest and fees.

The maths is checked against a hand-computed reference (100 000 MAD over 10 years at 6 % → 1 110,21 MAD a month) and, more usefully, by a round trip: discounting the real outflows at the APR the code returns lands back on the principal to within a dirham.

---

## 9h. Macroéconomie (`/macroeconomie`)

Five indicators on the Moroccan economy, reached from the gold banner at the top of `/actualites`, deliberately not from the nav: it is context for the news, not a sixth destination.

**It does not use TradingView widgets, and cannot.** The page shipped with five `advanced-chart` embeds on `ECONOMICS:MA…` symbols, exactly as specified. Every one of them refused to render: *« Symbole disponible uniquement sur TradingView »*. Economic series are not among what the free embeddable widgets are licensed to serve, so no amount of configuration would have fixed it.

What replaced them: the **World Bank's open API** (`api.worldbank.org`, no key, no quota), charted with Recharts like everything else on the site. Same trade as §9d, where the market cards dropped their TradingView embeds for local sparklines.

- The trade-off is granularity: the World Bank publishes annually, TradingView monthly or quarterly. Each card therefore keeps a link to its TradingView page for the finer series.
- **The policy rate is hand-maintained, and says so on the card.** The World Bank publishes no Moroccan policy rate: `FR.INR.RINR` (the real rate, a different quantity anyway) comes back empty for Morocco, and Bank Al-Maghrib exposes no API. So `POLICY_RATE` in `lib/macro.functions.ts` is a dated table of the Board's decisions. That is the right model rather than a fallback: a policy rate is not a measured series but a step function that moves at most four times a year, so twelve lines cover fifteen years and maintenance is one line per decision. **After each Board decision, append a line and move `POLICY_RATE_CHECKED`** — that date is printed on the card, so a reader can see how far the series is kept instead of trusting a stale figure. The chart uses `stepAfter` for this series, because a policy rate holds and then jumps.
- `parseWorldBank()` is exported apart from the fetch, as `buildHistory()` is in §9d, so the shape handling is checked without network. The trap it exists to avoid: `Number(null)` is `0`, so filtering after conversion would chart an unpublished year as zero inflation. It filters on the raw value.
- A series that fails to load leaves its card with the explanation and the link rather than an empty frame.

**Unverified:** `api.worldbank.org` is blocked by the same egress policy that blocks TradingView from the audit environment, so the live response was never seen. The parser is tested against the documented shape; the request itself is not.

---

## 10. Known issues, ranked

### 🔴 Trading integrity is entirely client-side
Every trade rule (sufficient cash, sufficient shares, average-cost math), is enforced in the browser in `applyTrade()`. RLS grants the signed-in user full write access to their own `portfolios.cash`, `portfolio_holdings`, and `portfolio_trades`, so a single API call can set cash to any number or mint holdings from nothing.

For a solo learning sandbox this is acceptable. It blocks **any** competitive feature (leaderboards, cohort challenges, shared classrooms), and should be fixed before one ships. The fix is a `SECURITY DEFINER` Postgres function that validates and executes a trade atomically, with direct writes revoked.

### 🔴 Cash update is a non-atomic read-modify-write
`applyTrade` writes `cash: pf.cash - amount`, where `pf.cash` comes from the React Query cache. Two trades in quick succession, or a stale cache, silently clobber the balance. The same server-side RPC solves this.

### 🟠 Pending orders only fill while the tab is open
The fill loop is a `useEffect` on the portfolio page: no open tab, no execution. That now covers market orders queued out of session as well as limit orders, so a player who queues an order on Sunday night and never opens the page on Monday stays unfilled. It also fills **at most one order per pass**, deliberately: `applyTrade()` reads cash from the React Query cache, so chaining two fills on the same cached balance would clobber it. The invalidation restarts the pass on fresh data, and the book drains one order at a time. A scheduled server job (Supabase cron + the trade RPC above) is the real fix for both halves.

### 🟠 The trading session is the browser's clock
`isMarketOpen` is computed client-side from `Intl.DateTimeFormat` in the `Africa/Casablanca` zone. A user whose device clock is wrong, or who changes it, can make the app believe the session is open. Given trading is already client-side (see the 🔴 items), this adds no new exposure, but it moves server-side with them. Until then, the code fails **closed**: before the clock is read (SSR, first render) the session counts as shut, because queuing an order can be undone and executing one wrongly cannot.

### 🟠 Every table but `news_posts` grants TRUNCATE, REFERENCES and TRIGGER to `anon` and `authenticated`
A Supabase project sets `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated`, so every table created by a migration starts with all privileges granted, and the explicit `GRANT SELECT` / `GRANT ... TO authenticated` lines in the migrations only *add* to that. **RLS does not cover the leftovers**: it filters the rows a statement reads and writes, and has no say over `TRUNCATE`, which empties the table outright.

Not reachable through the app as it stands: PostgREST exposes no verb that issues `TRUNCATE`, `CREATE TRIGGER` or `ALTER TABLE`, so the publishable key cannot get at any of it over HTTP. It needs a direct Postgres connection, which needs the database password. So this is a privilege model that says something other than what it means, not an open door.

`news_posts` is the only table done right (`REVOKE ALL` then grant back). Fixing the other fifteen is one migration: `REVOKE ALL ON <table> FROM anon, authenticated;` followed by the grants each already documents. Worth doing next time the schema is touched.

### 🟠 Auto-login trusts a localStorage probe to decide what to paint
`components/SessionRedirect.tsx` reads whether a `sb-*-auth-token` key exists to choose between the splash and the public page, *before* `getSession()` has answered. That key name is supabase-js's convention, not a documented API. If it ever changes, nothing breaks: the probe returns false, the public page renders, and the redirect simply happens a beat later without the splash. The redirect itself always waits for `getSession()`, so an expired token never gets anyone in.

### 🟠 The MASI 20 symbol is not documented
TradingView publishes no stable code for the MASI 20. `lib/quotes.functions.ts` therefore *discovers* it: it first asks the scanner for everything typed `index` on CSEMA, then falls back to a candidate list (`MASI20`, `MSI20`, `MASI_20`), and normalises whatever comes back to the internal code `MASI20`. If none of it resolves, the dashboard card renders with *Indice indisponible* rather than disappearing, and the TradingView link still works. **This could not be verified from the audit environment: `scanner.tradingview.com` answers 403 to CONNECT there.** Check the card on the live site; if it is empty, the right code goes in `INDEX_CANDIDATES`.

### 🟠 The performance curve only advances when someone visits
Snapshots are written client-side on page view, so the vs-MASI chart has gaps for every day the user didn't log in. The chart also needs ≥2 snapshots before it renders anything: a new user sees only explanatory text on day one.

Minor related bug: the snapshot date uses `new Date().toISOString().slice(0,10)` (**UTC**), while the column default is Casablanca time. Between 23:00 and midnight local, a snapshot lands on the wrong day.

### 🟠 `record_daily_quotes` trusts the client
The daily close is posted by the browser, like every trade. The RPC never overwrites a (ticker, day) it already holds, so the exposure is bounded to whoever loads a page first each morning, but that person could still write a fake close. Same threat model as the two 🔴 items above, and the same fix: move the write server-side once trading moves server-side.

### 🟠 Daily closes are now overwritten, not written once
`record_daily_quotes` used to refuse a (ticker, day) it already held, which froze the leaderboard on the first quote of the morning. It now updates today's row on every call, and leaves past days alone. That is what makes the leaderboard follow the market, and it widens the client-trust window from once a morning to any time: same threat model as the 🔴 items, same fix, whenever writes move server-side.

### 🟡 `stock_prices` is synthetic and now unused by the UI
A sine wave over `md5(ticker)`, seeded by the initial migration. Nothing charts it any more (see §9d). Left in place because dropping a table is not worth the migration churn, but do not mistake it for market data.

### 🟡 Dead code
- `components/LazyTradingView.tsx`: no longer imported since the market cards dropped their embed.
- `lib/market.ts` `stocksQuery` is no longer read by the dashboard (only `/bourse` uses it).
- `integrations/supabase/auth-middleware.ts`: generated, never imported.
- `integrations/supabase/client.server.ts`: the service-role admin client; no server-side admin code exists, so it's unused (and its env var is absent).
- `cseName` and `CSE_TICKERS` exports in `cse-symbols.ts`.

### 🟡 Bundle weight
~1.4 MB client payload; the Recharts chunk alone is ~360 KB. Recharts is used on three routes. Worth code-splitting or swapping for something lighter if mobile performance on Moroccan networks matters, which, for this audience, it probably does.

### 🟢 Minor
- The Moroccan holiday table in `lib/market-session.ts` ends in **2027** and will need extending.
- `dashboard.tsx` calls `useAuth()` (a second session subscription) even though `_authenticated`'s `beforeLoad` already put `user` in the route context.
- Dashboard gainers/losers exclude flat stocks (`changePct !== 0`) and, if fewer than 5 movers exist in a direction, the lists bleed into the opposite sign.
- No `sitemap.xml`, though `robots.txt` explicitly welcomes Googlebot, Bingbot, Twitterbot and facebookexternalhit.
- `og:image` is never set despite `twitter:card: summary_large_image`, so social shares render without a preview image.

---

## 11. Where to pick up

Roughly in order of value-per-effort:

0. **Check the MASI 20 card on the live site** (see §10). One minute of work, and it is the only part of the 2026-08-27 batch that could not be verified from here.
1. **Move trading to a `SECURITY DEFINER` RPC.** The two 🔴 issues below are the same fix and the only ones that block a competitive feature. Now that the session gates execution, that RPC should also own the clock, so the server decides what "open" means rather than the browser.
2. **Translate the lesson content**, if English learners matter. Needs a schema change on `lessons`; see §9b. The `news_posts` rows are French-only for the same reason.
3. **Extend the Moroccan holiday table** in `lib/market-session.ts` past 2027. It now gates order execution, not just a badge, so a missing holiday means orders filling on a closed day.
4. **Self-host the logo.** Required before any non-Lovable deployment.
5. **Run `npm run format`** and get lint to zero, so it's a usable signal again.
6. **Backfill the `stocks` table** for the other 61 listings: the single biggest content gap.
7. **Move trading to a Postgres RPC**, closing both the integrity hole and the cash race, and unlocking leaderboards.
8. **Server-side order execution** via scheduled job: the queue now holds market orders as well, so a player who never reopens the page never gets filled.
9. **Add a test suite**: `applyTrade`, `buildLevelProgress`, and the compound-interest loop are pure, well-isolated logic and would be cheap to cover.
10. **Fix the stale detail page**: recompute PER/BPA/yield from live prices as the list page already does, so the two views agree.

### Things that will bite you

- Never edit `src/routeTree.gen.ts`.
- Never add Vite plugins already provided by `@lovable.dev/vite-tanstack-config`.
- Never force-push, rebase, amend or squash pushed commits (`AGENTS.md`).
- `bun install` will fail: use `npm install` (§3).
- Anything imported by a route or a `*.functions.ts` file **ships to the client bundle**; server-only code must live in `*.server.ts` and be imported inside a handler.
- `src/integrations/supabase/types.ts` is regenerated from the database and knows nothing about tables or columns added by migration. Do not edit it: isolate the cast in a `lib/*.ts` module, as `metrics.ts`, `quotes.history.ts`, `news.ts` and `orders.ts` all do.
- Never edit `supabase/setup.sql` by hand: add a migration and run `python3 scripts/build-setup-sql.py`.
- A key added to `lib/locales/fr.ts` must be added to `en.ts` too, or the build fails. That is deliberate.

### Unverified

The live TradingView endpoint (`scanner.tradingview.com/morocco/scan`) could not be reached from the environment I audited in (outbound access to it was blocked by network policy (403 on CONNECT), not by anything in the app. The calling code in `lib/quotes.functions.ts` is sound, and it's an undocumented public endpoint with no API key, so **treat it as a dependency that can change or rate-limit without notice**), it is the single point of failure for every price in the product. There is currently no fallback if it fails: prices render as `, `.

---

## 12. What to run in the Supabase SQL editor

### 2026-08-29 (current)

One migration, `supabase/migrations/20260829090000_live_quotes_and_news_date.sql`. It replaces three functions and creates nothing:

- `record_daily_quotes` now **updates** today's row instead of refusing it. Past days are untouched. This is the fix for "the leaderboard never refreshes": it valued holdings at whatever price was first recorded that morning.
- `news_create` and `news_update` take an optional `p_published_at`, for the Date field in the admin form. The old three- and four-argument signatures are dropped explicitly, because adding a parameter to `CREATE OR REPLACE FUNCTION` would create an overload and leave PostgREST with two candidates.

Paste that file, or the whole of `supabase/setup.sql`, which folds every migration in. Both are re-runnable.

Checked before shipping: applied to a throwaway PostgreSQL 16 holding the schema as it stood on 2026-08-27 (with Supabase's default privileges in place), twice, then exercised — a quote updated mid-session moved a leaderboard row from 11 500 to 13 000 MAD, yesterday's close stayed put, an unchanged quote counted as no write, and a dated article kept its date through an edit that did not supply one.

### 2026-08-27

`20260827090000_news.sql` (the `news_posts` table, the admin RPCs, the `news` bucket) and `20260827091000_session_orders.sql` (`order_type`, nullable `limit_price`). Already applied.

### Checking any of it landed

```sql
select 1 as n, 'table des actualités' as verification,
       (select count(*)::text from information_schema.tables
         where table_schema = 'public' and table_name = 'news_posts') as resultat,
       '1' as attendu
union all
select 2, 'droits des membres sur les actualités',
       (select coalesce(string_agg(privilege_type, ','), 'aucun')
          from information_schema.role_table_grants
         where table_name = 'news_posts' and grantee = 'authenticated'), 'SELECT'
union all
select 3, 'colonne order_type',
       (select count(*)::text from information_schema.columns
         where table_name = 'portfolio_orders' and column_name = 'order_type'), '1'
union all
select 4, 'bucket news public',
       coalesce((select public::text from storage.buckets where id = 'news'), 'ABSENT'), 'true'
union all
select 5, 'news_create accepte une date',
       (select count(*)::text from information_schema.parameters
         where specific_schema = 'public' and parameter_name = 'p_published_at'), '2'
order by n;
```

Row 4 is the one that can legitimately differ: the bucket creation is wrapped in an exception handler so a privilege refusal cannot roll back the rest. If it says `ABSENT`, create it by hand (Storage → New bucket, name `news`, Public on) and replay the `DO $storage$ … $storage$;` block at the end of the news migration. Pasting image URLs works either way.

---

## 13. Supabase dashboard settings that are not in the repo

Two things live only in the Supabase console, and both have bitten this project:

- **Site URL and redirect URLs** (Authentication → URL Configuration). Site URL defaults to `http://localhost:3000`. Supabase refuses to redirect anywhere that is not allow-listed and falls back to Site URL, so a confirmation e-mail sent from production lands on localhost. The app already asks for the right targets (`${origin}/dashboard` and `${origin}/reset-password`, from `routes/auth.tsx`); what is missing is the allow-list. Set Site URL to `https://lyamfi.com` and Redirect URLs to `https://lyamfi.com/**`. See `AUTH-SETUP.md` §2.
- **The `news` Storage bucket**, if the migration could not create it. See §12.
