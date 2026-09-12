import type { QuizQuestion } from "@/lib/market";

/**
 * Traduction d'une leçon de l'Académie.
 *
 * La table `lessons` reste en français (source de vérité) : le programme est
 * statique, donc les traductions vivent dans le dépôt et sont superposées au
 * rendu par slug. Le quiz traduit conserve le même ordre et les mêmes index
 * `answer` que la version française — la correction est inchangée.
 */
export type LessonTranslation = {
  title: string;
  summary: string;
  content: string;
  quiz: QuizQuestion[];
};
