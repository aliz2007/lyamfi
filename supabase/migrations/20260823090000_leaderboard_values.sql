-- Le classement montre la valeur du portefeuille, et n'exclut plus personne.
--
-- Trois corrections par rapport à la première version :
--   * la valeur du portefeuille en dirhams s'affiche à côté de la performance,
--     qui seule ne dit pas grand-chose ;
--   * le nombre d'ordres passés disparaît, ce n'est l'affaire de personne ;
--   * tout le monde est classé, y compris qui n'a encore rien acheté. Un compte
--     sans portefeuille démarre à 100 000 MAD, soit 0,00 %, exactement comme
--     s'il venait d'ouvrir la page Portefeuille.
--
-- Seul l'administrateur principal reste hors classement : il administre la
-- plateforme, il ne concourt pas.

DROP FUNCTION IF EXISTS public.leaderboard();

CREATE FUNCTION public.leaderboard()
RETURNS TABLE (
  rank        int,
  name        text,
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
    ORDER BY p.user_id, p.created_at
  ),
  latest_snapshot AS (
    SELECT DISTINCT ON (s.portfolio_id)
      s.portfolio_id, s.value
    FROM public.portfolio_snapshots s
    ORDER BY s.portfolio_id, s.date DESC
  ),
  -- On part de auth.users et non de portfolios : un compte qui n'a jamais
  -- ouvert la page Portefeuille n'a pas encore de ligne, et doit tout de même
  -- figurer au classement, à son capital de départ.
  scored AS (
    SELECT
      u.id AS user_id,
      COALESCE(
        NULLIF(btrim(pr.display_name), ''),
        split_part(u.email, '@', 1)
      ) AS name,
      COALESCE(
        ls.value,
        pf.cash + COALESCE((
          SELECT sum(h.quantity * h.avg_price)
          FROM public.portfolio_holdings h
          WHERE h.portfolio_id = pf.id AND h.quantity > 0
        ), 0),
        start_capital
      ) AS value
    FROM auth.users u
    LEFT JOIN public.profiles pr ON pr.id = u.id
    LEFT JOIN pf                 ON pf.user_id = u.id
    LEFT JOIN latest_snapshot ls ON ls.portfolio_id = pf.id
    WHERE lower(u.email) <> public.principal_admin_email()
  )
  SELECT
    row_number() OVER (ORDER BY s.value DESC, s.name ASC)::int,
    s.name,
    round(s.value, 2),
    round(((s.value - start_capital) / start_capital) * 100, 2),
    (s.user_id = auth.uid())
  FROM scored s
  ORDER BY s.value DESC, s.name ASC;
END; $$;

REVOKE EXECUTE ON FUNCTION public.leaderboard() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.leaderboard() TO authenticated;
