import { useId } from "react";

/**
 * Marque Lyamfi — SVG inline.
 *
 * L'ancien logo pointait vers un JSON d'asset servi par l'infrastructure
 * Lovable (`/__l5e/assets-v1/…`) : hors de cet hébergement l'image renvoyait
 * un 404 sur toutes les pages. Le monogramme est désormais dessiné dans le
 * bundle, sans aucune dépendance réseau.
 */
export function Logo({ className = "" }: { className?: string }) {
  // Un id unique par instance : le composant est monté plusieurs fois par page
  // (navbar + pied de page) et des ids de dégradé dupliqués s'écraseraient.
  const gradientId = useId();

  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <svg
        viewBox="0 0 40 40"
        role="img"
        aria-label="Logo Lyamfi"
        className="h-9 w-9 shrink-0"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--gold)" />
            <stop offset="100%" stopColor="var(--gold-light)" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="11" fill={`url(#${gradientId})`} />
        {/* Monogramme L + courbe haussière, en négatif sur le dégradé. */}
        <path
          d="M12 10v17h8"
          fill="none"
          stroke="var(--primary-foreground)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M21.5 22.5l3.5-5 4 3 2-4.5"
          fill="none"
          stroke="var(--primary-foreground)"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.85"
        />
      </svg>
      <span className="text-lg font-semibold tracking-tight">Lyamfi</span>
    </span>
  );
}
