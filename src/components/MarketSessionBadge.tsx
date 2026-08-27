import { useSessionStatus } from "@/hooks/useMarketSession";
import { useT } from "@/lib/i18n";

/**
 * Bandeau indiquant si la séance de la Bourse de Casablanca est ouverte.
 *
 * Deux registres :
 *   * `info` (par défaut) : constat neutre, utilisé en tête de la page Bourse.
 *   * `order` : sur le formulaire de passage d'ordre, où la fermeture n'est pas
 *     une information mais une conséquence. L'utilisateur doit comprendre
 *     pourquoi son portefeuille ne bouge pas la nuit : l'ordre est accepté, il
 *     part à l'ouverture. Le bandeau passe alors en orange, entre le vert de la
 *     séance ouverte et le rouge d'un refus, parce que rien n'est refusé.
 *
 * Rendu uniquement après le montage, l'heure locale dépendant de l'horloge.
 */
export function MarketSessionBadge({
  className = "",
  variant = "info",
}: {
  className?: string;
  variant?: "info" | "order";
}) {
  const t = useT();
  const status = useSessionStatus();

  if (!status) return null;

  const queued = variant === "order" && !status.open;

  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border px-4 py-2.5 text-xs ${
        status.open
          ? "border-[var(--success)]/40 bg-[var(--success)]/10"
          : queued
            ? "border-[var(--warning)]/45 bg-[var(--warning)]/10"
            : "border-border bg-card"
      } ${className}`}
    >
      <span
        className={`flex items-center gap-2 font-semibold ${queued ? "text-[var(--warning)]" : ""}`}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            status.open
              ? "animate-pulse bg-[var(--success)]"
              : queued
                ? "bg-[var(--warning)]"
                : "bg-muted-foreground"
          }`}
        />
        {t(queued ? "session.closedQueued" : status.labelKey)}
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
