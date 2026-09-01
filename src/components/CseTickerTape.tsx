import { useEffect, useState } from "react";
import { TradingViewWidget } from "@/components/TradingViewWidget";
import { CSE_SYMBOLS } from "@/lib/cse-symbols";

/** Hauteur du bandeau TradingView, réservée avant son arrivée. */
const TAPE_HEIGHT = 46;

/**
 * Bandeau défilant des cours, en tête de toutes les pages.
 *
 * IL EST MONTÉ APRÈS LE PREMIER RENDU, DÉLIBÉRÉMENT.
 *
 * C'est une iframe tierce, plus le script qui la fabrique, et elle se trouve
 * tout en haut du document : montée immédiatement, elle réclamait du réseau et
 * du fil d'exécution au moment précis où le navigateur d'un téléphone essaie de
 * peindre la page. Sur une connexion mobile marocaine, cela se voit.
 *
 * Elle attend donc que le navigateur n'ait plus rien d'urgent à faire
 * (`requestIdleCallback`), avec un repli minuté pour Safari qui ne l'implémente
 * pas. Sa hauteur est réservée dès le premier rendu : le bandeau apparaît dans
 * un espace déjà tenu, sans faire sauter le contenu sous lui.
 */
export function CseTickerTape() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const idle = (
      window as Window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      }
    ).requestIdleCallback;

    if (idle) {
      const id = idle(() => setMounted(true), { timeout: 2500 });
      return () => {
        (window as Window & { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback?.(id);
      };
    }
    const timer = window.setTimeout(() => setMounted(true), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="w-full border-b border-border bg-background" style={{ minHeight: TAPE_HEIGHT }}>
      {mounted && (
        <TradingViewWidget
          widget="ticker-tape"
          className="w-full"
          config={{
            symbols: CSE_SYMBOLS.map(([proName, title]) => ({ proName, title })),
            showSymbolLogo: true,
            isTransparent: false,
            displayMode: "adaptive",
            colorTheme: "dark",
            locale: "fr",
          }}
        />
      )}
    </div>
  );
}
