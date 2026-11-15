import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Check,
  Download,
  Expand,
  LoaderCircle,
  Plus,
  RefreshCw,
  Share,
  ShieldCheck,
  Smartphone,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  APP_TEST_FRAME_STYLE,
  AppTestHeader,
  AppTestMoreSheet,
  AppTestTabBar,
} from "@/components/AppTestChrome";
import { Logo } from "@/components/Logo";
import {
  APP_TEST,
  isIosPhone,
  isPhoneDevice,
  isStandaloneDisplay,
  registerAppTestServiceWorker,
} from "@/lib/app-test";
import { useAppTestT } from "@/lib/app-test-i18n";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Preview administrateur du shell mobile.
 *
 * L'iframe est volontairement la vraie application Lyamfi, sur la même origine :
 * session Supabase, navigation et données ne sont ni copiées ni simulées.
 */
export function AppTestExperience() {
  const t = useAppTestT();
  const [phone] = useState(() => isPhoneDevice(window.navigator));
  const [standalone, setStandalone] = useState(isStandaloneDisplay);
  const [panelOpen, setPanelOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [frameKey, setFrameKey] = useState(0);
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [minimumElapsed, setMinimumElapsed] = useState(false);
  const [forceReveal, setForceReveal] = useState(false);
  const [frameError, setFrameError] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>(APP_TEST.entryPath);
  const [moreOpen, setMoreOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!phone) return;

    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstallPrompt(null);
      setStandalone(true);
      toast.success(t("appTest.installSuccess"));
    };
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const onDisplayChange = () => setStandalone(isStandaloneDisplay());

    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    displayMode.addEventListener("change", onDisplayChange);
    void registerAppTestServiceWorker().catch(() => {
      // Le preview reste utilisable si le navigateur interdit les workers.
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      displayMode.removeEventListener("change", onDisplayChange);
    };
  }, [phone, t]);

  useEffect(() => {
    setFrameLoaded(false);
    setMinimumElapsed(false);
    setForceReveal(false);
    setFrameError(false);

    const minimum = window.setTimeout(() => setMinimumElapsed(true), APP_TEST.splashDurationMs);
    // Une connexion interrompue ne doit jamais laisser un voile infini.
    const maximum = window.setTimeout(() => setForceReveal(true), 6000);
    return () => {
      window.clearTimeout(minimum);
      window.clearTimeout(maximum);
    };
  }, [frameKey]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (panelOpen && !dialog.open) dialog.showModal();
    if (!panelOpen && dialog.open) dialog.close();
  }, [panelOpen]);

  useEffect(() => {
    if (!phone) return;

    // TanStack Router navigue sans recharger l'iframe : la lecture périodique
    // garde donc le titre et l'onglet actif synchronisés, y compris sur les
    // pages de détail et après les liens internes à l'application.
    const syncPath = () => {
      try {
        const path = frameRef.current?.contentWindow?.location.pathname;
        if (path) setCurrentPath((current) => (current === path ? current : path));
      } catch {
        setFrameError(true);
      }
    };
    const interval = window.setInterval(syncPath, 250);
    return () => window.clearInterval(interval);
  }, [frameKey, phone]);

  if (!phone) return <PhoneRequired />;

  const ios = isIosPhone();
  const splashVisible = !forceReveal && !frameError && !(frameLoaded && minimumElapsed);

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (choice.outcome === "dismissed") toast.message(t("appTest.installDismissed"));
  };

  const fullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      toast.error(t("appTest.fullscreenError"));
    }
  };

  const handleFrameLoad = () => {
    const frame = frameRef.current;
    try {
      const frameDocument = frame?.contentDocument;
      const frameWindow = frame?.contentWindow;
      if (!frameDocument || !frameWindow) {
        setFrameError(true);
        return;
      }

      let style = frameDocument.getElementById("lyamfi-app-test-style");
      if (!style) {
        style = frameDocument.createElement("style");
        style.id = "lyamfi-app-test-style";
        frameDocument.head.appendChild(style);
      }
      style.textContent = APP_TEST_FRAME_STYLE;
      setCurrentPath(frameWindow.location.pathname);
      setFrameLoaded(true);
    } catch {
      setFrameError(true);
    }
  };

  const navigateFrame = (path: string) => {
    setMoreOpen(false);
    setPanelOpen(false);

    const frame = frameRef.current;
    const frameWindow = frame?.contentWindow;
    if (!frame || !frameWindow) {
      setFrameError(true);
      return;
    }

    try {
      if (frameWindow.location.pathname === path) {
        const reduceMotion = frameWindow.matchMedia("(prefers-reduced-motion: reduce)").matches;
        frameWindow.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
        setCurrentPath(path);
        return;
      }

      // Utiliser un vrai lien TanStack Router quand il existe évite un rechargement
      // complet et conserve le même comportement que l'application native.
      const link = frame.contentDocument?.querySelector<HTMLAnchorElement>(`a[href="${path}"]`);
      if (link) link.click();
      else frameWindow.location.assign(path);
      setCurrentPath(path);
    } catch {
      setFrameError(true);
    }
  };

  const reloadFrame = () => {
    setMoreOpen(false);
    setPanelOpen(false);
    setCurrentPath(APP_TEST.entryPath);
    setFrameKey((key) => key + 1);
  };

  const openSettings = () => {
    setMoreOpen(false);
    setPanelOpen(true);
  };

  return (
    <main
      className="relative flex h-dvh w-full flex-col overflow-hidden"
      style={{ backgroundColor: APP_TEST.background }}
      data-testid="app-test-phone"
    >
      <AppTestHeader
        currentPath={currentPath}
        onHome={() => navigateFrame(APP_TEST.entryPath)}
        onOpenSettings={openSettings}
      />

      <div className="relative min-h-0 flex-1">
        <iframe
          ref={frameRef}
          key={frameKey}
          src={APP_TEST.entryPath}
          title={t("appTest.frameTitle")}
          className="block h-full w-full border-0"
          allow="fullscreen"
          referrerPolicy="same-origin"
          onLoad={handleFrameLoad}
          onError={() => setFrameError(true)}
        />
      </div>

      <AppTestTabBar
        currentPath={currentPath}
        moreOpen={moreOpen}
        onNavigate={navigateFrame}
        onOpenMore={() => {
          setPanelOpen(false);
          setMoreOpen((open) => !open);
        }}
      />

      <AppTestMoreSheet
        open={moreOpen}
        currentPath={currentPath}
        onClose={() => setMoreOpen(false)}
        onNavigate={navigateFrame}
        onOpenSettings={openSettings}
      />

      {splashVisible && (
        <div
          className="absolute inset-0 z-20 grid place-items-center px-8 transition-opacity duration-200"
          style={{ backgroundColor: APP_TEST.background }}
          role="status"
          aria-label={t("appTest.loading")}
        >
          <div className="flex flex-col items-center">
            <img src="/logo.png" alt="" className="h-24 w-24 object-contain" />
            <p className="mt-5 text-2xl font-bold tracking-[0.18em] text-primary">LYAMFI</p>
            <p className="mt-2 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
              App Test
            </p>
            <LoaderCircle className="mt-8 h-5 w-5 animate-spin text-primary" aria-hidden="true" />
          </div>
        </div>
      )}

      {frameError && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-background px-7 text-center">
          <div className="max-w-sm">
            <Smartphone className="mx-auto h-9 w-9 text-primary" aria-hidden="true" />
            <h1 className="mt-5 text-xl font-semibold">{t("appTest.loadErrorTitle")}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("appTest.loadErrorText")}
            </p>
            <button
              type="button"
              onClick={reloadFrame}
              className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gradient-gold px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {t("appTest.reload")}
            </button>
          </div>
        </div>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby="app-test-panel-title"
        className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[85dvh] w-full max-w-none overflow-y-auto rounded-t-3xl border border-border bg-popover p-0 text-popover-foreground shadow-2xl backdrop:bg-black/70"
        onClose={() => setPanelOpen(false)}
        onCancel={() => setPanelOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setPanelOpen(false);
        }}
      >
        <div className="p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-7">
          <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-muted" aria-hidden="true" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-primary">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                <span className="text-xs font-semibold uppercase tracking-[0.16em]">Admin</span>
              </div>
              <h2 id="app-test-panel-title" className="mt-2 text-2xl font-bold">
                App Test
              </h2>
            </div>
            <button
              type="button"
              autoFocus
              onClick={() => setPanelOpen(false)}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              aria-label={t("appTest.close")}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-5 flex items-start gap-3 border-y border-border py-4">
            {standalone ? (
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
            ) : (
              <Download className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            )}
            <div>
              <p className="text-sm font-semibold">
                {t(
                  standalone
                    ? "appTest.statusStandalone"
                    : ios
                      ? "appTest.statusBrowser"
                      : "appTest.statusBrowserAndroid",
                )}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {t(
                  standalone
                    ? "appTest.standaloneText"
                    : ios
                      ? "appTest.browserText"
                      : "appTest.browserTextAndroid",
                )}
              </p>
            </div>
          </div>

          {!standalone && (
            <section className="mt-5" aria-label={t("appTest.installSection")}>
              <h3 className="text-sm font-semibold">{t("appTest.installSection")}</h3>
              {installPrompt ? (
                <button
                  type="button"
                  onClick={() => void install()}
                  className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-gold px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  {t("appTest.install")}
                </button>
              ) : ios ? (
                <ol className="mt-4 space-y-4">
                  <InstallStep
                    icon={<Share className="h-5 w-5" aria-hidden="true" />}
                    text={t("appTest.iosStep1")}
                  />
                  <InstallStep
                    icon={<Plus className="h-5 w-5" aria-hidden="true" />}
                    text={t("appTest.iosStep2")}
                  />
                  <InstallStep
                    icon={<Check className="h-5 w-5" aria-hidden="true" />}
                    text={t("appTest.iosStep3")}
                  />
                </ol>
              ) : (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {t("appTest.genericInstall")}
                </p>
              )}
              {typeof document.documentElement.requestFullscreen === "function" && (
                <button
                  type="button"
                  onClick={() => void fullscreen()}
                  className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <Expand className="h-4 w-4" aria-hidden="true" />
                  {t("appTest.fullscreen")}
                </button>
              )}
            </section>
          )}

          <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
            {t("appTest.nativeLimitations")}
          </p>

          <button
            type="button"
            onClick={reloadFrame}
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t("appTest.reload")}
          </button>
        </div>
      </dialog>
    </main>
  );
}

function InstallStep({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-center gap-3 text-sm leading-relaxed">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border text-primary">
        {icon}
      </span>
      <span>{text}</span>
    </li>
  );
}

function PhoneRequired() {
  const t = useAppTestT();
  return (
    <main
      className="relative grid min-h-dvh place-items-center overflow-hidden px-6 py-12"
      style={{ backgroundColor: APP_TEST.background }}
      data-testid="app-test-desktop-block"
    >
      <div className="aurora" aria-hidden="true" />
      <div className="relative w-full max-w-md text-center">
        <Logo className="justify-center" />
        <Smartphone className="mx-auto mt-12 h-12 w-12 text-primary" strokeWidth={1.4} />
        <h1 className="mt-6 text-2xl font-bold">{t("appTest.phoneOnlyTitle")}</h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          {t("appTest.phoneOnlyText")}
        </p>
        <Link
          to="/admin"
          className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          {t("appTest.backAdmin")}
        </Link>
      </div>
    </main>
  );
}
