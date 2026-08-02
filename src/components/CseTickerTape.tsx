import { TradingViewWidget } from "@/components/TradingViewWidget";
import { CSE_SYMBOLS } from "@/lib/cse-symbols";

export function CseTickerTape() {
  return (
    <div className="w-full border-b border-border bg-background">
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
    </div>
  );
}
