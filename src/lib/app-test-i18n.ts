import { useCallback } from "react";
import { useI18n, type Lang } from "@/lib/i18n";

const fr = {
  "appTest.frameTitle": "Aperçu de l’application Lyamfi",
  "appTest.openControls": "Ouvrir les réglages App Test",
  "appTest.loading": "Chargement de l’application…",
  "appTest.loadErrorTitle": "L’application n’a pas pu démarrer",
  "appTest.loadErrorText": "Vérifie ta connexion, puis recharge le preview.",
  "appTest.reload": "Recharger l’application",
  "appTest.close": "Fermer",
  "appTest.statusStandalone": "Mode application actif",
  "appTest.standaloneText":
    "Le preview est ouvert depuis l’écran d’accueil, sans la barre du navigateur.",
  "appTest.statusBrowser": "Installation requise pour le plein écran",
  "appTest.statusBrowserAndroid": "Choisis le mode application ou le plein écran",
  "appTest.browserText":
    "Safari ne peut pas masquer complètement sa barre tant que la page n’est pas ajoutée à l’écran d’accueil.",
  "appTest.browserTextAndroid":
    "Installe App Test ou essaie le plein écran pour réduire l’interface du navigateur. Le comportement exact dépend de ton navigateur.",
  "appTest.installSection": "Installer App Test",
  "appTest.install": "Ajouter à l’écran d’accueil",
  "appTest.iosStep1": "Dans Safari, touche le bouton Partager.",
  "appTest.iosStep2": "Choisis « Sur l’écran d’accueil ».",
  "appTest.iosStep3": "Touche « Ajouter », puis ouvre App Test depuis l’icône.",
  "appTest.genericInstall":
    "Ouvre le menu du navigateur, puis choisis « Installer l’application » ou « Ajouter à l’écran d’accueil ».",
  "appTest.fullscreen": "Essayer le plein écran sans installation",
  "appTest.fullscreenError":
    "Ce navigateur ne permet pas le plein écran direct. Utilise l’ajout à l’écran d’accueil.",
  "appTest.installSuccess": "App Test est installé.",
  "appTest.installDismissed": "Installation annulée. Tu peux la relancer depuis App Test.",
  "appTest.nativeLimitations":
    "Le contenu et la navigation sont ceux de l’application. Les widgets natifs, les notifications push et les liens universels nécessitent toujours le binaire iOS ou Android.",
  "appTest.phoneOnlyTitle": "App Test est réservé au téléphone",
  "appTest.phoneOnlyText":
    "Ouvre https://lyamfi.com/app-test directement sur ton iPhone ou ton téléphone Android avec ton compte administrateur.",
  "appTest.backAdmin": "Retour à l’administration",
  "appTest.tabHome": "Accueil",
  "appTest.tabMarket": "Bourse",
  "appTest.tabPortfolio": "Portefeuille",
  "appTest.tabAcademy": "Académie",
  "appTest.tabMore": "Plus",
  "appTest.moreTitle": "Plus de sections",
  "appTest.moreNews": "Actualités",
  "appTest.moreLeaderboard": "Classement",
  "appTest.moreSimulators": "Simulateurs",
  "appTest.moreBudget": "Budget",
  "appTest.moreMacro": "Macroéconomie",
  "appTest.moreAccount": "Mon compte",
  "appTest.moreAdmin": "Administration",
  "appTest.openSettings": "Réglages App Test",
  "appTest.sectionNavigation": "Navigation de l’application",
} as const;

type AppTestKey = keyof typeof fr;
type AppTestDictionary = Record<AppTestKey, string>;

const en: AppTestDictionary = {
  "appTest.frameTitle": "Lyamfi application preview",
  "appTest.openControls": "Open App Test settings",
  "appTest.loading": "Loading the application…",
  "appTest.loadErrorTitle": "The application could not start",
  "appTest.loadErrorText": "Check your connection, then reload the preview.",
  "appTest.reload": "Reload the application",
  "appTest.close": "Close",
  "appTest.statusStandalone": "Application mode active",
  "appTest.standaloneText": "The preview is open from your home screen, without the browser bar.",
  "appTest.statusBrowser": "Installation required for full screen",
  "appTest.statusBrowserAndroid": "Choose app mode or full screen",
  "appTest.browserText":
    "Safari cannot completely hide its bar until the page is added to your home screen.",
  "appTest.browserTextAndroid":
    "Install App Test or try full screen to reduce the browser interface. Exact behavior depends on your browser.",
  "appTest.installSection": "Install App Test",
  "appTest.install": "Add to Home Screen",
  "appTest.iosStep1": "In Safari, tap the Share button.",
  "appTest.iosStep2": "Choose “Add to Home Screen”.",
  "appTest.iosStep3": "Tap “Add”, then open App Test from its icon.",
  "appTest.genericInstall":
    "Open the browser menu, then choose “Install app” or “Add to Home Screen”.",
  "appTest.fullscreen": "Try full screen without installing",
  "appTest.fullscreenError":
    "This browser does not allow direct full screen. Use Add to Home Screen instead.",
  "appTest.installSuccess": "App Test is installed.",
  "appTest.installDismissed": "Installation dismissed. You can retry from App Test.",
  "appTest.nativeLimitations":
    "The content and navigation match the application. Native widgets, push notifications and universal links still require the iOS or Android binary.",
  "appTest.phoneOnlyTitle": "App Test is phone-only",
  "appTest.phoneOnlyText":
    "Open https://lyamfi.com/app-test directly on your iPhone or Android phone using your administrator account.",
  "appTest.backAdmin": "Back to administration",
  "appTest.tabHome": "Home",
  "appTest.tabMarket": "Market",
  "appTest.tabPortfolio": "Portfolio",
  "appTest.tabAcademy": "Academy",
  "appTest.tabMore": "More",
  "appTest.moreTitle": "More sections",
  "appTest.moreNews": "News",
  "appTest.moreLeaderboard": "Leaderboard",
  "appTest.moreSimulators": "Simulators",
  "appTest.moreBudget": "Budget",
  "appTest.moreMacro": "Macroeconomy",
  "appTest.moreAccount": "My account",
  "appTest.moreAdmin": "Administration",
  "appTest.openSettings": "App Test settings",
  "appTest.sectionNavigation": "Application navigation",
};

const ar: AppTestDictionary = {
  "appTest.frameTitle": "معاينة تطبيق Lyamfi",
  "appTest.openControls": "فتح إعدادات App Test",
  "appTest.loading": "جارٍ تحميل التطبيق…",
  "appTest.loadErrorTitle": "تعذّر تشغيل التطبيق",
  "appTest.loadErrorText": "تحقّق من اتصالك، ثم أعد تحميل المعاينة.",
  "appTest.reload": "إعادة تحميل التطبيق",
  "appTest.close": "إغلاق",
  "appTest.statusStandalone": "وضع التطبيق مفعّل",
  "appTest.standaloneText": "المعاينة مفتوحة من الشاشة الرئيسية، من دون شريط المتصفح.",
  "appTest.statusBrowser": "التثبيت مطلوب لملء الشاشة",
  "appTest.statusBrowserAndroid": "اختر وضع التطبيق أو ملء الشاشة",
  "appTest.browserText":
    "لا يستطيع Safari إخفاء شريطه بالكامل حتى تضاف الصفحة إلى الشاشة الرئيسية.",
  "appTest.browserTextAndroid":
    "ثبّت App Test أو جرّب ملء الشاشة لتقليل واجهة المتصفح. يعتمد السلوك الدقيق على متصفحك.",
  "appTest.installSection": "تثبيت App Test",
  "appTest.install": "إضافة إلى الشاشة الرئيسية",
  "appTest.iosStep1": "في Safari، اضغط زر المشاركة.",
  "appTest.iosStep2": "اختر «إضافة إلى الشاشة الرئيسية».",
  "appTest.iosStep3": "اضغط «إضافة»، ثم افتح App Test من أيقونته.",
  "appTest.genericInstall":
    "افتح قائمة المتصفح، ثم اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».",
  "appTest.fullscreen": "تجربة ملء الشاشة من دون تثبيت",
  "appTest.fullscreenError":
    "لا يسمح هذا المتصفح بملء الشاشة مباشرة. استخدم الإضافة إلى الشاشة الرئيسية.",
  "appTest.installSuccess": "تم تثبيت App Test.",
  "appTest.installDismissed": "أُلغي التثبيت. يمكنك إعادة المحاولة من App Test.",
  "appTest.nativeLimitations":
    "المحتوى والتنقل مطابقان للتطبيق. ما زالت الأدوات الأصلية والإشعارات والروابط العامة تتطلب نسخة iOS أو Android.",
  "appTest.phoneOnlyTitle": "App Test متاح على الهاتف فقط",
  "appTest.phoneOnlyText":
    "افتح https://lyamfi.com/app-test مباشرة على iPhone أو هاتف Android باستخدام حساب المشرف.",
  "appTest.backAdmin": "العودة إلى الإدارة",
  "appTest.tabHome": "الرئيسية",
  "appTest.tabMarket": "البورصة",
  "appTest.tabPortfolio": "المحفظة",
  "appTest.tabAcademy": "الأكاديمية",
  "appTest.tabMore": "المزيد",
  "appTest.moreTitle": "المزيد من الأقسام",
  "appTest.moreNews": "الأخبار",
  "appTest.moreLeaderboard": "الترتيب",
  "appTest.moreSimulators": "المحاكيات",
  "appTest.moreBudget": "الميزانية",
  "appTest.moreMacro": "الاقتصاد الكلي",
  "appTest.moreAccount": "حسابي",
  "appTest.moreAdmin": "الإدارة",
  "appTest.openSettings": "إعدادات App Test",
  "appTest.sectionNavigation": "التنقل في التطبيق",
};

const dictionaries: Record<Lang, AppTestDictionary> = { fr, en, ar };

/** Traductions locales au preview, sans alourdir les dictionnaires globaux. */
export function useAppTestT() {
  const { lang } = useI18n();
  return useCallback((key: AppTestKey) => dictionaries[lang][key], [lang]);
}
