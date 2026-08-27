-- Actualités boursières : un flux lisible par tous les membres, écrit par les
-- seuls administrateurs.
--
-- Le partage des droits est tenu par la BASE, pas par l'interface. Les comptes
-- connectés ne reçoivent que le SELECT ; INSERT, UPDATE et DELETE ne leur sont
-- jamais accordés. Publier, corriger ou retirer un article passe donc
-- obligatoirement par les trois fonctions SECURITY DEFINER ci-dessous, qui
-- rouvrent le contrôle avec is_admin(). Masquer les boutons côté client reste
-- cosmétique, exactement comme pour l'espace d'administration.
--
-- Les deux niveaux d'administrateur ne sont pas distingués ici : publier une
-- actualité est une tâche de rédaction, pas une opération sensible sur un
-- compte. Un administrateur secondaire peut donc écrire.

-- ------------------------------------------------------------------- table

CREATE TABLE IF NOT EXISTS public.news_posts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  body         text NOT NULL,
  -- Illustration : une URL publique, saisie à la main ou renvoyée par le
  -- dépôt de fichier. Nullable, une actualité sans image reste valable.
  image_url    text,
  published_at timestamptz NOT NULL DEFAULT now(),
  author_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS news_posts_published_idx
  ON public.news_posts (published_at DESC);

-- Lecture seule pour les membres. Aucune écriture directe n'est accordée : le
-- REVOKE est explicite pour que le retrait reste vrai même si un GRANT plus
-- large a été passé à la main sur la base.
GRANT SELECT ON public.news_posts TO authenticated;
GRANT ALL    ON public.news_posts TO service_role;
REVOKE INSERT, UPDATE, DELETE ON public.news_posts FROM authenticated, anon;

ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "news readable by members" ON public.news_posts;
CREATE POLICY "news readable by members" ON public.news_posts
FOR SELECT TO authenticated USING (true);

DROP TRIGGER IF EXISTS update_news_posts_updated_at ON public.news_posts;
CREATE TRIGGER update_news_posts_updated_at
BEFORE UPDATE ON public.news_posts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------- validation

-- Normalise un champ texte et refuse le vide. Les bornes hautes évitent qu'un
-- copier-coller malheureux dépose un mégaoctet de prose dans le flux.
CREATE OR REPLACE FUNCTION public.news_clean_text(value text, field text, max_len int)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  cleaned text := btrim(COALESCE(value, ''));
BEGIN
  IF cleaned = '' THEN
    RAISE EXCEPTION '% est obligatoire', field USING ERRCODE = '22023';
  END IF;
  IF length(cleaned) > max_len THEN
    RAISE EXCEPTION '% dépasse % caractères', field, max_len USING ERRCODE = '22023';
  END IF;
  RETURN cleaned;
END; $$;

REVOKE EXECUTE ON FUNCTION public.news_clean_text(text, text, int) FROM PUBLIC, anon, authenticated;

-- Une illustration est une URL http(s) ou rien du tout. Le champ vide vaut
-- « pas d'image » plutôt qu'une chaîne vide qui casserait le <img> côté client.
CREATE OR REPLACE FUNCTION public.news_clean_image(value text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  cleaned text := btrim(COALESCE(value, ''));
BEGIN
  IF cleaned = '' THEN
    RETURN NULL;
  END IF;
  IF length(cleaned) > 2000 THEN
    RAISE EXCEPTION 'URL d''image trop longue' USING ERRCODE = '22023';
  END IF;
  IF cleaned !~* '^https?://' THEN
    RAISE EXCEPTION 'URL d''image invalide : elle doit commencer par http:// ou https://'
      USING ERRCODE = '22023';
  END IF;
  RETURN cleaned;
END; $$;

REVOKE EXECUTE ON FUNCTION public.news_clean_image(text) FROM PUBLIC, anon, authenticated;

-- ------------------------------------------------------------ news_create

CREATE OR REPLACE FUNCTION public.news_create(
  p_title     text,
  p_body      text,
  p_image_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.news_posts (title, body, image_url, author_id)
  VALUES (
    public.news_clean_text(p_title, 'Le titre', 200),
    public.news_clean_text(p_body, 'Le texte', 20000),
    public.news_clean_image(p_image_url),
    auth.uid()
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END; $$;

REVOKE EXECUTE ON FUNCTION public.news_create(text, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.news_create(text, text, text) TO authenticated;

-- ------------------------------------------------------------ news_update

CREATE OR REPLACE FUNCTION public.news_update(
  p_id        uuid,
  p_title     text,
  p_body      text,
  p_image_url text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  UPDATE public.news_posts
  SET title     = public.news_clean_text(p_title, 'Le titre', 200),
      body      = public.news_clean_text(p_body, 'Le texte', 20000),
      image_url = public.news_clean_image(p_image_url)
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'actualité introuvable' USING ERRCODE = '22023';
  END IF;
END; $$;

REVOKE EXECUTE ON FUNCTION public.news_update(uuid, text, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.news_update(uuid, text, text, text) TO authenticated;

-- ------------------------------------------------------------ news_delete

CREATE OR REPLACE FUNCTION public.news_delete(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.news_posts WHERE id = p_id;
END; $$;

REVOKE EXECUTE ON FUNCTION public.news_delete(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.news_delete(uuid) TO authenticated;

-- ---------------------------------------------------- dépôt des illustrations

-- Bucket public « news » : l'article affiche l'image par son URL publique, donc
-- la lecture est anonyme par construction. Seul un administrateur peut y
-- déposer, remplacer ou retirer un fichier.
--
-- Tout est enveloppé dans un bloc à gestion d'erreur : `storage.objects`
-- appartient à `supabase_storage_admin`, et selon la façon dont ce script est
-- exécuté la création de politique peut être refusée. L'éditeur SQL joue le
-- fichier entier dans UNE transaction : sans ce filet, un refus ici annulerait
-- toute la migration. Le dépôt de fichier est un confort, l'URL saisie à la
-- main reste disponible dans tous les cas.
DO $storage$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('news', 'news', true)
  ON CONFLICT (id) DO UPDATE SET public = true;

  EXECUTE $p$DROP POLICY IF EXISTS "news images are public" ON storage.objects$p$;
  EXECUTE $p$CREATE POLICY "news images are public" ON storage.objects
            FOR SELECT USING (bucket_id = 'news')$p$;

  EXECUTE $p$DROP POLICY IF EXISTS "news images written by admins" ON storage.objects$p$;
  EXECUTE $p$CREATE POLICY "news images written by admins" ON storage.objects
            FOR INSERT TO authenticated
            WITH CHECK (bucket_id = 'news' AND public.is_admin())$p$;

  EXECUTE $p$DROP POLICY IF EXISTS "news images replaced by admins" ON storage.objects$p$;
  EXECUTE $p$CREATE POLICY "news images replaced by admins" ON storage.objects
            FOR UPDATE TO authenticated
            USING (bucket_id = 'news' AND public.is_admin())
            WITH CHECK (bucket_id = 'news' AND public.is_admin())$p$;

  EXECUTE $p$DROP POLICY IF EXISTS "news images removed by admins" ON storage.objects$p$;
  EXECUTE $p$CREATE POLICY "news images removed by admins" ON storage.objects
            FOR DELETE TO authenticated
            USING (bucket_id = 'news' AND public.is_admin())$p$;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Bucket « news » non configuré (%). Crée-le depuis Storage puis rejoue ce bloc ; en attendant, saisis les illustrations par URL.', SQLERRM;
END
$storage$;
