import { useId } from "react";

/**
 * Courbe miniature, rendue en SVG.
 *
 * Remplace le widget TradingView qui occupait les vignettes de la cote : ce
 * widget était une iframe, donc un clic dessus quittait le site. Ici tout est
 * local, et la vignette entière reste un lien vers la fiche interne.
 */
export function Sparkline({
  values,
  className = "",
  height = 40,
}: {
  values: number[];
  className?: string;
  height?: number;
}) {
  const gradientId = useId();
  if (values.length < 2) return null;

  const width = 120;
  const min = Math.min(...values);
  const max = Math.max(...values);
  // Une série plate diviserait par zéro : on la dessine au milieu.
  const span = max - min || 1;
  const step = width / (values.length - 1);
  const y = (v: number) => height - ((v - min) / span) * (height - 4) - 2;

  const line = values
    .map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(2)},${y(v).toFixed(2)}`)
    .join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const rising = (values[values.length - 1] ?? 0) >= (values[0] ?? 0);
  const stroke = rising ? "var(--success)" : "var(--destructive)";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="presentation"
      className={`w-full ${className}`}
      style={{ height }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
