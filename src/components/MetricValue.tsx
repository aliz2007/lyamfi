import type { Metric } from "@/lib/metrics";
import type { Formatter } from "@/lib/format";

/**
 * Met en forme un indicateur fondamental selon son type.
 *
 * Aucun cas « valeur absente » ici : un indicateur qui n'a pas pu être calculé
 * n'est jamais construit (cf. `@/lib/metrics`), donc jamais rendu. C'est la
 * règle du produit : une carte manquante se lit « non publié », une carte à
 * zéro se lirait comme une vraie mesure.
 */
export function formatMetric(metric: Metric, f: Formatter): string {
  switch (metric.kind) {
    case "money":
      return f.mad(metric.value, 2);
    case "compact":
      return f.compact(metric.value);
    case "multiple":
      return `${f.num(metric.value, 1)}x`;
    case "percent":
      return `${f.num(metric.value, 2)} %`;
    case "ratioPercent":
      // Le classeur stocke ces ratios en fraction : 0,163 vaut 16,3 %.
      return `${f.num(metric.value * 100, 1)} %`;
  }
}
