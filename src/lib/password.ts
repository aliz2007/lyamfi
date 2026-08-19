/**
 * Règles de mot de passe, exprimées comme une liste de contrôles nommés
 * pour que l'écran d'inscription affiche précisément ce qui manque plutôt
 * qu'un « mot de passe non sécurisé » sans explication.
 */

export type PasswordRule = {
  id: string;
  /** Libellé affiché à l'utilisateur, formulé comme une exigence. */
  label: string;
  test: (v: string) => boolean;
};

/** bcrypt tronque au-delà de 72 octets — Supabase refuse au-delà. */
export const PASSWORD_MAX = 72;
export const PASSWORD_MIN = 8;

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "length",
    label: `Au moins ${PASSWORD_MIN} caractères`,
    test: (v) => v.length >= PASSWORD_MIN,
  },
  {
    id: "lower",
    label: "Une lettre minuscule (a–z)",
    test: (v) => /[a-z]/.test(v),
  },
  {
    id: "upper",
    label: "Une lettre majuscule (A–Z)",
    test: (v) => /[A-Z]/.test(v),
  },
  {
    id: "digit",
    label: "Un chiffre (0–9)",
    test: (v) => /\d/.test(v),
  },
  {
    id: "special",
    label: "Un caractère spécial (!, ?, *, @, #…)",
    test: (v) => /[^A-Za-z0-9]/.test(v),
  },
];

export type PasswordCheck = {
  /** Chaque règle avec son état, dans l'ordre d'affichage. */
  results: { rule: PasswordRule; ok: boolean }[];
  /** Règles non satisfaites. */
  failed: PasswordRule[];
  valid: boolean;
  /** 0–4, pour la jauge de robustesse. */
  strength: number;
  strengthLabel: string;
  /** Dépassement de la limite bcrypt — erreur distincte des règles ci-dessus. */
  tooLong: boolean;
};

const STRENGTH_LABELS = ["Très faible", "Faible", "Moyen", "Bon", "Excellent"];

export function checkPassword(value: string): PasswordCheck {
  const results = PASSWORD_RULES.map((rule) => ({ rule, ok: rule.test(value) }));
  const failed = results.filter((r) => !r.ok).map((r) => r.rule);
  const passed = results.length - failed.length;

  // La longueur compte double au-delà de 12 caractères : c'est le facteur
  // qui pèse le plus réellement sur la résistance au bruteforce.
  const bonus = value.length >= 12 ? 1 : 0;
  const raw = Math.max(0, passed - 1) + bonus;
  const strength = Math.min(4, raw);

  return {
    results,
    failed,
    valid: failed.length === 0 && value.length <= PASSWORD_MAX,
    strength,
    strengthLabel: STRENGTH_LABELS[strength] ?? STRENGTH_LABELS[0]!,
    tooLong: value.length > PASSWORD_MAX,
  };
}

/**
 * Message d'erreur unique et actionnable, listant ce qu'il manque.
 * Utilisé quand on ne peut afficher qu'une seule ligne (toast).
 */
export function passwordErrorMessage(value: string): string | null {
  const { failed, tooLong } = checkPassword(value);
  if (tooLong) return `Le mot de passe ne peut pas dépasser ${PASSWORD_MAX} caractères.`;
  if (failed.length === 0) return null;
  const missing = failed.map((r) => r.label.toLowerCase()).join(", ");
  return `Il manque : ${missing}.`;
}
