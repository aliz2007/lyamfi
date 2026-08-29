import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Ancienne adresse du simulateur d'intérêts composés.
 *
 * La page s'appelle désormais « Simulateurs » et vit sur `/simulateurs`, parce
 * qu'elle en héberge deux. Le chemin d'origine est conservé en redirection
 * plutôt que supprimé : il a été partagé, mis en favori et indexé, et un 404
 * serait une régression pour qui revient par un ancien lien.
 */
export const Route = createFileRoute("/_authenticated/budget")({
  beforeLoad: () => {
    throw redirect({ to: "/simulateurs", replace: true });
  },
});
