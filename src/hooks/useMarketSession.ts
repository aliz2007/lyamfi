import { useEffect, useState } from "react";
import { getSessionStatus, type SessionStatus } from "@/lib/market-session";

/**
 * Statut de la séance de la Bourse de Casablanca, rafraîchi seul.
 *
 * Renvoie `null` tant que le composant n'est pas monté : l'heure locale de
 * Casablanca dépend de l'horloge, et la calculer au rendu serveur produirait un
 * décalage d'hydratation dès que la minute change entre les deux.
 *
 * Le rythme d'une demi-minute a une conséquence utile côté portefeuille :
 * l'ouverture de la séance se voit sans recharger la page, et les ordres mis en
 * attente pendant la nuit partent d'eux-mêmes dans la demi-minute qui suit
 * 09h30.
 */
export function useSessionStatus(): SessionStatus | null {
  const [status, setStatus] = useState<SessionStatus | null>(null);

  useEffect(() => {
    const tick = () => setStatus(getSessionStatus());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  return status;
}
