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
