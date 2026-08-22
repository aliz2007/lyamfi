import { useState } from "react";

/**
 * La chèvre dorée du premier du classement (« the GOAT »).
 *
 * Le fichier vit dans `public/golden-goat.png`. S'il manque, l'image se retire
 * d'elle-même plutôt que d'afficher l'icône de fichier cassé du navigateur :
 * le classement reste lisible même si l'illustration n'a pas encore été
 * déposée dans le dépôt.
 */
export function GoldenGoat({ className = "" }: { className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <img
      src="/golden-goat.png"
      alt=""
      width={20}
      height={20}
      onError={() => setFailed(true)}
      // `inline-block` avec un alignement vertical explicite : l'image se pose
      // sur la ligne de base du texte sans en décaler le rendu.
      className={`inline-block h-5 w-5 shrink-0 select-none object-contain align-[-0.28em] ${className}`}
    />
  );
}
