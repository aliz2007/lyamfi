import { supabase } from "@/integrations/supabase/client";
import { callRpc, explain } from "@/lib/rpc";

/**
 * Actualités boursières.
 *
 * Lecture pour tout membre connecté, écriture pour les seuls administrateurs.
 * Le partage est tenu par la BASE : `authenticated` ne dispose que du SELECT
 * sur `news_posts`, et publier, corriger ou retirer passe par trois RPC
 * SECURITY DEFINER qui revérifient `is_admin()`. Masquer les boutons dans
 * l'interface ne protège donc rien à soi seul, c'est un simple confort.
 *
 * ⚠️ `src/integrations/supabase/types.ts` est régénéré depuis la base et ne
 * connaît pas encore cette table : la lecture passe par le même cast isolé que
 * `lib/metrics.ts` et `lib/quotes.history.ts`. Éditer le fichier généré serait
 * perdu à la prochaine régénération.
 */

export type NewsPost = {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  publishedAt: string;
};

type NewsRow = {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  published_at: string;
};

type NewsTable = {
  select: (cols: string) => {
    order: (
      col: string,
      opts: { ascending: boolean },
    ) => Promise<{ data: NewsRow[] | null; error: { message: string } | null }>;
  };
};

const table = () => supabase.from("news_posts" as never) as unknown as NewsTable;

/** Le flux, du plus récent au plus ancien. */
export const newsQuery = {
  queryKey: ["news"],
  queryFn: async (): Promise<NewsPost[]> => {
    const { data, error } = await table()
      .select("id, title, body, image_url, published_at")
      .order("published_at", { ascending: false });
    // La table naît d'une migration : tant qu'elle n'a pas été jouée, l'erreur
    // brute de PostgREST ferait croire à une panne. `explain` la traduit en
    // « fonctionnalité pas encore activée », comme pour les RPC.
    if (error) throw new Error(explain(error.message));
    return (data ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      imageUrl: r.image_url,
      publishedAt: r.published_at,
    }));
  },
  staleTime: 60_000,
};

/**
 * Un article précis, pour la page de lecture.
 *
 * Servi depuis le flux plutôt que par une requête sur l'identifiant : le flux
 * est déjà en cache quand on clique une carte, donc l'article s'ouvre sans
 * aller-retour réseau. La clé commence par « news », donc invalider le flux
 * invalide aussi les articles ouverts.
 */
export const newsPostQuery = (id: string) => ({
  queryKey: ["news", id],
  queryFn: async (): Promise<NewsPost | null> => {
    const posts = await newsQuery.queryFn();
    return posts.find((p) => p.id === id) ?? null;
  },
  staleTime: 60_000,
});

/**
 * Brouillon d'article tel que le formulaire le manipule.
 *
 * `publishedAt` est une date au format `AAAA-MM-JJ`, celui qu'un
 * `<input type="date">` produit et relit sans conversion. Vide, la base date
 * la publication de maintenant à la création, et laisse la date en place à la
 * modification.
 */
export type NewsDraft = {
  title: string;
  body: string;
  imageUrl: string;
  publishedAt: string;
};

/** `AAAA-MM-JJ` vers un instant, midi UTC pour ne pas glisser de jour. */
const toTimestamp = (day: string): string | null =>
  /^\d{4}-\d{2}-\d{2}$/.test(day) ? new Date(`${day}T12:00:00Z`).toISOString() : null;

/** Instant vers `AAAA-MM-JJ`, pour repeupler le champ à la modification. */
export const toDayInput = (iso: string): string => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
};

export async function createNews(draft: NewsDraft): Promise<string> {
  return callRpc<string>("news_create", {
    p_title: draft.title,
    p_body: draft.body,
    p_image_url: draft.imageUrl,
    p_published_at: toTimestamp(draft.publishedAt),
  });
}

export async function updateNews(id: string, draft: NewsDraft): Promise<void> {
  await callRpc<void>("news_update", {
    p_id: id,
    p_title: draft.title,
    p_body: draft.body,
    p_image_url: draft.imageUrl,
    p_published_at: toTimestamp(draft.publishedAt),
  });
}

export async function deleteNews(id: string): Promise<void> {
  await callRpc<void>("news_delete", { p_id: id });
}

/** Dépôt des illustrations : bucket public, écriture réservée aux admins. */
export const NEWS_BUCKET = "news";

/** Ce qu'un navigateur affiche sans plugin, et que le bucket accepte. */
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

/** 5 Mo : au-delà, une illustration d'article pèse plus que la page entière. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export type UploadError = "type" | "size" | "bucket" | "denied" | "other";

export class NewsUploadError extends Error {
  constructor(readonly kind: UploadError) {
    super(kind);
    this.name = "NewsUploadError";
  }
}

/**
 * Envoie une image dans le bucket et renvoie son URL publique.
 *
 * Le bucket peut ne pas exister : il est créé par la migration, mais celle-ci
 * laisse passer un refus de privilège pour ne pas faire échouer tout le script
 * d'installation. L'erreur est donc typée, pour que l'écran propose la saisie
 * par URL plutôt que d'afficher un message Supabase brut.
 */
export async function uploadNewsImage(file: File): Promise<string> {
  if (!IMAGE_TYPES.includes(file.type)) throw new NewsUploadError("type");
  if (file.size > MAX_IMAGE_BYTES) throw new NewsUploadError("size");

  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${crypto.randomUUID()}.${ext || "jpg"}`;

  const { error } = await supabase.storage
    .from(NEWS_BUCKET)
    .upload(path, file, { cacheControl: "31536000", contentType: file.type, upsert: false });

  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes("not found") || m.includes("bucket")) throw new NewsUploadError("bucket");
    if (m.includes("policy") || m.includes("denied") || m.includes("unauthorized"))
      throw new NewsUploadError("denied");
    throw new NewsUploadError("other");
  }

  const { data } = supabase.storage.from(NEWS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
