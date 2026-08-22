# Lyamfi: Codebase Handoff

_Written 2026-08-18 against commit `3108fb0`. Everything below was read from the source and, where marked ✅, executed._

---

## 1. What Lyamfi is

A French-language financial-education platform for the **Bourse de Casablanca (BVC)**: Morocco's stock exchange. It teaches retail investors to read the market before risking money in it. Dark-mode, mobile-first, gold-on-black.

**Live:** https://lyamfi.lovable.app

Five surfaces:

| Surface | Route | What it does |
|---|---|---|
| Landing | `/` | Value prop, 4 module teasers, sign-up CTA |
| Dashboard | `/dashboard` | Portfolio value, day's top 5 gainers/losers, learning progress, MASI |
| Bourse | `/bourse`, `/bourse/$ticker` | 81 listed companies, live prices, charts, fundamentals |
| Portefeuille | `/portefeuille` | Paper-trading with 100 000 MAD, market + limit orders, vs-MASI curve |
| Académie | `/academie`, `/academie/$slug` | 6 lessons in 3 gated levels, quiz + badge per lesson |
| Budget | `/budget` | Compound-interest projection, 3 risk profiles |

**Origin:** built with [Lovable](https://lovable.dev). 93 commits, 2026-07-31 → 2026-08-18. The repo syncs bidirectionally with the Lovable editor: see `AGENTS.md`: **never force-push, rebase, amend, or squash already-pushed commits**, it corrupts project history on Lovable's side.

> ⚠️ **`README.md` is not documentation.** It is the original Lovable *prompt*: the product spec that generated the app. Read it for design intent, not for how anything works. Some of it was never built (sector-concentration scoring, diversification score, allocation pie chart) and some of it was superseded (the portfolio became a real paper-trading engine rather than the "% weighting" simulator described).

---

## 2. Verified status ✅

I ran these in a clean checkout:

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ **Clean.** Zero type errors, under a genuinely strict config (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`). |
| `npm run build` | ✅ **Succeeds** in ~1s. Emits a Cloudflare Workers bundle (`.output/`, auto-generated `wrangler.json`, `nodejs_compat`). |
| `npm run lint` | ❌ **590 problems**: but **584 are Prettier formatting** and auto-fixable, and the other 6 are benign `react-refresh` warnings inside vendored shadcn/ui files. **Zero real code-quality errors.** `npm run format` clears it. |
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
| 3 | **`stock_fundamentals`** table | 37 rows | Analyst consensus, `as_of 2026-05-25` | BPA/DPA on `/bourse` cards; PER and yield are *recomputed* from these against the live price. |
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
| `portfolio_orders` | N/A | own, via portfolio; `pending`/`filled`/`cancelled`, `updated_at` trigger |

Nice touches: the `handle_new_user()` trigger is `SECURITY DEFINER` with a pinned `search_path`, and migration #2 exists solely to `REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated` on it, that's a deliberate hardening pass.

**Orphaned schema (v1 leftovers, safe to drop):**
- `portfolio_positions` table: the original "% weighting" model, fully replaced by `portfolio_holdings`. Nothing reads it.
- `portfolios.capital` column: replaced by `cash`. Nothing reads it.

---

## 8. Feature notes

### Portefeuille (`portefeuille.tsx`, 855 lines: the biggest file)

The most complex module. Starts every user at **100 000 MAD**, auto-creating a portfolio row on first visit.

- **Market orders** execute immediately at the live price.
- **Limit orders** persist to `portfolio_orders` and fill when `price ≤ limit` (buy) or `price ≥ limit` (sell), at the *current* price rather than the limit: a realistic favourable fill.
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

Formatting helpers live in `lib/format.ts`. They are **locale-aware**: components call `useFormat()`, which binds the current language (`fr-MA` gives `1 234,50 MAD`, `en-GB` gives `MAD 1,234.50`). The bare functions are still exported for the rare call outside a component and default to French. Absent values render as `N/A`, not a dash.

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
- **The chart is drawn in-page** by `components/PriceChart.tsx`, using TradingView **Lightweight Charts** (v5, `chart.addSeries(AreaSeries, …)`). It is a rendering library, not a widget: it loads nothing external and navigates nowhere. Gold line `#FCD116`, area fill, magnet crosshair, a legend overlay that follows the cursor, and a `ResizeObserver` so it tracks its container rather than the window.
- **Cards carry a local SVG sparkline** (`components/Sparkline.tsx`) fed by one bulk query, not 81.

### Where the chart data comes from

`stock_prices`, the table the old detail page charted, is **synthetic**. The initial migration fills it with a sine wave over `md5(ticker)`:

```sql
ROUND((s.price * (1 - (g::numeric/1400) + (sin(g::numeric/6 + <md5 hash>) * 0.035)))::numeric, 2)
FROM public.stocks s, generate_series(0, 364) g
```

Fine as a demo fixture, not something to draw in a premium-looking price chart and call a cours. So the new page does not use it.

Instead, `stock_quotes_daily` records the **real** closing price of every stock, once per session, from the live quotes the app already fetches. `useRecordDailyQuotes()` fires on the dashboard and on `/bourse`; the RPC ignores a (ticker, day) it already holds, so it is idempotent and safe to call from several pages.

The consequence, stated plainly: **history starts empty and grows one trading day at a time.** Until a stock has two recorded points, its page shows an explicit "history is building" panel rather than a fabricated line. After a month you have a month.

If real BVC history is ever imported, load it into `stock_quotes_daily` and every chart fills in retroactively with no code change.

### Fundamentals grid

Nine indicators, in a glassmorphism card grid. A yellow dot marks the ones recomputed from the live price on every render:

| Static (from `stock_fundamentals`) | Recomputed at today's price |
|---|---|
| BPA 25, BPA 26e, DPA 25, DPA 26e | Capitalisation = price × shares, PER = price ÷ BPA, D/Y = DPA ÷ price |

Stocks with no analyst coverage say so instead of showing empty cells.

---

## 9e. Leaderboard

`/classement`, sitting between Portefeuille and Académie in the nav.

Ranked by portfolio return against the 100 000 MAD starting capital, best first. Gold for the top three, and `components/GoldenGoat.tsx` puts the golden goat next to number one.

The whole thing is one `SECURITY DEFINER` RPC, `leaderboard()`, because RLS correctly forbids reading someone else's portfolio. It returns only what a leaderboard needs: name, return, order count, and a server-computed `is_self` flag. **No e-mail, no user id, no portfolio composition.** Two rules are enforced in SQL, not in the interface:

- the principal admin is excluded (they run the platform, they don't compete)
- you need at least one trade to be ranked, otherwise the top of the board fills with untouched accounts sitting at 0,00 %

Value comes from the most recent `portfolio_snapshots` row, which already carries the valued total. With no snapshot it falls back to cash plus cost basis, i.e. a return that ignores unrealised P/L. Snapshots are written client-side on visit (see 🟠 below), so a player who never returns has a stale ranking.

**`public/golden-goat.png` is not in the repo.** The image was pasted into a chat rather than uploaded as a file, so it has to be committed by hand. `GoldenGoat.tsx` hides itself on a load error, so the leaderboard is correct without it, just goatless.

---

## 10. Known issues, ranked

### 🔴 Trading integrity is entirely client-side
Every trade rule (sufficient cash, sufficient shares, average-cost math), is enforced in the browser in `applyTrade()`. RLS grants the signed-in user full write access to their own `portfolios.cash`, `portfolio_holdings`, and `portfolio_trades`, so a single API call can set cash to any number or mint holdings from nothing.

For a solo learning sandbox this is acceptable. It blocks **any** competitive feature (leaderboards, cohort challenges, shared classrooms), and should be fixed before one ships. The fix is a `SECURITY DEFINER` Postgres function that validates and executes a trade atomically, with direct writes revoked.

### 🔴 Cash update is a non-atomic read-modify-write
`applyTrade` writes `cash: pf.cash - amount`, where `pf.cash` comes from the React Query cache. Two trades in quick succession, or a stale cache, silently clobber the balance. The same server-side RPC solves this.

### 🟠 Limit orders only fill while the tab is open
The fill loop is a `useEffect` on the portfolio page: no open tab, no execution. It also fills **at most one order per pass**, so a user with several triggerable orders fills them one render at a time. A scheduled server job (Supabase cron + the trade RPC above) is the real fix.

### 🟠 The performance curve only advances when someone visits
Snapshots are written client-side on page view, so the vs-MASI chart has gaps for every day the user didn't log in. The chart also needs ≥2 snapshots before it renders anything: a new user sees only explanatory text on day one.

Minor related bug: the snapshot date uses `new Date().toISOString().slice(0,10)` (**UTC**), while the column default is Casablanca time. Between 23:00 and midnight local, a snapshot lands on the wrong day.

### 🟠 `record_daily_quotes` trusts the client
The daily close is posted by the browser, like every trade. The RPC never overwrites a (ticker, day) it already holds, so the exposure is bounded to whoever loads a page first each morning, but that person could still write a fake close. Same threat model as the two 🔴 items above, and the same fix: move the write server-side once trading moves server-side.

### 🟡 `stock_prices` is synthetic and now unused by the UI
A sine wave over `md5(ticker)`, seeded by the initial migration. Nothing charts it any more (see §9d). Left in place because dropping a table is not worth the migration churn, but do not mistake it for market data.

### 🟡 Dead code
- `components/LazyTradingView.tsx`: no longer imported since the market cards dropped their embed.
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

1. **Move trading to a `SECURITY DEFINER` RPC.** The two 🔴 issues below are the same fix and the only ones that block a competitive feature.
2. **Translate the lesson content**, if English learners matter. Needs a schema change on `lessons`; see §9b.
3. **Extend the Moroccan holiday table** in `lib/market-session.ts` past 2027.
4. **Self-host the logo.** Required before any non-Lovable deployment.
5. **Run `npm run format`** and get lint to zero, so it's a usable signal again.
6. **Backfill the `stocks` table** for the other 61 listings: the single biggest content gap.
7. **Move trading to a Postgres RPC**, closing both the integrity hole and the cash race, and unlocking leaderboards.
8. **Server-side limit-order execution** via scheduled job.
9. **Add a test suite**: `applyTrade`, `buildLevelProgress`, and the compound-interest loop are pure, well-isolated logic and would be cheap to cover.
10. **Fix the stale detail page**: recompute PER/BPA/yield from live prices as the list page already does, so the two views agree.

### Things that will bite you

- Never edit `src/routeTree.gen.ts`.
- Never add Vite plugins already provided by `@lovable.dev/vite-tanstack-config`.
- Never force-push, rebase, amend or squash pushed commits (`AGENTS.md`).
- `bun install` will fail: use `npm install` (§3).
- Anything imported by a route or a `*.functions.ts` file **ships to the client bundle**; server-only code must live in `*.server.ts` and be imported inside a handler.

### Unverified

The live TradingView endpoint (`scanner.tradingview.com/morocco/scan`) could not be reached from the environment I audited in (outbound access to it was blocked by network policy (403 on CONNECT), not by anything in the app. The calling code in `lib/quotes.functions.ts` is sound, and it's an undocumented public endpoint with no API key, so **treat it as a dependency that can change or rate-limit without notice**), it is the single point of failure for every price in the product. There is currently no fallback if it fails: prices render as `, `.
