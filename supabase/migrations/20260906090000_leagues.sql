-- Ligues privées : des classements fermés, chacun avec son propre portefeuille.
--
-- CE QUE C'EST
--
-- Une ligue est un concours : un nom, une fenêtre de dates, un capital de
-- départ. On la rejoint, on reçoit un portefeuille neuf crédité de ce
-- capital-là, et on n'y passe d'ordre qu'entre les deux dates. Le classement
-- général de la plateforme ne bouge pas d'un pouce : la ligue a le sien, entre
-- ses seuls membres. C'est ce qui la rend utilisable pour un partenariat avec
-- un club universitaire ou un créateur, qui veut voir SES participants et pas
-- les dix mille autres.
--
-- L'ADHÉSION EST LE PORTEFEUILLE
--
-- Pas de table d'adhésion. Rejoindre une ligue, c'est recevoir un portefeuille
-- portant son `league_id` ; être membre, c'est en avoir un. Une table de plus
-- n'aurait rien dit de neuf et aurait ouvert la porte au cas où l'une des deux
-- existe sans l'autre — un membre sans portefeuille, un portefeuille sans
-- membre. L'index unique partiel plus bas fait le reste : un seul portefeuille
-- par ligue et par compte.
--
-- ⚠️ LE PIÈGE DE CETTE MIGRATION, ET IL EST PARTOUT
--
-- Jusqu'ici un compte avait AU PLUS UN portefeuille, et tout le code lit donc
-- « le portefeuille de cet utilisateur » ainsi :
--
--     WHERE user_id = … ORDER BY created_at LIMIT 1
--
-- Cette ligne devient fausse le jour où un second portefeuille existe. Elle
-- reste juste par accident tant que le principal est le plus ancien — et elle
-- casse net pour qui rejoint une ligue AVANT d'avoir jamais ouvert la page
-- Portefeuille : son portefeuille de ligue serait alors le plus ancien, et
-- deviendrait son portefeuille principal aux yeux du tableau de bord, du
-- classement général et de la console d'administration.
--
-- Toutes les lectures concernées gagnent donc `league_id IS NULL`, ici pour le
-- SQL (classement général, `admin_list_users`, `admin_user_activity`) et dans
-- le client pour le reste. Il n'y a pas de demi-mesure possible : un seul de
-- ces endroits oublié, et une performance de ligue remonte dans le classement
-- de la plateforme sans que rien ne le signale.

-- --------------------------------------------------------------- table ligues

CREATE TABLE IF NOT EXISTS public.leagues (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  -- La fenêtre de jeu. Bornes incluses côté ouverture, exclues côté clôture :
  -- une ligue « du 1er au 30 » se termine à l'instant que l'administrateur a
  -- saisi, pas au petit matin suivant.
  starts_at     timestamptz NOT NULL,
  ends_at       timestamptz NOT NULL,
  -- Capital crédité à chaque participant qui rejoint. Propre à la ligue : un
  -- challenge à 10 000 MAD ne se joue pas comme un à 100 000.
  start_capital numeric     NOT NULL,
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT leagues_window  CHECK (ends_at > starts_at),
  CONSTRAINT leagues_capital CHECK (start_capital > 0)
);

CREATE INDEX IF NOT EXISTS leagues_starts_idx ON public.leagues (starts_at DESC);

-- Lecture pour les membres, et rien d'autre.
--
-- ⚠️ On repart de zéro avec REVOKE ALL plutôt que d'énumérer ce qu'il faut
-- retirer : un projet Supabase pose `ALTER DEFAULT PRIVILEGES IN SCHEMA public
-- GRANT ALL ON TABLES TO anon, authenticated`, donc la table naît avec TOUT
-- accordé. Nommer INSERT, UPDATE et DELETE laisserait derrière TRUNCATE,
-- REFERENCES et TRIGGER, qu'aucune politique RLS ne couvre. C'est la leçon de
-- `news_posts` (cf. §9f et §10 du HANDOFF), la seule table qui l'avait apprise.
REVOKE ALL ON public.leagues FROM authenticated, anon;
GRANT SELECT ON public.leagues TO authenticated;
GRANT ALL    ON public.leagues TO service_role;

ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leagues readable by members" ON public.leagues;
CREATE POLICY "leagues readable by members" ON public.leagues
FOR SELECT TO authenticated USING (true);

DROP TRIGGER IF EXISTS update_leagues_updated_at ON public.leagues;
CREATE TRIGGER update_leagues_updated_at
BEFORE UPDATE ON public.leagues
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------- portefeuilles : ligue, capital

-- `league_id` NULL = le portefeuille principal, celui que tout le monde a.
-- ON DELETE CASCADE : supprimer une ligue emporte ses portefeuilles, sinon ils
-- deviendraient des portefeuilles orphelins que rien n'affiche et que la
-- lecture « principal » du client ramasserait.
ALTER TABLE public.portfolios
  ADD COLUMN IF NOT EXISTS league_id uuid REFERENCES public.leagues(id) ON DELETE CASCADE;

-- Le capital initial, inscrit sur le portefeuille lui-même.
--
-- Il était jusqu'ici une constante du client (`START_CAPITAL = 100000`), donc
-- la plus-value se mesurait contre 100 000 quel que soit le financement réel du
-- portefeuille — juste par accident, parce que la remise à zéro restituait
-- exactement cette somme (cf. §8 du HANDOFF). Une ligue à 10 000 MAD rend ce
-- raccourci faux : un portefeuille doit se souvenir de ce avec quoi il a
-- commencé. La valeur par défaut reprend l'ancienne constante, donc les lignes
-- déjà en base sont correctes sans reprise.
ALTER TABLE public.portfolios
  ADD COLUMN IF NOT EXISTS start_capital numeric NOT NULL DEFAULT 100000;

-- Un seul portefeuille par ligue et par compte.
--
-- Index PARTIEL, et c'est essentiel : une contrainte UNIQUE ordinaire sur
-- (user_id, league_id) ne contraindrait rien du tout côté principal, NULL étant
-- distinct de NULL en SQL. Le partiel dit exactement ce qu'on veut dire — les
-- portefeuilles de ligue sont uniques, le principal garde le comportement
-- historique.
CREATE UNIQUE INDEX IF NOT EXISTS portfolios_user_league_idx
  ON public.portfolios (user_id, league_id) WHERE league_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS portfolios_league_idx
  ON public.portfolios (league_id) WHERE league_id IS NOT NULL;

-- ------------------------------- le navigateur n'écrit ni la ligue ni la mise

-- Une ligue est un concours, donc la dotation doit être hors de portée du
-- concurrent. Deux colonnes le décident — `league_id`, qui dit à quelle ligue
-- un portefeuille appartient, et `start_capital`, contre quoi sa performance se
-- mesure — et jusqu'ici `authenticated` avait INSERT et UPDATE sur la table
-- entière. Il aurait donc suffi d'un appel d'API pour s'ouvrir un portefeuille
-- de ligue à un million, ou pour ramener son capital de référence à un dirham
-- et afficher une performance à sept chiffres.
--
-- Les droits deviennent donc COLONNE PAR COLONNE, exactement ce que le client
-- écrit et rien de plus : il insère `{user_id, cash}` en créant le portefeuille
-- principal, et ne met jamais à jour que `cash`. Vérifié sur les six seuls
-- accès à cette table dans `src/`. `league_join` passe outre en SECURITY
-- DEFINER, ce qui est précisément sa raison d'être.
--
-- DELETE disparaît au passage, et ce n'est pas un dommage collatéral : sans
-- cela, quitter une ligue perdue et la rejoindre au capital plein serait une
-- requête. Aucun code client ne supprime de portefeuille (la remise à zéro vide
-- les positions, les transactions, les instantanés et les ordres, jamais la
-- ligne elle-même), et la suppression d'un compte passe par `admin_delete_user`
-- et la cascade depuis `auth.users`.
--
-- ⚠️ REVOKE ALL d'abord, comme pour `news_posts` : la table est née avec TOUT
-- accordé (`ALTER DEFAULT PRIVILEGES … GRANT ALL ON TABLES TO anon,
-- authenticated`), et énumérer ce qu'on retire laisserait TRUNCATE, REFERENCES
-- et TRIGGER derrière — le 🟠 de la §10 du HANDOFF, réglé ici pour cette table.
REVOKE ALL ON public.portfolios FROM authenticated, anon;
GRANT SELECT             ON public.portfolios TO authenticated;
GRANT INSERT (user_id, cash) ON public.portfolios TO authenticated;
GRANT UPDATE (cash)          ON public.portfolios TO authenticated;
GRANT ALL                ON public.portfolios TO service_role;

-- ------------------------------------------------------------- league_create

CREATE OR REPLACE FUNCTION public.league_create(
  p_name          text,
  p_starts_at     timestamptz,
  p_ends_at       timestamptz,
  p_start_capital numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cleaned text := btrim(COALESCE(p_name, ''));
  new_id  uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  -- La validation vit ici et pas seulement dans le formulaire : masquer un
  -- bouton n'empêche personne d'appeler la RPC depuis une console.
  IF cleaned = '' THEN
    RAISE EXCEPTION 'Le nom de la ligue est obligatoire' USING ERRCODE = '22023';
  END IF;
  IF length(cleaned) > 120 THEN
    RAISE EXCEPTION 'Le nom de la ligue dépasse 120 caractères' USING ERRCODE = '22023';
  END IF;
  IF p_starts_at IS NULL OR p_ends_at IS NULL THEN
    RAISE EXCEPTION 'Les dates de début et de fin sont obligatoires' USING ERRCODE = '22023';
  END IF;
  IF p_ends_at <= p_starts_at THEN
    RAISE EXCEPTION 'La date de fin doit suivre la date de début' USING ERRCODE = '22023';
  END IF;
  IF p_start_capital IS NULL OR p_start_capital <= 0 THEN
    RAISE EXCEPTION 'Le capital de départ doit être supérieur à zéro' USING ERRCODE = '22023';
  END IF;
  -- Borne haute : au-delà, ce n'est plus un capital pédagogique mais une faute
  -- de frappe sur le pavé numérique.
  IF p_start_capital > 1000000000 THEN
    RAISE EXCEPTION 'Le capital de départ dépasse le milliard de dirhams' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.leagues (name, starts_at, ends_at, start_capital, created_by)
  VALUES (cleaned, p_starts_at, p_ends_at, p_start_capital, auth.uid())
  RETURNING id INTO new_id;

  RETURN new_id;
END; $$;

REVOKE EXECUTE ON FUNCTION public.league_create(text, timestamptz, timestamptz, numeric)
  FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.league_create(text, timestamptz, timestamptz, numeric)
  TO authenticated;

-- --------------------------------------------------------------- league_join

-- Rejoindre une ligue, c'est ouvrir son portefeuille.
--
-- SECURITY DEFINER pour une raison précise : le capital crédité doit être celui
-- que l'administrateur a fixé, pas celui que le client demande. La RLS autorise
-- un membre à insérer ses propres lignes dans `portfolios`, donc laisser le
-- navigateur créer ce portefeuille reviendrait à le laisser choisir sa dotation.
--
-- Idempotente : rappelée sur une ligue déjà rejointe, elle rend le portefeuille
-- existant au lieu de lever. Deux clics sur « Rejoindre » ne doivent pas donner
-- une erreur à lire.
CREATE OR REPLACE FUNCTION public.league_join(p_league_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid     uuid := auth.uid();
  lg      public.leagues%ROWTYPE;
  pf_id   uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO lg FROM public.leagues WHERE id = p_league_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ligue introuvable' USING ERRCODE = '22023';
  END IF;

  SELECT p.id INTO pf_id
  FROM public.portfolios p
  WHERE p.user_id = uid AND p.league_id = p_league_id;
  IF FOUND THEN
    RETURN pf_id;
  END IF;

  -- On peut rejoindre AVANT le coup d'envoi — c'est même le cas normal, une
  -- ligue s'annonce. On ne rejoint pas une ligue terminée : le classement est
  -- clos, y entrer ne donnerait qu'un portefeuille dans lequel on ne pourra
  -- jamais passer d'ordre.
  IF now() > lg.ends_at THEN
    RAISE EXCEPTION 'Cette ligue est terminée' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.portfolios (user_id, cash, league_id, start_capital)
  VALUES (uid, lg.start_capital, lg.id, lg.start_capital)
  RETURNING id INTO pf_id;

  RETURN pf_id;
END; $$;

REVOKE EXECUTE ON FUNCTION public.league_join(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.league_join(uuid) TO authenticated;

-- -------------------------------------------------------------- league_list

-- Les ligues visibles, avec ce que la vignette a besoin de savoir.
--
-- SECURITY DEFINER pour le seul `members` : compter les participants suppose de
-- lire les portefeuilles des autres, ce que la RLS interdit à juste titre. Rien
-- d'autre ne sort d'ici — pas de nom, pas de valorisation, un entier.
CREATE OR REPLACE FUNCTION public.league_list()
RETURNS TABLE (
  id            uuid,
  name          text,
  starts_at     timestamptz,
  ends_at       timestamptz,
  start_capital numeric,
  members       int,
  joined        boolean,
  portfolio_id  uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    l.id,
    l.name,
    l.starts_at,
    l.ends_at,
    l.start_capital,
    (SELECT count(*)::int FROM public.portfolios p WHERE p.league_id = l.id),
    (mine.id IS NOT NULL),
    mine.id
  FROM public.leagues l
  LEFT JOIN public.portfolios mine
    ON mine.league_id = l.id AND mine.user_id = uid
  -- Les ligues en cours ou à venir d'abord, les terminées ensuite : une
  -- vignette de concours clos n'a rien à faire en tête de grille.
  ORDER BY (l.ends_at < now()), l.starts_at DESC;
END; $$;

REVOKE EXECUTE ON FUNCTION public.league_list() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.league_list() TO authenticated;

-- ------------------------------------------------------- league_leaderboard

-- Le classement d'une ligue : ses membres, et personne d'autre.
--
-- Même valorisation que le classement général (cf.
-- 20260826090000_leaderboard_live.sql) : les positions sont évaluées ligne à
-- ligne à la dernière clôture connue, et retombent sur le prix de revient à
-- défaut — jamais sur zéro, qui effacerait des titres réellement détenus.
--
-- Deux différences avec le général, toutes deux dans la nature de la chose :
-- on part des portefeuilles de la ligue et non de `auth.users`, parce qu'une
-- ligue n'a pas de non-participants ; et la performance se mesure contre le
-- capital de la ligue, pas contre les 100 000 MAD de la plateforme.
CREATE OR REPLACE FUNCTION public.league_leaderboard(p_league_id uuid)
RETURNS TABLE (
  rank        int,
  name        text,
  cash        numeric,
  invested    numeric,
  value       numeric,
  performance numeric,
  is_self     boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid     uuid := auth.uid();
  capital numeric;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT l.start_capital INTO capital FROM public.leagues l WHERE l.id = p_league_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ligue introuvable' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  WITH last_close AS (
    SELECT DISTINCT ON (d.ticker) d.ticker, d.close
    FROM public.stock_quotes_daily d
    ORDER BY d.ticker, d.date DESC
  ),
  scored AS (
    SELECT
      p.user_id,
      COALESCE(
        NULLIF(btrim(pr.display_name), ''),
        split_part(u.email, '@', 1)
      ) AS name,
      p.cash AS cash,
      COALESCE((
        SELECT sum(h.quantity * COALESCE(lc.close, h.avg_price))
        FROM public.portfolio_holdings h
        LEFT JOIN last_close lc ON lc.ticker = upper(h.ticker)
        WHERE h.portfolio_id = p.id AND h.quantity > 0
      ), 0) AS invested
    FROM public.portfolios p
    JOIN auth.users u          ON u.id  = p.user_id
    LEFT JOIN public.profiles pr ON pr.id = p.user_id
    WHERE p.league_id = p_league_id
      -- Même règle que le classement général : celui qui administre la
      -- plateforme ne concourt pas, y compris dans une ligue qu'il a ouverte
      -- pour la tester.
      AND lower(u.email) <> public.principal_admin_email()
  )
  SELECT
    row_number() OVER (
      ORDER BY (s.cash + s.invested) DESC, s.invested DESC, s.name ASC
    )::int,
    s.name,
    round(s.cash, 2),
    round(s.invested, 2),
    round(s.cash + s.invested, 2),
    round((((s.cash + s.invested) - capital) / capital) * 100, 2),
    (s.user_id = uid)
  FROM scored s
  ORDER BY (s.cash + s.invested) DESC, s.invested DESC, s.name ASC;
END; $$;

REVOKE EXECUTE ON FUNCTION public.league_leaderboard(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.league_leaderboard(uuid) TO authenticated;

-- ------------------------------------- le classement général ignore les ligues

-- Identique à 20260826090000_leaderboard_live.sql, à une clause près : le CTE
-- `pf` ne retient que le portefeuille principal. Sans elle, un portefeuille de
-- ligue pourrait être le plus ancien d'un compte et le représenter dans le
-- classement de la plateforme — avec le capital de la ligue, donc une
-- performance calculée contre les mauvais 100 000 MAD.
DROP FUNCTION IF EXISTS public.leaderboard();

CREATE FUNCTION public.leaderboard()
RETURNS TABLE (
  rank        int,
  name        text,
  cash        numeric,
  invested    numeric,
  value       numeric,
  performance numeric,
  is_self     boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  start_capital constant numeric := 100000;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH pf AS (
    SELECT DISTINCT ON (p.user_id)
      p.id, p.user_id, p.cash
    FROM public.portfolios p
    WHERE p.league_id IS NULL
    ORDER BY p.user_id, p.created_at
  ),
  last_close AS (
    SELECT DISTINCT ON (d.ticker)
      d.ticker, d.close
    FROM public.stock_quotes_daily d
    ORDER BY d.ticker, d.date DESC
  ),
  scored AS (
    SELECT
      u.id AS user_id,
      COALESCE(
        NULLIF(btrim(pr.display_name), ''),
        split_part(u.email, '@', 1)
      ) AS name,
      COALESCE(pf.cash, start_capital) AS cash,
      COALESCE((
        SELECT sum(h.quantity * COALESCE(lc.close, h.avg_price))
        FROM public.portfolio_holdings h
        LEFT JOIN last_close lc ON lc.ticker = upper(h.ticker)
        WHERE h.portfolio_id = pf.id AND h.quantity > 0
      ), 0) AS invested
    FROM auth.users u
    LEFT JOIN public.profiles pr ON pr.id = u.id
    LEFT JOIN pf                 ON pf.user_id = u.id
    WHERE lower(u.email) <> public.principal_admin_email()
  )
  SELECT
    row_number() OVER (
      ORDER BY (s.cash + s.invested) DESC, s.invested DESC, s.name ASC
    )::int,
    s.name,
    round(s.cash, 2),
    round(s.invested, 2),
    round(s.cash + s.invested, 2),
    round((((s.cash + s.invested) - start_capital) / start_capital) * 100, 2),
    (s.user_id = auth.uid())
  FROM scored s
  ORDER BY (s.cash + s.invested) DESC, s.invested DESC, s.name ASC;
END; $$;

REVOKE EXECUTE ON FUNCTION public.leaderboard() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.leaderboard() TO authenticated;

-- ---------------------------------- l'administration ne voit que le principal

-- `admin_list_users` comptait les positions et les transactions par jointure
-- sur `portfolios.user_id`, et prenait les liquidités du portefeuille le plus
-- ancien. Les trois lectures ramassaient donc les ligues : la fiche d'un compte
-- aurait mélangé son portefeuille principal et ses concours.
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  user_id           uuid,
  email             text,
  display_name      text,
  first_name        text,
  last_name         text,
  role              text,
  created_at        timestamptz,
  last_sign_in_at   timestamptz,
  email_confirmed   boolean,
  lessons_completed int,
  holdings_count    int,
  trades_count      int,
  cash              numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    p.display_name,
    p.first_name,
    p.last_name,
    COALESCE(r.role::text, 'user'),
    u.created_at,
    u.last_sign_in_at,
    (u.email_confirmed_at IS NOT NULL),
    (SELECT count(*)::int FROM public.lesson_progress lp
       WHERE lp.user_id = u.id AND lp.completed),
    (SELECT count(*)::int FROM public.portfolio_holdings h
       JOIN public.portfolios pf ON pf.id = h.portfolio_id
       WHERE pf.user_id = u.id AND pf.league_id IS NULL AND h.quantity > 0),
    (SELECT count(*)::int FROM public.portfolio_trades t
       JOIN public.portfolios pf ON pf.id = t.portfolio_id
       WHERE pf.user_id = u.id AND pf.league_id IS NULL),
    (SELECT pf.cash FROM public.portfolios pf
       WHERE pf.user_id = u.id AND pf.league_id IS NULL
       ORDER BY pf.created_at LIMIT 1)
  FROM auth.users u
  LEFT JOIN public.profiles   p ON p.id      = u.id
  LEFT JOIN public.user_roles r ON r.user_id = u.id
  ORDER BY u.created_at DESC;
END; $$;

REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;

-- La fiche d'activité d'un compte choisit en tête de fonction LE portefeuille
-- dont elle détaille ensuite tout le reste. La contraindre au principal écarte
-- les ligues de la fiche entière, sans toucher aux vingt requêtes qui suivent.
-- La fonction est reprise à l'identique de
-- 20260821090000_names_and_principal_admin.sql, à cette clause près.

CREATE OR REPLACE FUNCTION public.admin_user_activity(target_user uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result      jsonb;
  pf_id       uuid;
  total_count int;
  done_count  int;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  -- ⚠️ `AND pf.league_id IS NULL` : TOUTE la fiche est construite à partir de
  -- ce `pf_id`, positions, ordres, transactions et instantanés compris. Sans
  -- cette clause, un compte ayant rejoint une ligue avant d'avoir jamais ouvert
  -- la page Portefeuille verrait sa fiche d'administration décrire son
  -- portefeuille de concours à la place du sien.
  SELECT pf.id INTO pf_id
  FROM public.portfolios pf
  WHERE pf.user_id = target_user AND pf.league_id IS NULL
  ORDER BY pf.created_at
  LIMIT 1;

  SELECT count(*) INTO total_count FROM public.lessons;

  SELECT count(*) INTO done_count
  FROM public.lesson_progress lp
  WHERE lp.user_id = target_user AND lp.completed;

  SELECT jsonb_build_object(
    'account', (
      SELECT jsonb_build_object(
        'user_id',         u.id,
        'email',           u.email,
        'display_name',    p.display_name,
        'first_name',      p.first_name,
        'last_name',       p.last_name,
        'role',            COALESCE(r.role, 'user'),
        'created_at',      u.created_at,
        'last_sign_in_at', u.last_sign_in_at,
        'email_confirmed', (u.email_confirmed_at IS NOT NULL),
        'confirmed_at',    u.email_confirmed_at,
        'role_granted_at', r.granted_at
      )
      FROM auth.users u
      LEFT JOIN public.profiles   p ON p.id      = u.id
      LEFT JOIN public.user_roles r ON r.user_id = u.id
      WHERE u.id = target_user
    ),

    'progress', jsonb_build_object(
      'total',      total_count,
      'completed',  done_count,
      'ratio',      CASE WHEN total_count > 0
                         THEN round((done_count::numeric / total_count) * 100)
                         ELSE 0 END,
      'avg_score',  COALESCE((SELECT round(avg(lp.score))
                              FROM public.lesson_progress lp
                              WHERE lp.user_id = target_user), 0),
      'best_score', COALESCE((SELECT max(lp.score)
                              FROM public.lesson_progress lp
                              WHERE lp.user_id = target_user), 0),
      'attempted',  (SELECT count(*)::int FROM public.lesson_progress lp
                     WHERE lp.user_id = target_user),
      'last_activity', (SELECT max(lp.updated_at) FROM public.lesson_progress lp
                        WHERE lp.user_id = target_user),
      'by_level', COALESCE((
        SELECT jsonb_agg(x ORDER BY x->>'level')
        FROM (
          SELECT jsonb_build_object(
            'level',     l.level,
            'total',     count(*)::int,
            'completed', count(*) FILTER (WHERE lp.completed)::int
          ) AS x
          FROM public.lessons l
          LEFT JOIN public.lesson_progress lp
                 ON lp.lesson_id = l.id AND lp.user_id = target_user
          GROUP BY l.level
        ) s
      ), '[]'::jsonb)
    ),

    -- Toutes les leçons, avec le statut de ce compte face à chacune.
    'lessons', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'title',      l.title,
        'level',      l.level,
        'sort_order', l.sort_order,
        'slug',       l.slug,
        'completed',  COALESCE(lp.completed, false),
        'score',      COALESCE(lp.score, 0),
        'attempted',  (lp.id IS NOT NULL),
        'updated_at', lp.updated_at
      ) ORDER BY l.sort_order)
      FROM public.lessons l
      LEFT JOIN public.lesson_progress lp
             ON lp.lesson_id = l.id AND lp.user_id = target_user
    ), '[]'::jsonb),

    'portfolio', (
      SELECT jsonb_build_object(
        'cash',          pf.cash,
        'created_at',    pf.created_at,
        'cost_basis',    COALESCE((SELECT sum(h.quantity * h.avg_price)
                                   FROM public.portfolio_holdings h
                                   WHERE h.portfolio_id = pf.id AND h.quantity > 0), 0),
        'trades_count',  (SELECT count(*)::int FROM public.portfolio_trades t
                          WHERE t.portfolio_id = pf.id),
        'buy_count',     (SELECT count(*)::int FROM public.portfolio_trades t
                          WHERE t.portfolio_id = pf.id AND t.side = 'buy'),
        'sell_count',    (SELECT count(*)::int FROM public.portfolio_trades t
                          WHERE t.portfolio_id = pf.id AND t.side = 'sell'),
        'first_trade',   (SELECT min(t.created_at) FROM public.portfolio_trades t
                          WHERE t.portfolio_id = pf.id),
        'last_trade',    (SELECT max(t.created_at) FROM public.portfolio_trades t
                          WHERE t.portfolio_id = pf.id)
      )
      FROM public.portfolios pf WHERE pf.id = pf_id
    ),

    'holdings', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'ticker',    h.ticker,
        'quantity',  h.quantity,
        'avg_price', h.avg_price,
        'cost',      h.quantity * h.avg_price,
        'updated_at', h.updated_at
      ) ORDER BY (h.quantity * h.avg_price) DESC)
      FROM public.portfolio_holdings h
      WHERE h.portfolio_id = pf_id AND h.quantity > 0
    ), '[]'::jsonb),

    'orders', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'ticker',      o.ticker,
        'side',        o.side,
        'quantity',    o.quantity,
        'limit_price', o.limit_price,
        'status',      o.status,
        'created_at',  o.created_at
      ) ORDER BY o.created_at DESC)
      FROM public.portfolio_orders o
      WHERE o.portfolio_id = pf_id AND o.status = 'pending'
    ), '[]'::jsonb),

    'trades', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'ticker',     t.ticker,
        'side',       t.side,
        'quantity',   t.quantity,
        'price',      t.price,
        'amount',     t.quantity * t.price,
        'created_at', t.created_at
      ) ORDER BY t.created_at DESC)
      FROM (
        SELECT * FROM public.portfolio_trades
        WHERE portfolio_id = pf_id
        ORDER BY created_at DESC
        LIMIT 100
      ) t
    ), '[]'::jsonb),

    'snapshots', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'date', s.date, 'value', s.value, 'masi', s.masi
      ) ORDER BY s.date)
      FROM public.portfolio_snapshots s
      WHERE s.portfolio_id = pf_id
    ), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END; $$;

REVOKE EXECUTE ON FUNCTION public.admin_user_activity(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_user_activity(uuid) TO authenticated;
