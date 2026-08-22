import { useEffect, useRef, useState } from "react";
import {
  AreaSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import { useFormat } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export type PricePoint = { date: string; close: number };

/**
 * Graphique de cours rendu dans la page, avec TradingView Lightweight Charts.
 *
 * L'ancienne fiche valeur incrustait un widget TradingView : c'était une
 * iframe, donc le moindre clic emmenait l'utilisateur sur tradingview.com.
 * Lightweight Charts est une bibliothèque de rendu, pas un widget : elle ne
 * charge rien de l'extérieur et ne navigue nulle part. En contrepartie elle
 * n'apporte aucune donnée, que le parent doit fournir.
 *
 * La bibliothèque manipule le DOM directement : tout se passe donc dans un
 * effet, jamais pendant le rendu.
 */
export function PriceChart({
  data,
  height = 380,
  label,
}: {
  data: PricePoint[];
  height?: number;
  label: string;
}) {
  const box = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const { locale } = useI18n();
  const f = useFormat();

  const last = data[data.length - 1];
  const [hover, setHover] = useState<{ date: string; value: number } | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;

    const gold = "#FCD116";
    const chart = createChart(el, {
      height,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(255,255,255,0.55)",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: "rgba(255,255,255,0.05)" },
      },
      rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.14, bottom: 0.08 } },
      timeScale: { borderVisible: false, fixLeftEdge: true, fixRightEdge: true },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: { color: gold, width: 1, style: LineStyle.Dashed, labelBackgroundColor: gold },
        horzLine: { color: gold, width: 1, style: LineStyle.Dashed, labelBackgroundColor: gold },
      },
      handleScale: { axisPressedMouseMove: false },
      localization: {
        locale,
        // Sans ce formateur, l'échelle des prix garde le point décimal anglais
        // quelle que soit la langue choisie.
        priceFormatter: (p: number) =>
          new Intl.NumberFormat(locale, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(p),
      },
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: gold,
      lineWidth: 2,
      topColor: "rgba(252,209,22,0.28)",
      bottomColor: "rgba(252,209,22,0.01)",
      priceLineVisible: false,
      lastValueVisible: false,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    chart.subscribeCrosshairMove((param) => {
      const value = param.seriesData.get(series) as { value?: number } | undefined;
      if (!param.time || value?.value === undefined) {
        setHover(null);
        return;
      }
      setHover({ date: isoFromTime(param.time), value: value.value });
    });

    // Le conteneur est fluide : on suit sa largeur réelle plutôt que celle de
    // la fenêtre, sinon le graphique déborde dès qu'il vit dans une colonne.
    const ro = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? el.clientWidth;
      if (width > 0) chart.applyOptions({ width });
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [height, locale]);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;
    series.setData(data.map((p) => ({ time: toTime(p.date), value: p.close })));
    chartRef.current?.timeScale().fitContent();
  }, [data]);

  const shown = hover ?? (last ? { date: last.date, value: last.close } : null);

  return (
    <div className="relative">
      {shown && (
        <div className="pointer-events-none absolute left-4 top-3 z-10">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums text-brand-yellow">
            {f.price(shown.value)} <span className="text-sm font-medium">MAD</span>
          </p>
          <p className="text-[11px] tabular-nums text-muted-foreground">
            {f.shortDate(shown.date)}
          </p>
        </div>
      )}
      <div ref={box} className="w-full" style={{ height }} />
    </div>
  );
}

/** Lightweight Charts accepte "AAAA-MM-JJ" tel quel pour une série journalière. */
function toTime(date: string): Time {
  return date as unknown as Time;
}

/** Retour inverse : la bibliothèque peut rendre une date métier ou un horodatage. */
function isoFromTime(time: Time): string {
  if (typeof time === "string") return time;
  if (typeof time === "number") {
    return new Date((time as UTCTimestamp) * 1000).toISOString().slice(0, 10);
  }
  const { year, month, day } = time;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
