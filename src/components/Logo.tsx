/**
 * Marque Lyamfi.
 *
 * Le fichier vit dans `public/`, servi à la racine du site par le binding
 * ASSETS du Worker. L'ancien logo pointait vers un asset hébergé par
 * Lovable (`/__l5e/assets-v1/…`) et renvoyait un 404 hors de cette
 * infrastructure : tout est désormais servi depuis notre propre domaine.
 */
export function Logo({
  className = "",
  /**
   * Version resserrée pour l'en-tête public sur téléphone, où la marque
   * partage 390 px avec le choix de la langue et deux boutons. Le mot-symbole
   * reste lisible, il rétrécit d'un cran ; il reprend sa taille dès `sm`.
   */
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={`flex items-center ${compact ? "gap-2 sm:gap-2.5" : "gap-2.5"} ${className}`}>
      <img
        src="/logo.png"
        alt=""
        width={36}
        height={36}
        className={`shrink-0 rounded-lg object-contain ${
          compact ? "h-8 w-8 sm:h-9 sm:w-9" : "h-9 w-9"
        }`}
      />
      <span
        className={`truncate font-semibold tracking-tight ${
          compact ? "text-base sm:text-lg" : "text-lg"
        }`}
      >
        Lyamfi
      </span>
    </span>
  );
}
