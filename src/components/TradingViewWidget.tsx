import { useEffect, useRef } from "react";

type Props = {
  /** Nom du script d'embed TradingView, ex. "ticker-tape", "market-quotes". */
  widget: string;
  config: Record<string, unknown>;
  className?: string;
};

/**
 * Injecte proprement un widget TradingView (une seule fois par montage,
 * nettoyage complet au démontage pour éviter les doublons en HMR/navigation).
 */
export function TradingViewWidget({ widget, config, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const configKey = JSON.stringify(config);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.innerHTML = "";
    const mount = document.createElement("div");
    mount.className = "tradingview-widget-container__widget";
    el.appendChild(mount);

    const script = document.createElement("script");
    script.src = `https://s3.tradingview.com/external-embedding/embed-widget-${widget}.js`;
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = configKey;
    el.appendChild(script);

    return () => {
      el.innerHTML = "";
    };
  }, [widget, configKey]);

  return (
    <div className={className}>
      <div className="tradingview-widget-container h-full w-full" ref={containerRef} />
    </div>
  );
}
