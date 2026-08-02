import { useEffect, useRef } from "react";

const SYMBOLS = [
  ["CSEMA:MASI", "MASI"],
  ["CSEMA:IAM", "Maroc Telecom"],
  ["CSEMA:ATW", "Attijariwafa"],
  ["CSEMA:BCP", "Banque Populaire"],
  ["CSEMA:BOA", "Bank of Africa"],
  ["CSEMA:CDM", "Crédit du Maroc"],
  ["CSEMA:CIH", "CIH Bank"],
  ["CSEMA:EQD", "Eqdom"],
  ["CSEMA:LFA", "LafargeHolcim"],
  ["CSEMA:CIM", "Ciments du Maroc"],
  ["CSEMA:ADH", "Addoha"],
  ["CSEMA:RDS", "Alliances"],
  ["CSEMA:RMA", "Res. Dar Saada"],
  ["CSEMA:MNG", "Managem"],
  ["CSEMA:CMT", "Minière Touissit"],
  ["CSEMA:SMI", "SMI"],
  ["CSEMA:TQM", "Taqa Morocco"],
  ["CSEMA:AFG", "Afriquia Gaz"],
  ["CSEMA:MSA", "Marsa Maroc"],
  ["CSEMA:HPS", "HPS"],
  ["CSEMA:LHL", "Label Vie"],
  ["CSEMA:MUT", "Mutandis"],
  ["CSEMA:OUL", "Oulmès"],
  ["CSEMA:LES", "Lesieur Cristal"],
  ["CSEMA:CDA", "Centrale Danone"],
  ["CSEMA:SNE", "SNEP"],
  ["CSEMA:SID", "Sonasid"],
  ["CSEMA:CG", "Colorado"],
  ["CSEMA:JET", "Jet Contractors"],
  ["CSEMA:WFA", "Wafa Assurance"],
  ["CSEMA:ATL", "AtlantaSanad"],
  ["CSEMA:AGM", "AFMA"],
  ["CSEMA:CTM", "CTM"],
  ["CSEMA:SOT", "Sothema"],
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
