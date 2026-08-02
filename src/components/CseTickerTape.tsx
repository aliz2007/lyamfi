import { useEffect, useRef } from "react";

const SYMBOLS = [
  ["CSE:MASI", "MASI"],
  ["CSE:IAM", "Maroc Telecom"],
  ["CSE:ATW", "Attijariwafa"],
  ["CSE:BCP", "Banque Populaire"],
  ["CSE:BOA", "Bank of Africa"],
  ["CSE:CDM", "Crédit du Maroc"],
  ["CSE:CIH", "CIH Bank"],
  ["CSE:EQD", "Eqdom"],
  ["CSE:LFA", "LafargeHolcim"],
  ["CSE:CIM", "Ciments du Maroc"],
  ["CSE:ADH", "Addoha"],
  ["CSE:RDS", "Alliances"],
  ["CSE:RMA", "Res. Dar Saada"],
  ["CSE:MNG", "Managem"],
  ["CSE:CMT", "Minière Touissit"],
  ["CSE:SMI", "SMI"],
  ["CSE:TQM", "Taqa Morocco"],
  ["CSE:AFG", "Afriquia Gaz"],
  ["CSE:MSA", "Marsa Maroc"],
  ["CSE:HPS", "HPS"],
  ["CSE:LHL", "Label Vie"],
  ["CSE:MUT", "Mutandis"],
  ["CSE:OUL", "Oulmès"],
  ["CSE:LES", "Lesieur Cristal"],
  ["CSE:CDA", "Centrale Danone"],
  ["CSE:SNE", "SNEP"],
  ["CSE:SID", "Sonasid"],
  ["CSE:CG", "Colorado"],
  ["CSE:JET", "Jet Contractors"],
  ["CSE:WFA", "Wafa Assurance"],
  ["CSE:ATL", "AtlantaSanad"],
  ["CSE:AGM", "AFMA"],
  ["CSE:CTM", "CTM"],
  ["CSE:SOT", "Sothema"],
] as const;

export function CseTickerTape() {
  const containerRef = useRef<HTMLDivElement>(null);
  const injected = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || injected.current) return;
    injected.current = true;

    el.innerHTML = "";
    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    el.appendChild(widget);

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: SYMBOLS.map(([proName, title]) => ({ proName, title })),
      showSymbolLogo: true,
      isTransparent: false,
      displayMode: "adaptive",
      colorTheme: "dark",
      locale: "fr",
    });
    el.appendChild(script);

    return () => {
      el.innerHTML = "";
      injected.current = false;
    };
  }, []);

  return (
    <div className="w-full border-b border-border bg-background">
      <div className="tradingview-widget-container w-full" ref={containerRef} />
    </div>
  );
}
