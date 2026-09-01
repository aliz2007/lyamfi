import { ExternalLink } from "lucide-react";
import { LazyTradingView } from "@/components/LazyTradingView";
import { TradingViewWidget } from "@/components/TradingViewWidget";
import { useI18n, type Key } from "@/lib/i18n";

/**
 * Un cours mondial, en direct.
 *
 * POURQUOI UN WIDGET ICI, ALORS QUE LES SÉRIES MAROCAINES SONT TRACÉES À LA MAIN
 *
 * Ce n'est pas une incohérence : c'est la même règle appliquée deux fois. Les
 * symboles `ECONOMICS:MA…` sont refusés par les widgets gratuits (« Symbole
 * disponible uniquement sur TradingView »), d'où les séries Banque mondiale et
 * FMI redessinées avec Recharts sur cette même page. L'or, le pétrole ou le
 * bitcoin, eux, sont des instruments ordinaires que TradingView sert sans
 * restriction, et en temps réel — ce qu'aucune série annuelle ne pourrait
 * donner. On prend donc, dans chaque cas, la source qui accepte de répondre.
 *
 * La carte reprend trait pour trait celle des indicateurs macroéconomiques :
 * même cadre, même titre doré, même bande de graphique, même lien de sortie en
 * bas. Seul l'intérieur du graphique change de fabricant.
 */
export function WorldMarketCard({
  label,
  text,
  symbol,
}: {
  label: Key;
  text: Key;
  /** Symbole TradingView complet, ex. « OANDA:XAUUSD ». */
  symbol: string;
}) {
  const { t, locale } = useI18n();
  const lang = locale === "en-GB" ? "en" : "fr";

  return (
    <section className="glass glass-gold overflow-hidden p-5 sm:p-6">
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-brand-yellow">{t(label)}</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t(text)}</p>
      </div>

      {/* Cinq widgets sur une page, c'est cinq iframes : ils ne sont montés
          qu'une fois la carte approchée, comme sur la liste des valeurs. */}
      <LazyTradingView className="-mx-2 mt-5 h-52">
        <TradingViewWidget
          key={`${symbol}-${lang}`}
          widget="mini-symbol-overview"
          className="h-full w-full"
          config={{
            symbol,
            width: "100%",
            height: "100%",
            locale: lang,
            dateRange: "12M",
            colorTheme: "dark",
            isTransparent: true,
            autosize: true,
            chartOnly: false,
            noTimeScale: false,
            // Vide : sans cela un clic dans le graphique quitte le site.
            largeChartUrl: "",
          }}
        />
      </LazyTradingView>

      <a
        href={`https://www.tradingview.com/symbols/${symbol.replace(":", "-")}/`}
        target="_blank"
        rel="noreferrer noopener"
        className="press -mx-2 mt-3 inline-flex min-h-9 items-center gap-1 px-2 text-[11px] text-muted-foreground transition-colors hover:text-brand-yellow"
      >
        {symbol}
        <ExternalLink className="h-3 w-3" />
      </a>
    </section>
  );
}
