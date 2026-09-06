import { useMemo } from "react";

/**
 * Rendu du corps d'un article.
 *
 * CE QUI A CHANGÉ, ET POURQUOI
 *
 * Ce composant lisait un sous-ensemble de markdown : `##` faisait un
 * sous-titre, `-` une puce, `1.` une liste numérotée, `---` un filet,
 * `**gras**` une emphase. C'était une langue à apprendre pour publier une
 * dépêche de six lignes, et surtout une langue qui MANGEAIT ce qu'on tapait :
 * un tiret en début de ligne disparaissait dans une puce, un saut de ligne
 * isolé était recollé au paragraphe précédent. La rédaction voyait un texte à
 * l'écran et un autre en ligne.
 *
 * La règle est maintenant celle du champ de saisie : ce qui est tapé est ce
 * qui s'affiche. Un tiret reste un tiret, un `##` reste un `##`, une ligne
 * sautée reste une ligne sautée. Il n'y a plus de balisage, donc plus rien à
 * apprendre ni à échapper.
 *
 * ⚠️ CONSÉQUENCE ASSUMÉE : les articles déjà publiés avec l'ancienne syntaxe
 * affichent désormais leurs marques telles quelles. C'est le prix de la
 * fidélité demandée — les effacer en silence rétablirait exactement la règle
 * invisible qu'on retire. Ils se corrigent depuis le formulaire.
 *
 * ⚠️ TOUJOURS PAS DE `dangerouslySetInnerHTML`. C'est la propriété à ne pas
 * perdre : un article est écrit par un administrateur, mais un compte
 * administrateur compromis ne doit pas pouvoir exécuter de script dans le
 * navigateur de tous les membres. Le texte reste du texte, posé dans des
 * éléments React, et React échappe tout ce qu'il rend.
 */

/**
 * Découpe le corps en paragraphes sur les lignes vides.
 *
 * Le reste est laissé intact : les sauts de ligne simples et les espaces de
 * tête sont conservés à l'affichage par `whitespace-pre-wrap`, pas reconstruits
 * ici. Une ligne vide vaut donc un vrai changement de paragraphe (avec le
 * rythme vertical qui va avec), et un saut de ligne simple vaut un retour à la
 * ligne, ce qui est précisément ce qu'on lit dans le champ de saisie.
 */
function paragraphs(content: string): string[] {
  return content
    .replace(/\r\n?/g, "\n")
    .split(/\n[ \t]*\n+/)
    .map((block) => block.replace(/\s+$/, ""))
    .filter((block) => block.trim() !== "");
}

export function ArticleBody({ content }: { content: string }) {
  const blocks = useMemo(() => paragraphs(content), [content]);

  return (
    <div className="space-y-5 text-[15px]">
      {blocks.map((block, i) => (
        // `whitespace-pre-wrap` : les retours à la ligne et l'indentation de la
        // rédaction survivent, le texte continue de se replier sur la largeur
        // de la colonne. `break-words` évite qu'une URL collée telle quelle
        // pousse la page de côté sur téléphone (cf. §9i du HANDOFF).
        <p
          key={i}
          className="whitespace-pre-wrap break-words leading-relaxed text-[oklch(0.86_0.006_90)]"
        >
          {block}
        </p>
      ))}
    </div>
  );
}
