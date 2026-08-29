-- Deux corrections : le classement qui ne bougeait plus, et la date d'une
-- actualité qui ne pouvait pas être choisie.

-- ======================================================================
-- 1. Le cours du jour se met à jour pendant la séance
-- ======================================================================
--
-- CE QUI N'ALLAIT PAS
--
-- `record_daily_quotes` faisait `ON CONFLICT DO NOTHING` : la première
-- écriture de la journée fixait le cours, et plus rien ne le touchait. Le
-- classement valorise les positions à la dernière clôture connue de
-- `stock_quotes_daily`, donc il restait figé sur le cours de 9h31 quoi qu'il
-- arrive ensuite. C'est le « l'actualisation ne marche pas » constaté sur la
-- page Classement : seuls les mouvements d'espèces bougeaient, jamais la
-- valorisation des titres.
--
-- CE QUI LE REMPLACE
--
-- La ligne du jour est mise à jour à chaque passage. Le nom « clôture » reste
-- juste : la dernière valeur reçue avant la fin de la séance EST la clôture,
-- puisque plus aucune cotation n'arrive après. Entre-temps, c'est le dernier
-- cours connu, ce qui est exactement ce qu'un classement doit valoriser.
--
-- Les jours passés ne sont jamais touchés : la mise à jour ne porte que sur la
-- date du jour, l'historique déjà constitué est donc intact.
--
-- ⚠️ Contrepartie assumée, à lire avec HANDOFF §10. Les cours viennent du
-- navigateur, comme les ordres. Avant, un compte malveillant pouvait déposer un
-- cours fantaisiste une fois par jour ; il peut maintenant le faire à tout
-- moment. Le modèle de menace ne change pas de nature, seulement de fenêtre, et
-- il se referme le jour où l'écriture passe côté serveur.

CREATE OR REPLACE FUNCTION public.record_daily_quotes(quotes jsonb)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today   date;
  written int;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;

  IF jsonb_typeof(quotes) <> 'array' THEN
    RAISE EXCEPTION 'quotes must be a JSON array' USING ERRCODE = '22023';
  END IF;

  IF jsonb_array_length(quotes) > 300 THEN
    RAISE EXCEPTION 'too many quotes' USING ERRCODE = '22023';
  END IF;

  -- La séance se lit à l'heure de Casablanca. Utiliser la date UTC ferait
  -- basculer la clôture sur le lendemain entre 23h et minuit en hiver.
  today := (now() AT TIME ZONE 'Africa/Casablanca')::date;

  WITH incoming AS (
    SELECT
      upper(btrim(q.ticker))    AS ticker,
      q.close::numeric          AS close,
      q.change_pct::numeric     AS change_pct
    FROM jsonb_to_recordset(quotes)
      AS q(ticker text, close numeric, change_pct numeric)
    WHERE q.ticker IS NOT NULL
      AND btrim(q.ticker) <> ''
      AND length(btrim(q.ticker)) <= 12
      AND q.close IS NOT NULL
      AND q.close > 0
  ),
  written_rows AS (
    INSERT INTO public.stock_quotes_daily (ticker, date, close, change_pct)
    SELECT ticker, today, close, change_pct FROM incoming
    ON CONFLICT (ticker, date) DO UPDATE
      SET close       = EXCLUDED.close,
          change_pct  = EXCLUDED.change_pct,
          recorded_at = now()
    -- Une écriture qui ne change rien n'est pas une écriture : sans ce filtre,
    -- chaque passage sur une page compterait 80 mises à jour même hors séance.
    WHERE public.stock_quotes_daily.close IS DISTINCT FROM EXCLUDED.close
    RETURNING 1
  )
  SELECT count(*)::int INTO written FROM written_rows;

  RETURN written;
END; $$;

REVOKE EXECUTE ON FUNCTION public.record_daily_quotes(jsonb) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.record_daily_quotes(jsonb) TO authenticated;

-- ======================================================================
-- 2. La date de publication d'une actualité se choisit
-- ======================================================================
--
-- `published_at` existait déjà et valait toujours `now()`. Le formulaire
-- d'administration porte désormais un champ Date, donc les deux RPC prennent
-- une date facultative : absente, la publication est datée de maintenant à la
-- création et garde sa date à la modification.
--
-- Les anciennes signatures sont supprimées explicitement. Ajouter un paramètre
-- à `CREATE OR REPLACE FUNCTION` créerait une SURCHARGE et non un remplacement,
-- et PostgREST se retrouverait devant deux candidats pour le même appel.

DROP FUNCTION IF EXISTS public.news_create(text, text, text);
DROP FUNCTION IF EXISTS public.news_update(uuid, text, text, text);

CREATE OR REPLACE FUNCTION public.news_create(
  p_title        text,
  p_body         text,
  p_image_url    text        DEFAULT NULL,
  p_published_at timestamptz DEFAULT NULL
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

  INSERT INTO public.news_posts (title, body, image_url, published_at, author_id)
  VALUES (
    public.news_clean_text(p_title, 'Le titre', 200),
    public.news_clean_text(p_body, 'Le texte', 20000),
    public.news_clean_image(p_image_url),
    COALESCE(p_published_at, now()),
    auth.uid()
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END; $$;

REVOKE EXECUTE ON FUNCTION public.news_create(text, text, text, timestamptz) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.news_create(text, text, text, timestamptz) TO authenticated;

CREATE OR REPLACE FUNCTION public.news_update(
  p_id           uuid,
  p_title        text,
  p_body         text,
  p_image_url    text        DEFAULT NULL,
  p_published_at timestamptz DEFAULT NULL
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
  SET title        = public.news_clean_text(p_title, 'Le titre', 200),
      body         = public.news_clean_text(p_body, 'Le texte', 20000),
      image_url    = public.news_clean_image(p_image_url),
      published_at = COALESCE(p_published_at, published_at)
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'actualité introuvable' USING ERRCODE = '22023';
  END IF;
END; $$;

REVOKE EXECUTE ON FUNCTION public.news_update(uuid, text, text, text, timestamptz) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.news_update(uuid, text, text, text, timestamptz) TO authenticated;
