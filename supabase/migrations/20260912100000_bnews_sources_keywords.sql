-- Fil d'actualités multi-sources (Boursenews, Le Boursier — Medias24,
-- AlphaBourse) et mots-clés intelligents.
--
-- Deux colonnes rejoignent `news_items` : `source` (d'où vient l'article) et
-- `keywords` (≤6 ids « c:<TICKER> » société cotée ou « t:<theme> », calculés
-- par le client au moment du moissonnage). L'index GIN sert la page
-- « par mot-clé » (`keywords @> ARRAY[kw]`).
--
-- Même doctrine que `20260912090000_boursenews_feed.sql` : partage des droits
-- tenu par la base, écritures uniquement via fonctions SECURITY DEFINER à
-- validation stricte, et JAMAIS de réécriture de body_fr ni des traductions
-- par l'upsert du fil. `bnews_keywords_set` est la porte de rattrapage pour
-- les lignes déjà en cache avant l'arrivée des mots-clés.

-- ------------------------------------------------------------------ colonnes

ALTER TABLE public.news_items ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'boursenews';
ALTER TABLE public.news_items ADD COLUMN IF NOT EXISTS keywords text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS news_items_keywords_idx
  ON public.news_items USING gin(keywords);

-- ------------------------------------------- bnews_keywords_validate (privé)

-- Revalide une liste de mots-clés : 6 au maximum, chacun de la forme
-- « c:<TICKER> » ou « t:<theme> ». Renvoie la liste telle quelle ; toute
-- dérive fait échouer l'appelant — un mot-clé libre deviendrait un tag
-- sauvage que l'interface ne sait ni libeller ni filtrer.
CREATE OR REPLACE FUNCTION public.bnews_keywords_validate(p_keywords text[])
RETURNS text[]
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  kw text;
BEGIN
  IF p_keywords IS NULL THEN
    RETURN '{}';
  END IF;
  IF array_length(p_keywords, 1) > 6 THEN
    RAISE EXCEPTION 'trop de mots-clés : 6 au maximum' USING ERRCODE = '22023';
  END IF;
  FOREACH kw IN ARRAY p_keywords LOOP
    IF kw !~ '^[ct]:[A-Za-z0-9+-]{2,40}$' THEN
      RAISE EXCEPTION 'mot-clé invalide : %', kw USING ERRCODE = '22023';
    END IF;
  END LOOP;
  RETURN p_keywords;
END; $$;

-- Fonction interne : personne ne l'appelle directement.
REVOKE EXECUTE ON FUNCTION public.bnews_keywords_validate(text[]) FROM PUBLIC, anon, authenticated;

-- -------------------------------------------------------- bnews_items_upsert

-- Alimente le cache depuis le fil moissonné, toutes sources confondues.
-- Extensions par rapport à la version Boursenews-seul :
--   - `source` ∈ ('boursenews','leboursier','alphabourse') ;
--   - le guid accepte les préfixes « alphabourse:… » et « leboursier:… » ;
--   - l'URL doit pointer sur l'un des trois hôtes sources (www. admis) ;
--   - `keywords`, déjà calculés côté client, sont revalidés ici ;
--   - ON CONFLICT met aussi à jour source et keywords (jamais body_fr ni les
--     traductions : le fil ne connaît que la carte).
CREATE OR REPLACE FUNCTION public.bnews_items_upsert(p_items jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item        jsonb;
  v_guid      text;
  v_source    text;
  v_category  text;
  v_url       text;
  v_title     text;
  v_excerpt   text;
  v_image     text;
  v_published timestamptz;
  v_keywords  text[];
BEGIN
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'une liste d''articles est attendue' USING ERRCODE = '22023';
  END IF;
  -- Le fil plafonne à 45 articles (3 sources fusionnées) ; la borne épouse
  -- le fil sans ouvrir la porte à un dépôt massif.
  IF jsonb_array_length(p_items) > 45 THEN
    RAISE EXCEPTION 'trop d''articles : 45 au maximum' USING ERRCODE = '22023';
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_guid := btrim(COALESCE(item ->> 'guid', ''));
    IF v_guid !~ '^[a-z0-9:._-]{3,170}$' THEN
      RAISE EXCEPTION 'guid invalide : %', v_guid USING ERRCODE = '22023';
    END IF;

    v_source := COALESCE(item ->> 'source', 'boursenews');
    IF v_source NOT IN ('boursenews', 'leboursier', 'alphabourse') THEN
      RAISE EXCEPTION 'source invalide : %', v_source USING ERRCODE = '22023';
    END IF;

    v_category := item ->> 'category';
    IF v_category NOT IN (
      'marches', 'actualite', 'decryptage',            -- boursenews
      'actualite-et-flux', 'actualite-macro', 'gouvernance-cotee', -- alphabourse
      'leboursier'                                     -- medias24
    ) THEN
      RAISE EXCEPTION 'catégorie invalide : %', v_category USING ERRCODE = '22023';
    END IF;

    -- L'URL doit pointer sur un article d'un des trois sites sources : c'est
    -- elle qui sera proposée en « Source » et moissonnée pour le corps, elle
    -- ne doit mener nulle part ailleurs.
    v_url := btrim(COALESCE(item ->> 'url', ''));
    IF v_url !~* '^https?://(www\.)?(boursenews\.ma|medias24\.com|alphabourse\.ma)/' THEN
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

    -- Mots-clés absents (vieux client) : liste vide, le rattrapage les
    -- calculera via bnews_keywords_set.
    IF jsonb_typeof(item -> 'keywords') = 'array' THEN
      v_keywords := ARRAY(SELECT jsonb_array_elements_text(item -> 'keywords'));
    ELSE
      v_keywords := '{}';
    END IF;
    v_keywords := public.bnews_keywords_validate(v_keywords);

    -- ⚠️ JAMAIS body_fr ni les colonnes de traduction dans le DO UPDATE : le
    -- fil ne connaît que la carte, et écraserait un corps ou une traduction
    -- déjà remplis par du vide.
    INSERT INTO public.news_items
      (guid, source, category, url, title_fr, excerpt_fr, image_url, published_at, keywords)
    VALUES
      (v_guid, v_source, v_category, v_url, v_title, v_excerpt, v_image, v_published, v_keywords)
    ON CONFLICT (guid) DO UPDATE SET
      title_fr     = EXCLUDED.title_fr,
      excerpt_fr   = EXCLUDED.excerpt_fr,
      image_url    = EXCLUDED.image_url,
      published_at = EXCLUDED.published_at,
      source       = EXCLUDED.source,
      category     = EXCLUDED.category,
      url          = EXCLUDED.url,
      keywords     = EXCLUDED.keywords,
      fetched_at   = now();
  END LOOP;
END; $$;

REVOKE EXECUTE ON FUNCTION public.bnews_items_upsert(jsonb) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.bnews_items_upsert(jsonb) TO authenticated;

-- ------------------------------------------------------ bnews_keywords_set

-- Pose les mots-clés d'un article déjà en cache (rattrapage des lignes
-- écrites avant l'arrivée des mots-clés, dont la liste est restée vide).
-- Ouverte à tout membre connecté, comme l'upsert : les ids sont revalidés et
-- l'article doit exister.
CREATE OR REPLACE FUNCTION public.bnews_keywords_set(p_guid text, p_keywords text[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF btrim(COALESCE(p_guid, '')) !~ '^[a-z0-9:._-]{3,170}$' THEN
    RAISE EXCEPTION 'guid invalide : %', p_guid USING ERRCODE = '22023';
  END IF;

  UPDATE public.news_items
  SET keywords = public.bnews_keywords_validate(p_keywords)
  WHERE guid = p_guid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'article introuvable' USING ERRCODE = '22023';
  END IF;
END; $$;

REVOKE EXECUTE ON FUNCTION public.bnews_keywords_set(text, text[]) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.bnews_keywords_set(text, text[]) TO authenticated;
