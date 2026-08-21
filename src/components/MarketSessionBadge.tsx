import { useEffect, useState } from "react";
import { getSessionStatus, type SessionStatus } from "@/lib/market-session";
import { useT } from "@/lib/i18n";

/**
 * Bandeau indiquant si la séance de la Bourse de Casablanca est ouverte.
 *
 * Rendu uniquement après le montage : l'heure locale de Casablanca dépend de
 * l'horloge, et l'afficher au rendu serveur produirait un décalage
 * d'hydratation dès que la minute change entre les deux.
 */
export function MarketSessionBadge({ className = "" }: { className?: string }) {
  const t = useT();
  const [status, setStatus] = useState<SessionStatus | null>(null);

  useEffect(() => {
    const tick = () => setStatus(getSessionStatus());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  if (!status) return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border px-4 py-2.5 text-xs ${
        status.open ? "border-[var(--success)]/40 bg-[var(--success)]/10" : "border-border bg-card"
      } ${className}`}
    >
      <span className="flex items-center gap-2 font-semibold">
        <span
          className={`h-2 w-2 rounded-full ${
            status.open ? "animate-pulse bg-[var(--success)]" : "bg-muted-foreground"
          }`}
        />
        {t(status.labelKey)}
      </span>
      <span className="text-muted-foreground">
        {t(status.detailKey, status.holiday ? { name: status.holiday } : undefined)}
      </span>
      <span className="ml-auto tabular-nums text-muted-foreground">
        {t("session.casablanca", { time: status.localTime })}
      </span>
    </div>
  );
}
