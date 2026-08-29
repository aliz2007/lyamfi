/**
 * Imposition des plus-values de cession.
 *
 * Le Maroc prélève 15 % sur la plus-value réalisée lors de la vente de valeurs
 * mobilières cotées. Le portefeuille virtuel l'applique pour que le rendement
 * affiché soit celui qu'on encaisse vraiment, et non un brut qui flatte.
 *
 * Deux règles, et rien d'autre :
 *   * l'impôt ne porte que sur la PLUS-VALUE, jamais sur le montant de la
 *     vente : revendre 10 000 MAD de titres achetés 9 000 ne coûte pas 1 500
 *     MAD d'impôt mais 150 ;
 *   * une moins-value n'est jamais taxée, et n'ouvre pas non plus de crédit
 *     d'impôt ici : le report des pertes est une mécanique fiscale réelle, mais
 *     la simuler dans un bac à sable pédagogique embrouillerait plus qu'elle
 *     n'enseignerait.
 *
 * Le prix de revient est le coût moyen pondéré de la ligne, celui-là même que
 * `applyTrade` tient à jour à chaque achat.
 */

/** Taux d'imposition des plus-values sur cessions de valeurs mobilières. */
export const CAPITAL_GAINS_RATE = 0.15;

export type SaleBreakdown = {
  /** Montant brut de la vente, quantité × cours. */
  gross: number;
  /** Plus-value (positive) ou moins-value (négative) réalisée sur la ligne. */
  gain: number;
  /** Impôt dû, nul dès que la vente ne dégage pas de plus-value. */
  tax: number;
  /** Ce qui rejoint réellement les liquidités. */
  net: number;
};

export function saleBreakdown(quantity: number, price: number, avgPrice: number): SaleBreakdown {
  const gross = quantity * price;
  const gain = (price - avgPrice) * quantity;
  const tax = gain > 0 ? gain * CAPITAL_GAINS_RATE : 0;
  return { gross, gain, tax, net: gross - tax };
}
