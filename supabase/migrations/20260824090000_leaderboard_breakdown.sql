-- Le classement détaille les liquidités et l'investi, en plus de la valeur.
--
-- Contrainte de lisibilité : dans un tableau qui affiche les trois colonnes,
-- liquidités + investi doit faire exactement la valeur totale, sinon le lecteur
-- cherche l'erreur.
--
-- La base ne sait pas valoriser des positions : elle n'a pas les cours du jour,
-- qui viennent de TradingView côté client. Le seul chiffre valorisé dont elle
-- dispose est `portfolio_snapshots.value`, enregistré à chaque passage sur la
-- page Portefeuille, et qui vaut déjà liquidités + positions au cours du moment.
--
-- L'investi valorisé est donc déduit : valeur - liquidités. C'est exact tant que
-- les deux datent du même instant, ce que garantit la page Portefeuille : elle
-- réécrit l'instantané du jour dès que la valeur totale bouge, donc juste après
-- un ordre. Entre les deux, le plancher à zéro évite d'afficher un investi
-- négatif si les liquidités devançaient l'instantané.
--
-- Sans instantané, on retombe sur le prix de revient des positions, et
-- l'égalité reste vraie par construction.

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
  latest_snapshot AS (
    SELECT DISTINCT ON (s.portfolio_id)
      s.portfolio_id, s.value
    FROM public.portfolio_snapshots s
    ORDER BY s.portfolio_id, s.date DESC
  ),
  -- On part de auth.users et non de portfolios : un compte qui n'a jamais
  -- ouvert la page Portefeuille n'a pas encore de ligne, et doit tout de même
  -- figurer au classement, à son capital de départ.
  base AS (
    SELECT
      u.id AS user_id,
      COALESCE(
        NULLIF(btrim(pr.display_name), ''),
        split_part(u.email, '@', 1)
      ) AS name,
      COALESCE(pf.cash, start_capital) AS cash,
      ls.value AS snapshot_value,
      COALESCE((
        SELECT sum(h.quantity * h.avg_price)
        FROM public.portfolio_holdings h
        WHERE h.portfolio_id = pf.id AND h.quantity > 0
      ), 0) AS cost_basis
    FROM auth.users u
    LEFT JOIN public.profiles pr ON pr.id = u.id
    LEFT JOIN pf                 ON pf.user_id = u.id
    LEFT JOIN latest_snapshot ls ON ls.portfolio_id = pf.id
    WHERE lower(u.email) <> public.principal_admin_email()
  ),
  scored AS (
    SELECT
      b.user_id,
      b.name,
      b.cash,
      -- Avec instantané : l'investi valorisé se déduit de la valeur totale.
      -- Sans, ou si l'instantané est resté en dessous des liquidités (ordre
      -- passé depuis), le prix de revient est le meilleur chiffre disponible.
      -- Retomber sur zéro sous-estimerait un compte qui détient des positions.
      CASE
        WHEN b.snapshot_value IS NOT NULL AND b.snapshot_value - b.cash > 0
          THEN b.snapshot_value - b.cash
        ELSE b.cost_basis
      END AS invested
    FROM base b
  )
  SELECT
    row_number() OVER (ORDER BY (s.cash + s.invested) DESC, s.name ASC)::int,
    s.name,
    round(s.cash, 2),
    round(s.invested, 2),
    round(s.cash + s.invested, 2),
    round((((s.cash + s.invested) - start_capital) / start_capital) * 100, 2),
    (s.user_id = auth.uid())
  FROM scored s
  ORDER BY (s.cash + s.invested) DESC, s.name ASC;
END; $$;

REVOKE EXECUTE ON FUNCTION public.leaderboard() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.leaderboard() TO authenticated;
