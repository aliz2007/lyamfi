-- Historique de cours détenu par Lyamfi, et classement des portefeuilles.
--
-- POURQUOI UNE TABLE D'HISTORIQUE
--
-- La fiche valeur affiche désormais son graphique elle-même, avec la
-- bibliothèque TradingView Lightweight Charts, au lieu d'incruster un widget
-- TradingView dont le moindre clic renvoyait l'utilisateur hors du site.
-- Lightweight Charts est une bibliothèque de rendu : elle ne fournit aucune
-- donnée, il faut donc lui en donner.
--
-- La table `stock_prices` existante ne convient pas : elle est SYNTHÉTIQUE,
-- générée par une sinusoïde sur md5(ticker) dans la migration initiale. La
-- tracer dans un graphique de cours reviendrait à présenter des prix inventés
-- comme des prix réels.
--
-- `stock_quotes_daily` enregistre donc le vrai cours de clôture de chaque
-- valeur, une fois par séance, à partir des cotations que l'application
-- récupère déjà. L'historique se constitue jour après jour : c'est lent au
-- départ, mais chaque point est réel et nous appartient.

CREATE TABLE IF NOT EXISTS public.stock_quotes_daily (
  ticker      text    NOT NULL,
  date        date    NOT NULL,
  close       numeric NOT NULL,
  change_pct  numeric,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (ticker, date)
);

CREATE INDEX IF NOT EXISTS stock_quotes_daily_ticker_date
  ON public.stock_quotes_daily (ticker, date);

GRANT SELECT ON public.stock_quotes_daily TO anon, authenticated;
GRANT ALL    ON public.stock_quotes_daily TO service_role;
ALTER TABLE public.stock_quotes_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quotes public read" ON public.stock_quotes_daily
FOR SELECT TO anon, authenticated USING (true);

-- ------------------------------------------------------ record_daily_quotes

-- Enregistre la clôture du jour pour les valeurs transmises.
--
-- Aucune écriture directe n'est accordée sur la table : tout passe par ici, et
-- une ligne déjà présente pour (ticker, jour) n'est jamais réécrite. Le premier
-- appel de la journée fixe donc la valeur, les suivants ne font rien.
--
-- ⚠️ Limite assumée : les données viennent du client, comme pour les ordres du
-- portefeuille. Un utilisateur authentifié malveillant pourrait déposer une
-- clôture fantaisiste le premier chaque matin. C'est le même modèle de menace
-- que le reste du bac à sable (cf. HANDOFF §10) ; le jour où les écritures de
-- trading passeront côté serveur, celle-ci suivra.
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
  inserted AS (
    INSERT INTO public.stock_quotes_daily (ticker, date, close, change_pct)
    SELECT ticker, today, close, change_pct FROM incoming
    ON CONFLICT (ticker, date) DO NOTHING
    RETURNING 1
  )
  SELECT count(*)::int INTO written FROM inserted;

  RETURN written;
END; $$;

REVOKE EXECUTE ON FUNCTION public.record_daily_quotes(jsonb) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.record_daily_quotes(jsonb) TO authenticated;

-- ---------------------------------------------------------------- classement

-- Classement des portefeuilles virtuels.
--
-- La valeur retenue est celle du dernier instantané enregistré, qui inclut la
-- valorisation des positions au cours du jour. À défaut d'instantané, on
-- retombe sur liquidités + prix de revient, c'est-à-dire une performance qui
-- ignore les plus-values latentes.
--
-- SECURITY DEFINER parce que RLS interdit, à juste titre, de lire le
-- portefeuille d'autrui. La fonction ne renvoie donc que ce qu'un classement
-- doit montrer : un nom, une performance, un nombre d'ordres. Ni e-mail, ni
-- identifiant, ni composition du portefeuille.
CREATE OR REPLACE FUNCTION public.leaderboard()
RETURNS TABLE (
  rank        int,
  name        text,
  performance numeric,
  trades      int,
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
  scored AS (
    SELECT
      pf.user_id,
      COALESCE(
        ls.value,
        pf.cash + COALESCE((
          SELECT sum(h.quantity * h.avg_price)
          FROM public.portfolio_holdings h
          WHERE h.portfolio_id = pf.id AND h.quantity > 0
        ), 0)
      ) AS value,
      (SELECT count(*)::int FROM public.portfolio_trades t WHERE t.portfolio_id = pf.id) AS trades
    FROM pf
    LEFT JOIN latest_snapshot ls ON ls.portfolio_id = pf.id
  ),
  eligible AS (
    SELECT
      s.user_id,
      COALESCE(NULLIF(btrim(pr.display_name), ''), split_part(u.email, '@', 1)) AS name,
      round(((s.value - start_capital) / start_capital) * 100, 2) AS performance,
      s.trades
    FROM scored s
    JOIN auth.users u ON u.id = s.user_id
    LEFT JOIN public.profiles pr ON pr.id = s.user_id
    -- L'administrateur principal est exclu du classement : il administre la
    -- plateforme, il ne concourt pas.
    WHERE lower(u.email) <> public.principal_admin_email()
      -- Il faut avoir passé au moins un ordre pour être classé, sinon la tête
      -- du classement serait occupée par des comptes à 0,00 % qui n'ont
      -- jamais rien fait.
      AND s.trades > 0
  )
  SELECT
    row_number() OVER (ORDER BY e.performance DESC, e.name ASC)::int,
    e.name,
    e.performance,
    e.trades,
    (e.user_id = auth.uid())
  FROM eligible e
  ORDER BY e.performance DESC, e.name ASC;
END; $$;

REVOKE EXECUTE ON FUNCTION public.leaderboard() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.leaderboard() TO authenticated;
