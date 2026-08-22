// @lovable.dev/vite-tanstack-config already includes the following, do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { execSync } from "node:child_process";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

/**
 * Empreinte du build, injectée dans la page.
 *
 * Sans elle, impossible de savoir en regardant le site s'il sert bien le
 * dernier commit : on confond alors « le code est faux » et « le déploiement
 * n'est pas passé », ce qui coûte des allers-retours. Le commit apparaît donc
 * en pied de page d'accueil, et dans une balise meta pour qui préfère lire la
 * source.
 *
 * Cloudflare Workers Builds fournit WORKERS_CI_COMMIT_SHA ; en local on
 * interroge git. Si les deux échouent, le build continue avec « unknown »
 * plutôt que de casser.
 */
function buildSha(): string {
  const fromCi = process.env["WORKERS_CI_COMMIT_SHA"] ?? process.env["CF_PAGES_COMMIT_SHA"];
  if (fromCi) return fromCi.slice(0, 7);
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    define: {
      __BUILD_SHA__: JSON.stringify(buildSha()),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString().slice(0, 16).replace("T", " ")),
    },
  },
});
