-- Le classement valorise les positions lui-même, et départage à égalité.
--
-- CE QUI N'ALLAIT PAS
--
-- L'investi se déduisait du dernier instantané du portefeuille :
-- `value - cash`. Deux défauts.
--
-- D'abord un instantané n'existe qu'après un passage sur la page Portefeuille,
-- et vaut ce qu'il valait ce jour-là : rien de « direct ». Ensuite, quand il
-- manquait ou restait sous les liquidités, l'investi retombait sur le prix de
-- revient, voire sur zéro. C'est ce qui affichait 0 MAD d'investi pour un
-- compte qui détenait 7 050 MAD de titres.
--
-- CE QUI LE REMPLACE
--
-- Les positions sont valorisées directement, ligne par ligne, à la dernière
-- clôture connue de chaque valeur dans `stock_quotes_daily`, que l'application
-- alimente à chaque session. Sans clôture enregistrée pour un titre, on retient
-- son prix de revient : moins juste, mais jamais nul alors que la position
-- existe.
--
-- Plus d'instantané dans le calcul : la valeur affichée découle des positions
-- réellement détenues.
--
-- DÉPARTAGE
--
-- À valeur égale, le mieux classé est celui qui a le plus investi. Rester en
-- liquidités ne doit pas rapporter le même rang que d'avoir pris position.

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
    ORDER BY p.user_id, p.created_at
  ),
  -- Dernière clôture connue par valeur.
  last_close AS (
    SELECT DISTINCT ON (d.ticker)
      d.ticker, d.close
    FROM public.stock_quotes_daily d
    ORDER BY d.ticker, d.date DESC
  ),
  -- On part de auth.users : un compte qui n'a jamais ouvert la page
  -- Portefeuille n'a pas de ligne dans `portfolios` et doit tout de même
  -- figurer au classement, à son capital de départ.
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
