/**
 * Simulateur de crédit : amortissement à annuités constantes.
 *
 * Le taux affiché en vitrine par une banque est le taux NOMINAL. Il ne dit pas
 * ce que coûte l'emprunt : il ignore l'assurance, les frais de dossier et la
 * TVA, qui se paient tous les mois en plus de l'échéance. Le TAEG les
 * réintègre, et c'est lui qu'il faut comparer d'une offre à l'autre.
 *
 * Tout se calcule ici, en dehors de React, pour que la mécanique se lise et se
 * vérifie sans monter un composant.
 */

export type CreditInput = {
  /** Capital emprunté, en dirhams. */
  amount: number;
  /** Taux nominal ANNUEL, en pourcentage (5,4 et non 0,054). */
  annualRate: number;
  /** Durée en années. */
  years: number;
  /** Assurance et frais annexes, en dirhams PAR MOIS. */
  monthlyFees: number;
};

export type CreditResult = {
  /** Nombre d'échéances. */
  months: number;
  /** Échéance hors frais, constante sur toute la durée. */
  monthly: number;
  /** Échéance réellement débitée, frais compris. */
  monthlyAllIn: number;
  /** Intérêts versés sur toute la durée. */
  totalInterest: number;
  /** Assurance et frais versés sur toute la durée. */
  totalFees: number;
  /** Ce que l'emprunt coûte en plus du capital : intérêts + frais. */
  totalCost: number;
  /** Somme de tout ce qui sort : capital + intérêts + frais. */
  totalPaid: number;
  /** Taux annuel effectif global, en pourcentage. `null` s'il est indéterminable. */
  aprPct: number | null;
  /** Coût rapporté au capital emprunté, en pourcentage. */
  costRatioPct: number;
};

/** Valeur actuelle d'une suite d'échéances constantes, au taux mensuel `r`. */
function presentValue(payment: number, months: number, r: number): number {
  if (r <= 0) return payment * months;
  return (payment * (1 - Math.pow(1 + r, -months))) / r;
}

/**
 * Taux mensuel qui égalise le capital reçu et la valeur actuelle des sorties.
 *
 * Résolu par dichotomie plutôt que par Newton : la fonction est strictement
 * décroissante en `r` sur l'intervalle utile, donc la dichotomie converge
 * toujours, là où Newton peut diverger sur une mensualité extrême saisie par
 * curiosité. Cinquante itérations sur [0, 1] laissent une erreur inférieure au
 * millième de point.
 */
function solveMonthlyRate(amount: number, payment: number, months: number): number | null {
  if (!(amount > 0) || !(payment > 0) || !(months > 0)) return null;
  // Sans intérêt ni frais, la somme versée égale le capital : le taux est nul.
  if (payment * months <= amount + 1e-9) return 0;

  let low = 0;
  let high = 1; // 100 % par mois : très au-delà de tout crédit réel.
  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    if (presentValue(payment, months, mid) > amount) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

export function simulateCredit(input: CreditInput): CreditResult | null {
  const months = Math.round(input.years * 12);
  const fees = Math.max(0, input.monthlyFees);
  if (!(input.amount > 0) || months <= 0) return null;

  const r = input.annualRate / 100 / 12;
  // Un prêt à taux zéro rembourse le capital à parts égales : la formule
  // générale y diviserait par zéro.
  const monthly =
    r > 0 ? (input.amount * r) / (1 - Math.pow(1 + r, -months)) : input.amount / months;
  if (!Number.isFinite(monthly)) return null;

  const totalInterest = monthly * months - input.amount;
  const totalFees = fees * months;
  const totalCost = totalInterest + totalFees;

  // Le TAEG se lit sur les sorties RÉELLES : l'échéance et les frais partent
  // ensemble tous les mois, c'est leur somme qui rémunère le prêteur.
  const monthlyRate = solveMonthlyRate(input.amount, monthly + fees, months);
  // Taux effectif annuel : la capitalisation mensuelle fait qu'un taux mensuel
  // de 0,5 % ne vaut pas 6 % l'an mais 6,17 %.
  const aprPct = monthlyRate === null ? null : (Math.pow(1 + monthlyRate, 12) - 1) * 100;

  return {
    months,
    monthly,
    monthlyAllIn: monthly + fees,
    totalInterest,
    totalFees,
    totalCost,
    totalPaid: input.amount + totalCost,
    aprPct,
    costRatioPct: (totalCost / input.amount) * 100,
  };
}
