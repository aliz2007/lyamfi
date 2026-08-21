# Deploying Lyamfi to Cloudflare, with auto-deploy on every push

_Verified against commit `3108fb0` on 2026-08-18. The build was run and its generated Cloudflare config inspected._

---

## The good news

This project **already targets Cloudflare Workers**. You don't need to convert anything.

`npm run build` runs Nitro, which emits:

```
.output/server/index.mjs          # the Worker
.output/server/wrangler.json      # generated Worker config
.output/public/                   # static assets (bound as ASSETS)
.wrangler/deploy/config.json      # points wrangler at the above
```

The generated Worker config:

```json
{
  "compatibility_date": "2026-08-18",
  "main": "index.mjs",
  "assets": { "binding": "ASSETS", "directory": "../public" },
  "name": "lyamfi-lyamfi",
  "compatibility_flags": ["nodejs_compat"],
  "no_bundle": true
}
```

Because `.wrangler/deploy/config.json` redirects wrangler to that file, **`npx wrangler deploy` from the repo root just works.** No hand-written `wrangler.toml` needed: don't add one, it will fight the generated config.

---

## 🚨 The landmine: read before you configure anything

**Cloudflare's default build will fail on this repo.**

Cloudflare auto-detects the package manager. It sees `bun.lock`, uses `bun install`, and that fails: because `bun.lock` hardcodes tarball URLs on Lovable's private registry:

```
europe-west4-npm.pkg.dev/lovable-core-prod/sandbox-npm-cache/...
```

Ten packages are pinned that way (all `@supabase/*`, the `@lovable.dev/*` plugins, `iceberg-js`). Outside Lovable's sandbox they return **403**, and `--registry` does not override them because the lockfile stores fully-resolved URLs. I hit exactly this.

**Pick one fix before your first deploy:**

| Fix | How | Trade-off |
|---|---|---|
| **A. Force npm** (recommended) | Set the build command to `npm install && npm run build` | Zero repo changes. Cloudflare still sees `bun.lock` but never uses it. |
| **B. Delete `bun.lock`** | `rm bun.lock`, commit | Cleanest, but Lovable may regenerate it |
| **C. Regenerate the lockfile** | `rm bun.lock && bun install` outside Lovable, commit | Keeps bun; needs redoing whenever Lovable rewrites it |

Go with **A**. It survives Lovable regenerating the lockfile.

---

## Setup: Cloudflare dashboard (no repo changes needed)

This route needs **no commits**, which matters while pushing to the repo is blocked.

1. **dash.cloudflare.com** → **Compute (Workers)** → **Create** → **Import a repository**
2. Authorize Cloudflare's GitHub app on the **`lyamfi`** account and pick **`lyamfi/lyamfi`**
3. Set the build configuration:

   | Field | Value |
   |---|---|
   | Build command | `npm install && npm run build` |
   | Deploy command | `npx wrangler deploy` |
   | Build output directory | *leave empty*: wrangler reads the generated config |
   | Root directory | `/` |

4. **Environment variables**: add these under both **Production** and **Preview**:

   ```
   VITE_SUPABASE_URL
   VITE_SUPABASE_PUBLISHABLE_KEY
   VITE_SUPABASE_PROJECT_ID
   SUPABASE_URL
   SUPABASE_PUBLISHABLE_KEY
   SUPABASE_PROJECT_ID
   ```

   Copy the values from the repo's `.env`. The `VITE_*` ones are **build-time**: Vite inlines them into the bundle, so they must be present when the build runs, not just at runtime.

5. **Save and Deploy.**

From then on, every push to the watched branch triggers a rebuild and redeploy. That's your "auto update on every change".

---

## Custom domain

Worker → **Settings** → **Domains & Routes** → **Add** → **Custom domain**. Cloudflare provisions the certificate. The domain's DNS must already be on Cloudflare.

---

## ⚠️ Two things to decide before you switch it on

### 1. Lovable is already deploying this repo

The app is live at `lyamfi.lovable.app`, and Lovable redeploys on every push. Add Cloudflare and **both** deploy on every push, from the same commit, to two different URLs.

That's fine as a staged migration, but decide the end state:
- **Cloudflare is the real site** → point the custom domain at the Worker and treat the Lovable URL as a preview
- **Keep both** → make sure everyone knows which URL is authoritative

Note that the sync is bidirectional: editing in Lovable commits to the repo, which then triggers the Cloudflare build too. That's usually what you want, but it means a Lovable edit ships to production.

### 2. `.env` is committed to the repo

Vite reads `.env` at build time, so the build works even with no dashboard variables set, which is exactly why this is easy to miss. Set them in Cloudflare anyway and add `.env` to `.gitignore`. Right now the file only holds the Supabase URL and publishable key, which are public by design, so nothing is currently leaking. The problem is the next person who adds a service-role key to it.

---

## Verify the deploy

After the first build:

1. Load the `*.workers.dev` URL: the landing page should render with the ticker tape
2. **Check the logo.** It will very likely be broken, and that is a known bug, not a Cloudflare problem: `src/assets/lyamfi-logo.png.asset.json` is a metadata stub pointing at `/__l5e/assets-v1/…`, a path served only by Lovable. Off Lovable it 404s. Fix by committing the real PNG to `public/` and importing it normally.
3. Sign in: confirms the Supabase vars reached the client bundle
4. Open `/bourse`: confirms the TradingView server function runs on the Worker
5. Open `/portefeuille` and place a trade: confirms Supabase writes work through RLS

If step 3 fails with *"Missing Supabase environment variable(s)"*, the `VITE_*` vars weren't set at **build** time. Re-check them and rebuild: a redeploy alone won't fix it.

---

## Alternative: GitHub Actions

If you'd rather own the pipeline, the workflow is straightforward:

```yaml
name: Deploy to Cloudflare
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm install          # NOT bun: see the landmine section
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

Needs `CLOUDFLARE_API_TOKEN` (with the *Edit Cloudflare Workers* template) and `CLOUDFLARE_ACCOUNT_ID` in repo secrets. The dashboard route is simpler and needs no commit: prefer it unless you need custom build steps.

---

## Quick reference

```bash
npm install          # NOT bun install, it will 403
npm run build        # → .output/
npx wrangler deploy  # deploys using the generated config
npm run preview      # serve the build locally first
```
