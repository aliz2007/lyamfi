-- Fil d'actualités Boursenews : le site source est moissonné côté serveur, le
-- résultat est mis en cache en base, et un administrateur peut y adjoindre un
-- commentaire de rédaction (« l'œil de Lyamfi »).
--
-- Le partage des droits est tenu par la BASE, pas par l'interface. Les comptes
-- connectés ne reçoivent que le SELECT ; toute écriture passe par les six
-- fonctions SECURITY DEFINER ci-dessous. L'alimentation du cache (articles,
-- corps, traductions automatiques) est ouverte à tout membre connecté : elle
-- n'écrit que du contenu relu par validation stricte (guid, URL du domaine
-- source, bornes de longueur), et les traductions ne s'écrivent que dans les
-- colonnes encore vides — premier arrivé gagne, personne ne réécrit le texte
-- d'un autre. Le commentaire de rédaction, lui, est une parole signée Lyamfi :
-- il exige is_admin().
--
-- ⚠️ On repart de zéro avec REVOKE ALL, on n'énumère pas ce qu'il faut
-- retirer : un projet Supabase pose `ALTER DEFAULT PRIVILEGES IN SCHEMA public
-- GRANT ALL ON TABLES TO anon, authenticated`, donc la table naît avec TOUT
-- accordé. Retirer nommément INSERT, UPDATE et DELETE laisserait derrière
-- TRUNCATE, REFERENCES et TRIGGER, qu'aucune politique RLS ne couvre.

-- ------------------------------------------------------------------- tables

-- Un article du fil Boursenews. La clé est le slug de l'URL source : stable,
-- unique, et directement reconstituable depuis le fil.
--
-- Le corps et les traductions sont remplis à la demande (corps à l'ouverture
-- de l'article, traduction à la première lecture dans la langue), jamais par
-- l'upsert du fil : une carte de liste ne transporte que titre et extrait, et
-- ON CONFLICT ne doit JAMAIS écraser un corps ou une traduction déjà posés.
CREATE TABLE IF NOT EXISTS public.news_items (
  guid         text PRIMARY KEY,            -- slug boursenews
  category     text NOT NULL,               -- marches | actualite | decryptage
  url          text NOT NULL,
  title_fr     text NOT NULL,
  excerpt_fr   text NOT NULL DEFAULT '',
  body_fr      text,
  image_url    text,
  published_at timestamptz,
  title_en     text,
  excerpt_en   text,
  body_en      text,
  title_ar     text,
  excerpt_ar   text,
  body_ar      text,
  fetched_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS news_items_published_idx
  ON public.news_items (published_at DESC);

-- Le commentaire de rédaction adossé à un article. Un seul par article (la
-- clé est le guid), rédigé dans UNE langue (`lang`) puis traduit
-- automatiquement dans les deux autres ; toute retouche invalide les
-- traductions, qui seront refaites à la prochaine sauvegarde.
CREATE TABLE IF NOT EXISTS public.news_insights (
  news_item_guid text PRIMARY KEY REFERENCES public.news_items(guid) ON DELETE CASCADE,
  body           text NOT NULL,
  lang           text NOT NULL DEFAULT 'fr',   -- langue de rédaction de l'admin
  body_en        text,
  body_ar        text,
  author_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Lecture seule pour les membres, et rien d'autre.
REVOKE ALL ON public.news_items FROM authenticated, anon;
GRANT SELECT ON public.news_items TO authenticated;
GRANT ALL    ON public.news_items TO service_role;

REVOKE ALL ON public.news_insights FROM authenticated, anon;
GRANT SELECT ON public.news_insights TO authenticated;
GRANT ALL    ON public.news_insights TO service_role;

ALTER TABLE public.news_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "news feed readable by members" ON public.news_items;
CREATE POLICY "news feed readable by members" ON public.news_items
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "news insights readable by members" ON public.news_insights;
CREATE POLICY "news insights readable by members" ON public.news_insights
FOR SELECT TO authenticated USING (true);

DROP TRIGGER IF EXISTS update_news_insights_updated_at ON public.news_insights;
CREATE TRIGGER update_news_insights_updated_at
BEFORE UPDATE ON public.news_insights
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -------------------------------------------------------- bnews_items_upsert

-- Alimente le cache depuis le fil moissonné. Ouverte à tout membre connecté :
-- le moissonnage a lieu dans le navigateur du premier lecteur venu, et chaque
-- élément est validé pièce par pièce avant d'être écrit. Un guid, une
-- catégorie ou une URL qui sortent du cadre font échouer tout le lot : un fil
-- partiellement invalide est un fil altéré, pas un fil à trier soi-même.
CREATE OR REPLACE FUNCTION public.bnews_items_upsert(p_items jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item        jsonb;
  v_guid      text;
  v_category  text;
  v_url       text;
  v_title     text;
  v_excerpt   text;
  v_image     text;
  v_published timestamptz;
BEGIN
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'une liste d''articles est attendue' USING ERRCODE = '22023';
  END IF;
  -- Le fil fusionne ≤15 articles de 3 catégories ; 25 laisse de la marge sans
  -- ouvrir la porte à un dépôt massif.
  IF jsonb_array_length(p_items) > 25 THEN
    RAISE EXCEPTION 'trop d''articles : 25 au maximum' USING ERRCODE = '22023';
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_guid := btrim(COALESCE(item ->> 'guid', ''));
    IF v_guid !~ '^[a-z0-9-]{3,150}$' THEN
      RAISE EXCEPTION 'guid invalide : %', v_guid USING ERRCODE = '22023';
    END IF;

    v_category := item ->> 'category';
    IF v_category NOT IN ('marches', 'actualite', 'decryptage') THEN
      RAISE EXCEPTION 'catégorie invalide : %', v_category USING ERRCODE = '22023';
    END IF;

    -- L'URL doit pointer sur un article du site source : c'est elle qui sera
    -- proposée en « Source » et moissonnée pour le corps, elle ne doit mener
    -- nulle part ailleurs.
    v_url := btrim(COALESCE(item ->> 'url', ''));
    IF v_url !~* '^https?://(www\.)?boursenews\.ma/article/' THEN
      RAISE EXCEPTION 'URL invalide : %', v_url USING ERRCODE = '22023';
    END IF;

    v_title   := public.news_clean_text(item ->> 'title', 'Le titre', 300);

    -- L'extrait peut être vide (certaines cartes n'en portent pas) ; il est
    -- donc validé à la main plutôt que par news_clean_text, qui refuse le vide.
    v_excerpt := btrim(COALESCE(item ->> 'excerpt', ''));
    IF length(v_excerpt) > 2000 THEN
      RAISE EXCEPTION 'L''extrait dépasse 2000 caractères' USING ERRCODE = '22023';
    END IF;

    v_image := public.news_clean_image(item ->> 'image_url');

    -- Date absente ou illisible : NULL, jamais d'erreur — une carte sans date
    -- reste un article publiable, rangé en fin de fil côté client.
    v_published := NULL;
    IF btrim(COALESCE(item ->> 'published_at', '')) <> '' THEN
      v_published := (item ->> 'published_at')::timestamptz;
    END IF;

    -- ⚠️ JAMAIS body_fr ni les colonnes de traduction dans le DO UPDATE : le
    -- fil ne connaît que la carte, et écraserait un corps ou une traduction
    -- déjà remplis par du vide.
    INSERT INTO public.news_items
      (guid, category, url, title_fr, excerpt_fr, image_url, published_at)
    VALUES
      (v_guid, v_category, v_url, v_title, v_excerpt, v_image, v_published)
    ON CONFLICT (guid) DO UPDATE SET
      title_fr     = EXCLUDED.title_fr,
      excerpt_fr   = EXCLUDED.excerpt_fr,
      image_url    = EXCLUDED.image_url,
      published_at = EXCLUDED.published_at,
      category     = EXCLUDED.category,
      url          = EXCLUDED.url,
      fetched_at   = now();
  END LOOP;
END; $$;

REVOKE EXECUTE ON FUNCTION public.bnews_items_upsert(jsonb) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.bnews_items_upsert(jsonb) TO authenticated;

-- ------------------------------------------------------------ bnews_body_set

-- Pose le corps français d'un article, moissonné à sa première ouverture.
-- Écriture unique en pratique : le client n'appelle que si body_fr est NULL.
CREATE OR REPLACE FUNCTION public.bnews_body_set(p_guid text, p_body text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.news_items
  SET body_fr = public.news_clean_text(p_body, 'Le corps', 30000)
  WHERE guid = p_guid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'article introuvable' USING ERRCODE = '22023';
  END IF;
END; $$;

REVOKE EXECUTE ON FUNCTION public.bnews_body_set(text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.bnews_body_set(text, text) TO authenticated;

-- ---------------------------------------------------- bnews_translation_set

-- Pose la traduction automatique d'un article dans UNE langue. Premier arrivé
-- gagne : seules les colonnes encore NULL sont écrites, pour qu'aucun membre
-- ne puisse réécrire la traduction déjà posée (y compris par un autre).
CREATE OR REPLACE FUNCTION public.bnews_translation_set(
  p_guid    text,
  p_lang    text,
  p_title   text,
  p_excerpt text,
  p_body    text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title   text := public.news_clean_text(p_title, 'Le titre', 300);
  v_excerpt text := btrim(COALESCE(p_excerpt, ''));
  v_body    text;
BEGIN
  IF p_lang NOT IN ('en', 'ar') THEN
    RAISE EXCEPTION 'langue invalide : %', p_lang USING ERRCODE = '22023';
  END IF;
  IF length(v_excerpt) > 2000 THEN
    RAISE EXCEPTION 'L''extrait dépasse 2000 caractères' USING ERRCODE = '22023';
  END IF;
  IF p_body IS NOT NULL THEN
    v_body := public.news_clean_text(p_body, 'Le corps', 30000);
  END IF;

  IF p_lang = 'en' THEN
    UPDATE public.news_items
    SET title_en   = COALESCE(title_en, v_title),
        excerpt_en = COALESCE(excerpt_en, v_excerpt),
        body_en    = CASE WHEN p_body IS NOT NULL THEN COALESCE(body_en, v_body)
                          ELSE body_en END
    WHERE guid = p_guid;
  ELSE
    UPDATE public.news_items
    SET title_ar   = COALESCE(title_ar, v_title),
        excerpt_ar = COALESCE(excerpt_ar, v_excerpt),
        body_ar    = CASE WHEN p_body IS NOT NULL THEN COALESCE(body_ar, v_body)
                          ELSE body_ar END
    WHERE guid = p_guid;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'article introuvable' USING ERRCODE = '22023';
  END IF;
END; $$;

REVOKE EXECUTE ON FUNCTION public.bnews_translation_set(text, text, text, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.bnews_translation_set(text, text, text, text, text) TO authenticated;

-- ------------------------------------------------------ bnews_insight_upsert

-- Rédige ou retouche le commentaire de rédaction. Parole signée Lyamfi :
-- réservée aux administrateurs. Toute retouche invalide les traductions
-- (body_en / body_ar repartent à NULL), qui seront refaites juste après par le
-- client ; les garder donnerait une traduction d'un texte qui n'existe plus.
CREATE OR REPLACE FUNCTION public.bnews_insight_upsert(
  p_guid text,
  p_body text,
  p_lang text
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
  IF p_lang NOT IN ('fr', 'en', 'ar') THEN
    RAISE EXCEPTION 'langue invalide : %', p_lang USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.news_insights (news_item_guid, body, lang, author_id)
  VALUES (p_guid, public.news_clean_text(p_body, 'Le commentaire', 5000), p_lang, auth.uid())
  ON CONFLICT (news_item_guid) DO UPDATE SET
    body      = EXCLUDED.body,
    lang      = EXCLUDED.lang,
    author_id = EXCLUDED.author_id,
    body_en   = NULL,
    body_ar   = NULL;
END; $$;

REVOKE EXECUTE ON FUNCTION public.bnews_insight_upsert(text, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.bnews_insight_upsert(text, text, text) TO authenticated;

-- -------------------------------------------- bnews_insight_translation_set

-- Pose la traduction du commentaire dans UNE langue, juste après sa rédaction.
CREATE OR REPLACE FUNCTION public.bnews_insight_translation_set(
  p_guid text,
  p_lang text,
  p_body text
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
  IF p_lang NOT IN ('en', 'ar') THEN
    RAISE EXCEPTION 'langue invalide : %', p_lang USING ERRCODE = '22023';
  END IF;

  IF p_lang = 'en' THEN
    UPDATE public.news_insights
    SET body_en = public.news_clean_text(p_body, 'Le commentaire', 5000)
    WHERE news_item_guid = p_guid;
  ELSE
    UPDATE public.news_insights
    SET body_ar = public.news_clean_text(p_body, 'Le commentaire', 5000)
    WHERE news_item_guid = p_guid;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'commentaire introuvable' USING ERRCODE = '22023';
  END IF;
END; $$;

REVOKE EXECUTE ON FUNCTION public.bnews_insight_translation_set(text, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.bnews_insight_translation_set(text, text, text) TO authenticated;

-- ------------------------------------------------------ bnews_insight_delete

CREATE OR REPLACE FUNCTION public.bnews_insight_delete(p_guid text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.news_insights WHERE news_item_guid = p_guid;
END; $$;

REVOKE EXECUTE ON FUNCTION public.bnews_insight_delete(text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.bnews_insight_delete(text) TO authenticated;
