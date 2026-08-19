/**
 * Marque Lyamfi.
 *
 * Le fichier vit dans `public/`, servi à la racine du site par le binding
 * ASSETS du Worker. L'ancien logo pointait vers un asset hébergé par
 * Lovable (`/__l5e/assets-v1/…`) et renvoyait un 404 hors de cette
 * infrastructure : tout est désormais servi depuis notre propre domaine.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <img
        src="/logo.png"
        alt=""
        width={36}
        height={36}
        className="h-9 w-9 shrink-0 rounded-lg object-contain"
      />
      <span className="text-lg font-semibold tracking-tight">Lyamfi</span>
    </span>
  );
}
