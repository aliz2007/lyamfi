-- Ordres au marché mis en attente hors séance.
--
-- Jusqu'ici `portfolio_orders` ne portait que des ordres à cours limité : le
-- prix limite était donc obligatoire. Un ordre au marché passé la nuit ou le
-- week-end doit lui aussi pouvoir attendre l'ouverture, sans prix limite, pour
-- s'exécuter au premier cours connu de la séance suivante.
--
-- D'où deux changements :
--   * `order_type` distingue « market » de « limit ». La valeur par défaut est
--     « limit », donc les lignes déjà en base gardent leur sens exact.
--   * `limit_price` devient nullable, et une contrainte croisée impose la règle
--     réelle : un ordre limité a un prix strictement positif, un ordre au
--     marché n'en a aucun. Sans elle, « limit » sans prix passerait en base et
--     ne se déclencherait jamais.
--
-- La séance elle-même (lundi à vendredi, 09h30 à 15h30, heure de Casablanca,
-- jours fériés exclus) est tenue côté application dans `lib/market-session.ts`,
-- qui sert déjà le bandeau de la page Bourse.

ALTER TABLE public.portfolio_orders
  ADD COLUMN IF NOT EXISTS order_type text NOT NULL DEFAULT 'limit';

ALTER TABLE public.portfolio_orders
  DROP CONSTRAINT IF EXISTS portfolio_orders_order_type_check;
ALTER TABLE public.portfolio_orders
  ADD CONSTRAINT portfolio_orders_order_type_check
  CHECK (order_type IN ('market', 'limit'));

ALTER TABLE public.portfolio_orders
  ALTER COLUMN limit_price DROP NOT NULL;

-- La contrainte de colonne d'origine (limit_price > 0) rejetterait un ordre au
-- marché : elle est remplacée par la règle croisée.
ALTER TABLE public.portfolio_orders
  DROP CONSTRAINT IF EXISTS portfolio_orders_limit_price_check;
ALTER TABLE public.portfolio_orders
  ADD CONSTRAINT portfolio_orders_limit_price_check
  CHECK (
    CASE order_type
      WHEN 'limit'  THEN limit_price IS NOT NULL AND limit_price > 0
      WHEN 'market' THEN limit_price IS NULL
      ELSE false
    END
  );
