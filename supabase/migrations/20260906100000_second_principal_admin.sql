-- Deux administrateurs principaux au lieu d'un.
--
-- POURQUOI CE N'EST PAS UN RÔLE
--
-- L'administration secondaire est un rôle : une ligne dans `user_roles`, qu'un
-- administrateur principal accorde et retire. L'administration PRINCIPALE ne
-- l'est pas, et c'est délibéré — elle est décidée par l'adresse e-mail, en dur,
-- parce que c'est elle qui autorise à accorder les rôles, à redéfinir un mot de
-- passe et à supprimer un compte. Si elle était elle-même une ligne en base,
-- une ligne effacée par erreur (ou par quelqu'un qui a obtenu le rôle) fermerait
-- la porte à tout le monde, définitivement et sans recours.
--
-- Ajouter un second responsable, c'est donc ajouter une adresse à cette liste,
-- pas cocher une case dans l'interface. C'est plus lourd — il faut une
-- migration et un déploiement — et c'est précisément la garantie recherchée.
--
-- CE QUI CHANGE
--
-- `principal_admin_email()` rendait UNE adresse. Elle est remplacée par
-- `principal_admin_emails()`, qui en rend un tableau. Le type de retour change,
-- donc CREATE OR REPLACE ne suffit pas : l'ancienne est supprimée et tout ce
-- qui l'appelait est réécrit ici même. Les trois fonctions concernées sont
-- `is_principal_admin`, `leaderboard` et `league_leaderboard`, plus
-- `league_join`.
--
-- ⚠️ CONSÉQUENCE À CONNAÎTRE : un administrateur principal ne concourt pas. Il
-- est exclu du classement général, exclu des classements de ligue, et
-- `league_join` lui refuse l'inscription (cf. §9e et §9j du HANDOFF). La règle
-- s'applique désormais aux deux adresses. C'est cohérent avec ce qui était déjà
-- écrit — qui administre la plateforme n'y joue pas — mais c'est un changement
-- visible pour le compte ajouté : il disparaît du classement.

-- ------------------------------------------------- la liste des responsables

-- L'ordre n'a aucune importance : aucune des deux adresses n'a de pouvoir que
-- l'autre n'aurait pas. Les deux sont normalisées en minuscules parce que
-- toutes les comparaisons plus bas passent par `lower(u.email)`.
CREATE OR REPLACE FUNCTION public.principal_admin_emails()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
AS $$ SELECT ARRAY['lyamcorpo@gmail.com', 'ali.zaidane.2007@gmail.com']::text[] $$;

CREATE OR REPLACE FUNCTION public.is_principal_admin(uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = uid
      AND lower(u.email) = ANY (public.principal_admin_emails())
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_principal_admin(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.is_principal_admin(uuid) TO authenticated;

-- L'ancienne fonction disparaît plutôt que de rester à côté de la nouvelle.
-- Laissée en place, elle continuerait de rendre une seule adresse tout en
-- s'appelant « l'adresse de l'administrateur principal » : le prochain appel
-- écarterait un responsable sur deux, et rien ne le signalerait.
--
-- La suppression vient APRÈS la réécriture de `is_principal_admin`, seule
-- fonction en langage SQL à l'appeler ; les autres sont en plpgsql et résolvent
-- leurs appels à l'exécution, donc elles ne s'y opposent pas. Elles sont
-- réécrites plus bas dans la même transaction.
DROP FUNCTION IF EXISTS public.principal_admin_email();

-- ------------------------------------------- le classement général les écarte

-- Identique à 20260906090000_leagues.sql, à la comparaison près : `<> ALL` sur
-- le tableau remplace `<>` sur l'adresse unique.
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
    WHERE lower(u.email) <> ALL (public.principal_admin_emails())
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

-- ------------------------------------------ le classement de ligue les écarte

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
    JOIN auth.users u            ON u.id  = p.user_id
    LEFT JOIN public.profiles pr ON pr.id = p.user_id
    WHERE p.league_id = p_league_id
      AND lower(u.email) <> ALL (public.principal_admin_emails())
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

-- ------------------------------------------- l'inscription en ligue les écarte

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

  -- Un administrateur principal ne concourt pas, et le lui refuser DÈS
  -- L'ADHÉSION est ce qui garde les deux comptages d'accord :
  -- `league_list.members` compte les portefeuilles de la ligue,
  -- `league_leaderboard` écarte les responsables. S'ils pouvaient rejoindre, la
  -- vignette annoncerait un participant de plus que le tableau n'en montre.
  IF lower((SELECT u.email FROM auth.users u WHERE u.id = uid))
     = ANY (public.principal_admin_emails()) THEN
    RAISE EXCEPTION 'Un administrateur principal ne participe pas aux ligues'
      USING ERRCODE = '42501';
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

-- --------------------------------------------- le rôle secondaire suit aussi

-- Un administrateur principal doit aussi porter le rôle « admin », parce que
-- c'est lui que `is_admin()` lit — donc lui qui ouvre la console, la publication
-- d'actualités et la création de ligues. Les deux notions sont indépendantes en
-- base, et un responsable sans la ligne se retrouverait tout-puissant sur les
-- opérations sensibles et incapable d'ouvrir l'écran d'où on les déclenche.
--
-- Idempotent : rejoué, il ne fait rien de plus. Un compte pas encore créé n'est
-- simplement pas touché, et la ligne se posera à sa prochaine exécution.
INSERT INTO public.user_roles (user_id, role, granted_at)
SELECT u.id, 'admin', now()
FROM auth.users u
WHERE lower(u.email) = ANY (public.principal_admin_emails())
ON CONFLICT (user_id) DO UPDATE SET role = 'admin', granted_at = now();
