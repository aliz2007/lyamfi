import { supabase } from "@/integrations/supabase/client";

/**
 * Profil de l'utilisateur connecté.
 *
 * `display_name` est recomposé côté base par un trigger à partir du prénom et
 * du nom, donc le client n'a jamais à le construire lui-même : il écrit
 * `first_name` / `last_name`, la base s'occupe du reste (nom en majuscules).
 *
 * Le fichier de types généré ne connaît pas les colonnes ajoutées par
 * migration, d'où le cast local, isolé ici comme pour `@/lib/rpc`.
 */

export type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
};

type ProfileTable = {
  select: (cols: string) => {
    eq: (
      col: string,
      val: string,
    ) => {
      maybeSingle: () => Promise<{ data: Profile | null; error: { message: string } | null }>;
    };
  };
  update: (values: Record<string, unknown>) => {
    eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
  };
};

const profiles = () => supabase.from("profiles" as never) as unknown as ProfileTable;

export const myProfileQuery = {
  queryKey: ["my-profile"],
  queryFn: async (): Promise<Profile | null> => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return null;
    const { data } = await profiles()
      .select("id, first_name, last_name, display_name")
      .eq("id", uid)
      .maybeSingle();
    return data ?? null;
  },
  staleTime: 60_000,
};

export async function updateMyProfile(firstName: string, lastName: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("not authenticated");
  const { error } = await profiles()
    .update({ first_name: firstName, last_name: lastName })
    .eq("id", uid);
  if (error) throw new Error(error.message);
}

/**
 * Prénom à afficher, avec repli successif : prénom, nom affiché, partie
 * locale de l'e-mail. Le repli e-mail garde son intérêt pour les comptes
 * créés avant l'ajout du prénom.
 */
export function greetingName(
  profile: Profile | null | undefined,
  email: string | null | undefined,
): string | null {
  const first = profile?.first_name?.trim();
  if (first) return first;
  const display = profile?.display_name?.trim();
  if (display) return display.split(" ")[0] ?? display;
  const local = email?.split("@")[0]?.trim();
  return local || null;
}

/** Nom complet « Prénom NOM », replié sur ce qui est disponible. */
export function fullName(
  profile: Pick<Profile, "first_name" | "last_name" | "display_name"> | null | undefined,
  email?: string | null,
): string {
  const parts = [profile?.first_name?.trim(), profile?.last_name?.trim()].filter(Boolean);
  if (parts.length) return parts.join(" ");
  const display = profile?.display_name?.trim();
  if (display) return display;
  return email?.split("@")[0] ?? "";
}
