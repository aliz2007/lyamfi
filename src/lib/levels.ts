import type { Key } from "@/lib/i18n";

/**
 * Les niveaux sont stockés en français dans la base (`lessons.level`), parce
 * qu'ils servent aussi de clé de tri et de regroupement côté SQL. L'affichage
 * passe par cette table de correspondance plutôt que par la valeur brute, pour
 * que l'anglais ne montre pas « Débutant ».
 */
const KEYS: Record<string, Key> = {
  Débutant: "level.beginner",
  Intermédiaire: "level.intermediate",
  Avancé: "level.advanced",
};

export function levelKey(level: string): Key {
  return KEYS[level] ?? "level.beginner";
}
