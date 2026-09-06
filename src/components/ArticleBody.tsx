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
 * ⚠️ UNE EXCEPTION, ET ELLE VIENT DE LA BASE. `news_clean_text` applique
 * `btrim()` au corps avant de l'enregistrer, et `btrim` retire les ESPACES aux
 * deux bouts (pas les tabulations). L'indentation de la toute première ligne
 * est donc perdue à l'écriture, avant que ce composant ne voie quoi que ce
 * soit. Tout le reste passe : les retours à la ligne, les tirets, et
 * l'indentation à l'intérieur du texte. La promesse tenue est celle-là, et
 * rétablir la première ligne coûterait une migration pour un cas que personne
 * n'a signalé.
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
 * Le reste est laissé intact : les sauts de ligne simples et l'indentation sont
 * conservés à l'affichage par `whitespace-pre-wrap`, pas reconstruits ici. Une
 * ligne vide vaut donc un vrai changement de paragraphe (avec le rythme
 * vertical qui va avec), et un saut de ligne simple vaut un retour à la ligne,
 * ce qui est précisément ce qu'on lit dans le champ de saisie.
 *
 * ⚠️ LA SÉPARATION SE RÉPÈTE : `\n(?:[ \t]*\n)+` et non `\n[ \t]*\n+`. Le
 * second ne tolère des espaces que sur UNE ligne de séparation — après le
 * premier `\n[ \t]*\n`, le `+` ne peut plus avaler que des sauts de ligne nus.
 * Deux lignes « vides » portant chacune une espace laissaient donc le bloc
 * suivant commencer par une ligne blanche, que `whitespace-pre-wrap` peint en
 * plus de l'écart entre paragraphes : un trou de deux fois la hauteur, causé
 * par des espaces invisibles dans le champ de saisie.
 *
 * Ne pas céder à `(?:\n[ \t]*){2,}`, qui semble équivalent : sa dernière
 * itération mange les espaces de tête de la ligne suivante, et supprime donc
 * l'indentation qui est désormais du contenu.
 */
function paragraphs(content: string): string[] {
  return content
    .replace(/\r\n?/g, "\n")
    .split(/\n(?:[ \t]*\n)+/)
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
