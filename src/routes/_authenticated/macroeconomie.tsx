import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Disclaimer } from "@/components/Disclaimer";
import { TradingViewWidget } from "@/components/TradingViewWidget";
import { useI18n, usePageTitle, type Key } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/macroeconomie")({
  head: () => ({
    meta: [
      { title: "Indicateurs macroéconomiques du Maroc | Lyamfi" },
      {
        name: "description",
        content:
          "Inflation, croissance du PIB, taux directeur, chômage et emploi au Maroc : les graphiques qui situent la Bourse de Casablanca dans son économie.",
      },
      { property: "og:title", content: "Indicateurs macroéconomiques | Lyamfi" },
      {
        property: "og:description",
        content: "Les grands chiffres de l'économie marocaine, en graphiques.",
      },
    ],
  }),
  component: MacroPage,
});

/**
 * Les cinq indicateurs, avec leur symbole TradingView.
 *
 * Les codes viennent du fournisseur de données économiques de TradingView :
 * préfixe pays `MA`, puis l'indicateur. Ils sont écrits ici une fois pour
 * toutes plutôt que dans le composant, pour qu'une correction de symbole se
 * fasse à un seul endroit.
 */
const INDICATORS: { symbol: string; label: Key; text: Key }[] = [
  { symbol: "ECONOMICS:MAIRMM", label: "macro.inflation", text: "macro.inflationText" },
  { symbol: "ECONOMICS:MAGDPQQ", label: "macro.gdp", text: "macro.gdpText" },
  { symbol: "ECONOMICS:MAINTR", label: "macro.rate", text: "macro.rateText" },
  { symbol: "ECONOMICS:MAUR", label: "macro.unemployment", text: "macro.unemploymentText" },
  { symbol: "ECONOMICS:MAER", label: "macro.employment", text: "macro.employmentText" },
];

function MacroPage() {
  const { t, locale } = useI18n();
  usePageTitle("macro.title");

  return (
    <div className="space-y-8">
      <Link
        to="/actualites"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-yellow"
      >
        <ArrowLeft className="h-4 w-4" /> {t("macro.back")}
      </Link>

      <header className="rise">
        <h1 className="text-3xl font-bold sm:text-4xl">{t("macro.title")}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {t("macro.intro")}
        </p>
      </header>

      {/* Une colonne sur mobile, deux au-delà : un graphique économique se lit
          mal sous 400 pixels de large. */}
      <div className="grid gap-5 lg:grid-cols-2">
        {INDICATORS.map((indicator) => (
          <section key={indicator.symbol} className="glass glass-gold overflow-hidden p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-brand-yellow">{t(indicator.label)}</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {t(indicator.text)}
            </p>
            <TradingViewWidget
              // Le locale entre dans la clé : changer de langue reconstruit le
              // widget, qui ne sait pas se traduire une fois monté.
              key={`${indicator.symbol}-${locale}`}
              widget="advanced-chart"
              className="mt-4 h-[340px] w-full"
              config={{
                symbol: indicator.symbol,
                interval: "1M",
                timezone: "Africa/Casablanca",
                theme: "dark",
                // Style 3 : courbe pleine. Un chandelier n'a pas de sens sur une
                // série économique publiée une fois par mois ou par trimestre.
                style: "3",
                locale: locale === "en-GB" ? "en" : "fr",
                backgroundColor: "rgba(0, 0, 0, 0)",
                gridColor: "rgba(255, 255, 255, 0.05)",
                hide_side_toolbar: true,
                hide_top_toolbar: true,
                hide_legend: false,
                allow_symbol_change: false,
                withdateranges: true,
                save_image: false,
                autosize: true,
              }}
            />
          </section>
        ))}
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">{t("macro.source")}</p>

      <Disclaimer />
    </div>
  );
}
