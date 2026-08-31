import { useCallback, useEffect, useState } from "react";

/**
 * Les valeurs mises en favori, gardées dans le navigateur.
 *
 * POURQUOI LE NAVIGATEUR ET PAS SUPABASE
 *
 * Un favori n'engage rien : ni argent, ni progression, ni classement. Le
 * garder dans `localStorage` le rend instantané, sans aller-retour réseau au
 * moindre clic sur une étoile, et sans table ni politique RLS à maintenir. La
 * contrepartie assumée est qu'il ne suit pas l'utilisateur d'un appareil à
 * l'autre ; le jour où ce sera demandé, seul ce module changera, la page
 * Bourse ne connaissant que le hook.
 *
 * LA CONTRAINTE DU RENDU SERVEUR
 *
 * La page est rendue sur le serveur, où `localStorage` n'existe pas. L'état de
 * départ est donc vide des deux côtés, et la liste enregistrée n'est lue qu'au
 * premier effet : sans cela, le premier rendu client afficherait des étoiles
 * que le HTML du serveur n'a pas, et React signalerait une hydratation
 * divergente. L'écart dure un battement de rendu, invisible à l'œil.
 */

export const FAVOURITES_STORAGE_KEY = "lyamfi.favourites";

/**
 * Lit la liste enregistrée.
 *
 * Tout ce qui n'est pas un tableau de chaînes est ignoré : la clé est
 * modifiable à la main dans la console du navigateur, et une valeur bricolée
 * ne doit pas casser la page. Les codes sont normalisés en capitales, comme
 * partout ailleurs dans le produit, et dédoublonnés.
 */
export function readFavourites(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out = new Set<string>();
    for (const value of parsed) {
      if (typeof value !== "string") continue;
      const code = value.trim().toUpperCase();
      if (code) out.add(code);
    }
    return [...out];
  } catch {
    return [];
  }
}

function load(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return readFavourites(window.localStorage.getItem(FAVOURITES_STORAGE_KEY));
  } catch {
    // Navigation privée ou stockage bloqué : on continue sans favoris plutôt
    // que de faire tomber la page.
    return [];
  }
}

function save(codes: string[]): void {
  try {
    window.localStorage.setItem(FAVOURITES_STORAGE_KEY, JSON.stringify(codes));
  } catch {
    // Quota atteint ou stockage refusé : le favori vit le temps de la session.
  }
}

export type Favourites = {
  /** Les codes en favori, tels qu'enregistrés. */
  codes: ReadonlySet<string>;
  /** Ajoute ou retire une valeur, et enregistre aussitôt. */
  toggle: (code: string) => void;
  /** Vrai une fois la liste enregistrée relue : avant, tout est vide. */
  ready: boolean;
};

export function useFavourites(): Favourites {
  const [codes, setCodes] = useState<ReadonlySet<string>>(() => new Set<string>());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCodes(new Set(load()));
    setReady(true);
  }, []);

  const toggle = useCallback((code: string) => {
    const key = code.toUpperCase();
    setCodes((current) => {
      const next = new Set(current);
      if (!next.delete(key)) next.add(key);
      save([...next]);
      return next;
    });
  }, []);

  return { codes, toggle, ready };
}
