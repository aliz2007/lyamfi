import { supabase } from "@/integrations/supabase/client";

/**
 * Persistance de la session entre deux visites.
 *
 * supabase-js conserve déjà la session dans localStorage et rafraîchit le jeton
 * tout seul (`persistSession`, `autoRefreshToken` dans `integrations/supabase/
 * client.ts`). Ce qui manquait n'était donc pas la persistance mais la
 * CONSÉQUENCE : un visiteur déjà connecté retombait sur l'accueil ou sur le
 * formulaire de connexion et devait cliquer pour rejoindre son tableau de bord.
 */

/** Clé sous laquelle supabase-js range la session : `sb-<ref>-auth-token`. */
const SESSION_KEY = /^sb-.*-auth-token(\.\d+)?$/;

function storageKeys(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return Object.keys(window.localStorage);
  } catch {
    // Navigation privée ou stockage bloqué : rien à lire, rien à purger.
    return [];
  }
}

/**
 * Y a-t-il probablement une session en attente d'être validée ?
 *
 * Lecture SYNCHRONE, volontairement : `supabase.auth.getSession()` est
 * asynchrone, et attendre sa réponse pour décider quoi peindre ferait
 * clignoter la page d'accueil avant la redirection. Ce test répond tout de
 * suite « il y a un jeton rangé ici », ce qui suffit à choisir entre afficher
 * l'écran d'attente et afficher la page publique.
 *
 * Ce n'est PAS une vérification d'authentification : le jeton peut être expiré
 * ou révoqué. Seul `getSession()` tranche, et c'est lui qui décide de la
 * redirection. Se tromper ici ne coûte qu'un écran d'attente affiché pour rien.
 */
export function hasStoredSession(): boolean {
  return storageKeys().some((k) => SESSION_KEY.test(k));
}

/**
 * Ferme la session et efface ce qui pourrait la ressusciter.
 *
 * `signOut()` retire normalement sa propre clé, mais il échoue si le réseau est
 * coupé ou si le jeton est déjà invalide côté serveur, et laisse alors la
 * session locale en place : au rechargement suivant, l'utilisateur qui vient de
 * cliquer « Se déconnecter » se retrouverait reconnecté. On balaie donc
 * derrière, sans toucher au reste du stockage (la langue choisie, par exemple).
 */
export async function signOutCompletely(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {
    /* la purge locale ci-dessous reste due */
  }
  for (const key of storageKeys()) {
    if (!SESSION_KEY.test(key)) continue;
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* rien de plus à tenter */
    }
  }
}
