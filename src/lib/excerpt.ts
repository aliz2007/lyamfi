/**
 * Extrait d'article pour la vignette du flux.
 *
 * Vit à part du composant qui rend l'article : c'est une transformation de
 * texte, pas un rendu, et l'exporter depuis un fichier de composants coupe le
 * rafraîchissement à chaud de Vite.
 */

/**
 * Les premières lignes d'un article, pour la vignette du flux.
 *
 * Le balisage est retiré plutôt que rendu : un `##` ou un `-` au milieu d'un
 * extrait de trois lignes se lit comme une coquille. La coupure elle-même est
 * laissée au CSS (`line-clamp`), qui sait où tombe le texte à l'écran.
 */
export function plainExcerpt(content: string): string {
  return content
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !/^-{3,}$|^\*{3,}$/.test(l))
    .map((l) =>
      l
        .replace(/^#{2,3}\s+/, "")
        .replace(/^[-*]\s+/, "")
        .replace(/\*\*/g, ""),
    )
    .join(" ");
}
