import type { Key } from "@/lib/i18n";

/**
 * Règles de mot de passe, exprimées comme une liste de contrôles nommés
 * pour que l'écran d'inscription affiche précisément ce qui manque plutôt
 * qu'un « mot de passe non sécurisé » sans explication.
 *
 * Les libellés sont des clés de traduction : la liste est rendue dans la
 * langue choisie par l'utilisateur, pas dans celle du code.
 */

export type PasswordRule = {
  id: string;
  /** Clé de traduction du libellé, formulé comme une exigence. */
  labelKey: Key;
  /** Valeurs injectées dans le libellé. */
  vars?: Record<string, number>;
  test: (v: string) => boolean;
};

/** bcrypt tronque au-delà de 72 octets, et Supabase refuse au-delà. */
export const PASSWORD_MAX = 72;
export const PASSWORD_MIN = 8;

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "length",
    labelKey: "pw.ruleLength",
    vars: { min: PASSWORD_MIN },
    test: (v) => v.length >= PASSWORD_MIN,
  },
  { id: "lower", labelKey: "pw.ruleLower", test: (v) => /[a-z]/.test(v) },
  { id: "upper", labelKey: "pw.ruleUpper", test: (v) => /[A-Z]/.test(v) },
  { id: "digit", labelKey: "pw.ruleDigit", test: (v) => /\d/.test(v) },
  { id: "special", labelKey: "pw.ruleSpecial", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export type PasswordCheck = {
  /** Chaque règle avec son état, dans l'ordre d'affichage. */
  results: { rule: PasswordRule; ok: boolean }[];
  /** Règles non satisfaites. */
  failed: PasswordRule[];
  valid: boolean;
  /** 0 à 4, pour la jauge de robustesse. */
  strength: number;
  /** Clé de traduction du libellé de robustesse. */
  strengthKey: Key;
  /** Dépassement de la limite bcrypt : erreur distincte des règles ci-dessus. */
  tooLong: boolean;
};

const STRENGTH_KEYS: Key[] = ["pw.s0", "pw.s1", "pw.s2", "pw.s3", "pw.s4"];

export function checkPassword(value: string): PasswordCheck {
  const results = PASSWORD_RULES.map((rule) => ({ rule, ok: rule.test(value) }));
  const failed = results.filter((r) => !r.ok).map((r) => r.rule);
  const passed = results.length - failed.length;

  // La longueur compte double au-delà de 12 caractères : c'est le facteur
  // qui pèse le plus réellement sur la résistance au bruteforce.
  const bonus = value.length >= 12 ? 1 : 0;
  const strength = Math.min(4, Math.max(0, passed - 1) + bonus);

  return {
    results,
    failed,
    valid: failed.length === 0 && value.length <= PASSWORD_MAX,
    strength,
    strengthKey: STRENGTH_KEYS[strength] ?? STRENGTH_KEYS[0]!,
    tooLong: value.length > PASSWORD_MAX,
  };
}

/**
 * Mot de passe aléatoire respectant toutes les règles.
 * Utilisé par l'administrateur principal pour réinitialiser un compte.
 */
export function generatePassword(length = 16): string {
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  const special = "!?*@#$%&+=";
  const all = lower + upper + digits + special;

  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  const pick = (set: string, i: number) => set[bytes[i]! % set.length]!;

  // Une occurrence garantie de chaque classe, puis remplissage libre, puis
  // mélange pour que les quatre premières positions ne soient pas prévisibles.
  const chars = [pick(lower, 0), pick(upper, 1), pick(digits, 2), pick(special, 3)];
  for (let i = 4; i < length; i++) chars.push(pick(all, i));

  const order = new Uint32Array(chars.length);
  crypto.getRandomValues(order);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = order[i]! % (i + 1);
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }
  return chars.join("");
}
