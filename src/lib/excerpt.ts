/**
 * Extrait d'article pour la vignette du flux.
 *
 * Vit à part du composant qui rend l'article : c'est une transformation de
 * texte, pas un rendu, et l'exporter depuis un fichier de composants coupe le
 * rafraîchissement à chaud de Vite.
 */

/**
 * Les premières lignes d'un article, mises à plat pour la vignette du flux.
 *
 * Cette fonction retirait le balisage markdown, qui n'existe plus : le corps
 * d'un article s'affiche désormais tel qu'il est tapé (cf. `ArticleBody`). Il
 * lui reste un travail, et un seul : la vignette est une bande de trois lignes
 * coupée par `line-clamp`, et le texte doit donc arriver sur une seule ligne.
 * Sans cet aplatissement, un article de trois paragraphes remplit les trois
 * lignes avec ses deux premiers retours chariot et la carte paraît vide.
 *
 * La coupure elle-même reste au CSS, qui sait où tombe le texte à l'écran.
 */
export function plainExcerpt(content: string): string {
  return content.replace(/\s+/g, " ").trim();
}
