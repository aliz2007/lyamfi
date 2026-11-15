/**
 * Configuration et détection du preview App Test.
 *
 * Les couleurs, la durée du splash et la page d'entrée reprennent le shell
 * Capacitor publié dans aliz2007/lyamfi-mobile. Le contenu reste exactement
 * celui du site, comme dans l'application native.
 */
export const APP_TEST = {
  background: "#080807",
  gold: "#e7c56b",
  splashDurationMs: 1200,
  entryPath: "/dashboard",
  serviceWorkerPath: "/app-test-sw.js",
} as const;

export const APP_TEST_TABS = [
  { id: "home", path: "/dashboard", labelKey: "appTest.tabHome" },
  { id: "market", path: "/bourse", labelKey: "appTest.tabMarket" },
  { id: "portfolio", path: "/portefeuille", labelKey: "appTest.tabPortfolio" },
  { id: "academy", path: "/academie", labelKey: "appTest.tabAcademy" },
] as const;

export const APP_TEST_MORE_ROUTES = [
  { id: "news", path: "/actualites", labelKey: "appTest.moreNews" },
  { id: "leaderboard", path: "/classement", labelKey: "appTest.moreLeaderboard" },
  { id: "simulators", path: "/simulateurs", labelKey: "appTest.moreSimulators" },
  { id: "budget", path: "/budget", labelKey: "appTest.moreBudget" },
  { id: "macro", path: "/macroeconomie", labelKey: "appTest.moreMacro" },
  { id: "account", path: "/compte", labelKey: "appTest.moreAccount" },
  { id: "admin", path: "/admin", labelKey: "appTest.moreAdmin" },
] as const;

export type AppTestTabId = (typeof APP_TEST_TABS)[number]["id"] | "more";

function matchesPath(path: string, base: string): boolean {
  return path === base || path.startsWith(`${base}/`);
}

export function appTestTabForPath(path: string): AppTestTabId {
  const tab = APP_TEST_TABS.find((route) => matchesPath(path, route.path));
  return tab?.id ?? "more";
}

export function appTestLabelKeyForPath(path: string) {
  const route = [...APP_TEST_TABS, ...APP_TEST_MORE_ROUTES].find((item) =>
    matchesPath(path, item.path),
  );
  return route?.labelKey ?? "appTest.tabMore";
}

type NavigatorWithMobileHints = Navigator & {
  standalone?: boolean;
  userAgentData?: { mobile?: boolean };
};

/** Les tablettes et les navigateurs desktop restent exclus, même en fenêtre étroite. */
export function isPhoneDevice(nav: NavigatorWithMobileHints): boolean {
  const ua = nav.userAgent || "";
  if (/iPad|Macintosh/i.test(ua) && !/iPhone|iPod/i.test(ua)) return false;
  if (/Android/i.test(ua)) return /Mobile/i.test(ua);
  if (/iPhone|iPod|Windows Phone|webOS|BlackBerry|BB10/i.test(ua)) return true;
  return nav.userAgentData?.mobile === true;
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as NavigatorWithMobileHints;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    nav.standalone === true
  );
}

export function isIosPhone(): boolean {
  if (typeof window === "undefined") return false;
  return /iPhone|iPod/i.test(window.navigator.userAgent);
}

/**
 * Aucune précaching HTML : chaque ouverture récupère la version publiée.
 * Le worker ne sert qu'à rendre le preview installable et immédiatement à jour.
 */
export async function registerAppTestServiceWorker(): Promise<void> {
  if (!("serviceWorker" in window.navigator)) return;
  await window.navigator.serviceWorker.register(APP_TEST.serviceWorkerPath, { scope: "/" });
}
