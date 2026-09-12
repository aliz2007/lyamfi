import type { Lang } from "@/lib/i18n";
import type { LessonTranslation } from "./types";
import { EN_DEBUTANT } from "./en.debutant";
import { EN_INTERMEDIAIRE } from "./en.intermediaire";
import { EN_AVANCE } from "./en.avance";
import { AR_DEBUTANT } from "./ar.debutant";
import { AR_INTERMEDIAIRE } from "./ar.intermediaire";
import { AR_AVANCE } from "./ar.avance";

const EN: Record<string, LessonTranslation> = {
  ...EN_DEBUTANT,
  ...EN_INTERMEDIAIRE,
  ...EN_AVANCE,
};
const AR: Record<string, LessonTranslation> = {
  ...AR_DEBUTANT,
  ...AR_INTERMEDIAIRE,
  ...AR_AVANCE,
};

/** Traduction d'une leçon, ou undefined (français = base, slug inconnu). */
export function lessonTranslation(lang: Lang, slug: string): LessonTranslation | undefined {
  if (lang === "en") return EN[slug];
  if (lang === "ar") return AR[slug];
  return undefined;
}
