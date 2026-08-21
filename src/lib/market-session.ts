/**
 * Statut de la séance de la Bourse de Casablanca (heure locale Africa/Casablanca).
 * Séance : lundi → vendredi, 09h30 – 15h30. Fermée les week-ends et jours fériés.
 */

export const CSE_OPEN_MINUTES = 9 * 60 + 30;
export const CSE_CLOSE_MINUTES = 15 * 60 + 30;

/** Jours fériés (dates fixes ou déjà calculées), au format AAAA-MM-JJ. */
export const CSE_HOLIDAYS: Record<string, string> = {
  // 2026
  "2026-01-01": "Nouvel an",
  "2026-01-11": "Manifeste de l'Indépendance",
  "2026-01-14": "Nouvel an amazigh",
  "2026-03-20": "Aïd Al Fitr",
  "2026-03-21": "Aïd Al Fitr",
  "2026-05-01": "Fête du Travail",
  "2026-05-27": "Aïd Al Adha",
  "2026-05-28": "Aïd Al Adha",
  "2026-06-17": "1er Moharram",
  "2026-07-30": "Fête du Trône",
  "2026-08-14": "Oued Eddahab",
  "2026-08-20": "Révolution du Roi et du Peuple",
  "2026-08-21": "Fête de la Jeunesse",
  "2026-08-26": "Aïd Al Mawlid",
  "2026-11-06": "Marche Verte",
  "2026-11-18": "Fête de l'Indépendance",
  // 2027
  "2027-01-01": "Nouvel an",
  "2027-01-11": "Manifeste de l'Indépendance",
  "2027-01-14": "Nouvel an amazigh",
  "2027-05-01": "Fête du Travail",
  "2027-07-30": "Fête du Trône",
  "2027-08-14": "Oued Eddahab",
  "2027-08-20": "Révolution du Roi et du Peuple",
  "2027-08-21": "Fête de la Jeunesse",
  "2027-11-06": "Marche Verte",
  "2027-11-18": "Fête de l'Indépendance",
};

export type SessionStatus = {
  open: boolean;
  /** Clé de traduction du libellé court (« Séance ouverte », « Séance fermée »…). */
  labelKey: SessionKey;
  /** Clé de traduction du détail : horaire de la séance ou motif de fermeture. */
  detailKey: SessionKey;
  /** Nom du jour férié, quand c'est le motif de la fermeture. */
  holiday?: string;
  /** Heure locale de Casablanca, par exemple « 14:37 ». */
  localTime: string;
};

/**
 * Les libellés sont des clés plutôt que du texte : le composant qui les
 * affiche les traduit dans la langue choisie. Les noms de jours fériés
 * marocains restent tels quels, ils n'ont pas d'équivalent anglais usuel.
 */
export type SessionKey =
  | "session.open"
  | "session.closed"
  | "session.preOpen"
  | "session.afterClose"
  | "session.weekend"
  | "session.holiday"
  | "session.opensAt"
  | "session.closedAt"
  | "session.continuous";

function casablancaParts(date: Date) {
  const fmt = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Africa/Casablanca",
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const p = Object.fromEntries(fmt.formatToParts(date).map((x) => [x.type, x.value]));
  const hour = Number(p["hour"] === "24" ? "0" : p["hour"]);
  const minute = Number(p["minute"]);
  return {
    iso: `${p["year"]}-${p["month"]}-${p["day"]}`,
    weekday: p["weekday"] ?? "",
    minutes: hour * 60 + minute,
    time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  };
}

export function getSessionStatus(now: Date = new Date()): SessionStatus {
  const { iso, weekday, minutes, time } = casablancaParts(now);
  const isWeekend = weekday.startsWith("samedi") || weekday.startsWith("dimanche");
  const holiday = CSE_HOLIDAYS[iso];

  if (isWeekend) {
    return {
      open: false,
      labelKey: "session.closed",
      detailKey: "session.weekend",
      localTime: time,
    };
  }
  if (holiday) {
    return {
      open: false,
      labelKey: "session.closed",
      detailKey: "session.holiday",
      holiday,
      localTime: time,
    };
  }
  if (minutes < CSE_OPEN_MINUTES) {
    return {
      open: false,
      labelKey: "session.preOpen",
      detailKey: "session.opensAt",
      localTime: time,
    };
  }
  if (minutes >= CSE_CLOSE_MINUTES) {
    return {
      open: false,
      labelKey: "session.afterClose",
      detailKey: "session.closedAt",
      localTime: time,
    };
  }
  return {
    open: true,
    labelKey: "session.open",
    detailKey: "session.continuous",
    localTime: time,
  };
}
