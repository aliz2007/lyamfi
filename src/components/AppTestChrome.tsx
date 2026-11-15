import { useEffect, useRef } from "react";
import {
  Calculator,
  ChevronRight,
  GraduationCap,
  Home,
  Landmark,
  LineChart,
  MoreHorizontal,
  Newspaper,
  PiggyBank,
  ShieldCheck,
  SlidersHorizontal,
  Trophy,
  UserRound,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  APP_TEST,
  APP_TEST_MORE_ROUTES,
  APP_TEST_TABS,
  appTestLabelKeyForPath,
  appTestTabForPath,
  type AppTestTabId,
} from "@/lib/app-test";
import { useAppTestT } from "@/lib/app-test-i18n";

const TAB_ICONS: Record<AppTestTabId, LucideIcon> = {
  home: Home,
  market: LineChart,
  portfolio: WalletCards,
  academy: GraduationCap,
  more: MoreHorizontal,
};

const MORE_ICONS: Record<(typeof APP_TEST_MORE_ROUTES)[number]["id"], LucideIcon> = {
  news: Newspaper,
  leaderboard: Trophy,
  simulators: Calculator,
  budget: PiggyBank,
  macro: Landmark,
  account: UserRound,
  admin: ShieldCheck,
};

export function AppTestHeader({
  currentPath,
  onHome,
  onOpenSettings,
}: {
  currentPath: string;
  onHome: () => void;
  onOpenSettings: () => void;
}) {
  const t = useAppTestT();
  return (
    <header
      className="relative z-10 shrink-0 border-b border-white/[0.08] bg-[#080807]/95 pt-[env(safe-area-inset-top)] backdrop-blur-xl"
      data-testid="app-test-native-header"
    >
      <div className="grid h-14 grid-cols-[3rem_minmax(0,1fr)_3rem] items-center px-2">
        <button
          type="button"
          onClick={onHome}
          className="grid h-11 w-11 place-items-center rounded-full transition-colors active:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label={t("appTest.tabHome")}
        >
          <img src="/logo.png" alt="" className="h-7 w-7 object-contain" />
        </button>
        <p className="truncate text-center text-[15px] font-semibold tracking-[-0.01em] text-[#fdfdfa]">
          {t(appTestLabelKeyForPath(currentPath))}
        </p>
        <button
          type="button"
          onClick={onOpenSettings}
          className="grid h-11 w-11 place-items-center justify-self-end rounded-full text-primary transition-colors active:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label={t("appTest.openSettings")}
          data-testid="app-test-settings-button"
        >
          <SlidersHorizontal className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.9} />
        </button>
      </div>
    </header>
  );
}

export function AppTestTabBar({
  currentPath,
  moreOpen,
  onNavigate,
  onOpenMore,
}: {
  currentPath: string;
  moreOpen: boolean;
  onNavigate: (path: string) => void;
  onOpenMore: () => void;
}) {
  const t = useAppTestT();
  const activeTab = appTestTabForPath(currentPath);
  return (
    <nav
      className="relative z-10 shrink-0 border-t border-white/[0.09] bg-[#141412]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
      aria-label={t("appTest.sectionNavigation")}
      data-testid="app-test-bottom-navigation"
    >
      <div className="grid h-16 grid-cols-5">
        {APP_TEST_TABS.map((route) => (
          <TabButton
            key={route.id}
            id={route.id}
            label={t(route.labelKey)}
            icon={TAB_ICONS[route.id]}
            active={activeTab === route.id && !moreOpen}
            onClick={() => onNavigate(route.path)}
          />
        ))}
        <TabButton
          id="more"
          label={t("appTest.tabMore")}
          icon={TAB_ICONS.more}
          active={activeTab === "more" || moreOpen}
          expanded={moreOpen}
          onClick={onOpenMore}
        />
      </div>
    </nav>
  );
}

function TabButton({
  id,
  label,
  icon: Icon,
  active,
  expanded,
  onClick,
}: {
  id: AppTestTabId;
  label: string;
  icon: LucideIcon;
  active: boolean;
  expanded?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-0 flex-col items-center justify-center gap-1 px-0.5 transition-colors duration-200 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary active:opacity-60 ${
        active ? "text-primary" : "text-[#8e8e8e]"
      }`}
      aria-current={active && id !== "more" ? "page" : undefined}
      aria-expanded={id === "more" ? expanded : undefined}
      data-testid={`app-test-tab-${id}`}
    >
      <Icon
        className={`h-[1.35rem] w-[1.35rem] transition-transform duration-200 ${active ? "scale-105" : ""}`}
        strokeWidth={active ? 2.25 : 1.75}
        aria-hidden="true"
      />
      <span
        className={`max-w-full truncate text-[10px] leading-none ${active ? "font-semibold" : "font-medium"}`}
      >
        {label}
      </span>
    </button>
  );
}

export function AppTestMoreSheet({
  open,
  currentPath,
  onClose,
  onNavigate,
  onOpenSettings,
}: {
  open: boolean;
  currentPath: string;
  onClose: () => void;
  onNavigate: (path: string) => void;
  onOpenSettings: () => void;
}) {
  const t = useAppTestT();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="app-test-more-title"
      className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[82dvh] w-full max-w-none overflow-y-auto rounded-t-[1.75rem] border border-white/10 bg-[#141412] p-0 text-[#fdfdfa] shadow-2xl backdrop:bg-black/70"
      onClose={onClose}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      data-testid="app-test-more-sheet"
    >
      <div className="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" aria-hidden="true" />
        <div className="flex items-center justify-between gap-4 pb-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
              Lyamfi
            </p>
            <h2 id="app-test-more-title" className="mt-1 text-2xl font-bold tracking-[-0.025em]">
              {t("appTest.moreTitle")}
            </h2>
          </div>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[#8e8e8e] transition-colors active:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-primary"
            aria-label={t("appTest.close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-t border-white/[0.08]">
          {APP_TEST_MORE_ROUTES.map((route) => {
            const Icon = MORE_ICONS[route.id];
            const active = currentPath === route.path || currentPath.startsWith(`${route.path}/`);
            return (
              <button
                key={route.id}
                type="button"
                onClick={() => onNavigate(route.path)}
                className={`flex min-h-13 w-full items-center gap-3 border-b border-white/[0.08] py-2 text-start transition-colors active:bg-white/[0.04] focus-visible:outline-2 focus-visible:outline-primary ${
                  active ? "text-primary" : "text-[#fdfdfa]"
                }`}
                data-testid={`app-test-more-${route.id}`}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 ${active ? "text-primary" : "text-[#8e8e8e]"}`}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate text-[15px] font-medium">
                  {t(route.labelKey)}
                </span>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-[#8e8e8e] rtl:rotate-180"
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onOpenSettings}
          className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white/[0.06] px-5 text-sm font-semibold text-primary transition-colors active:bg-white/[0.1] focus-visible:outline-2 focus-visible:outline-primary"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          {t("appTest.openSettings")}
        </button>
      </div>
    </dialog>
  );
}

export const APP_TEST_FRAME_STYLE = `
  html, body { background: ${APP_TEST.background} !important; overscroll-behavior-y: none; }
  body { -webkit-tap-highlight-color: transparent; }
  [data-app-shell-header], [data-app-shell-ticker] { display: none !important; }
  [data-app-shell-root] { min-height: 100dvh !important; background: ${APP_TEST.background} !important; }
  [data-app-shell-root] > .grid-lines { opacity: .28; }
  [data-app-shell-main] {
    box-sizing: border-box;
    max-width: 100% !important;
    padding: 22px 18px 36px !important;
  }
  [data-app-shell-main] h1 { letter-spacing: -.025em; }
  [data-app-shell-main] .surface-raised { border-radius: 20px !important; }
  [data-app-shell-main] .rise { animation-duration: .25s !important; }
`;
