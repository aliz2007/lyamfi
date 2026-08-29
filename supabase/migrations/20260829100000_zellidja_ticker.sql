-- Zellidja se cote ZDJ, pas ZEL.
--
-- Le classeur des fondamentaux écrivait ZEL, et `CSE_SYMBOLS` l'avait repris.
-- La Bourse de Casablanca et TradingView cotent la valeur sous ZDJ : la
-- jointure par ticker ne se faisait donc jamais, et Zellidja s'affichait sans
-- cours ni capitalisation, en « N/A », sans que rien ne signale l'erreur.
--
-- La correction est faite en trois endroits, pour qu'elle ne se défasse pas :
--   * `src/lib/cse-symbols.ts`, la cote de référence ;
--   * `scripts/build-stock-metrics.py`, via TICKER_FIXES, pour qu'une
--     régénération du classeur reproduise la correction ;
--   * la migration du classeur, déjà générée, dont la ligne et la liste de
--     conservation portent désormais ZDJ.
--
-- Reste à renommer la ligne dans les bases déjà installées : c'est cette
-- migration. Sans elle, la valeur garderait ses fondamentaux sous l'ancien
-- code jusqu'au prochain passage complet de setup.sql.

-- Cas improbable mais destructeur : si les deux codes coexistaient, le
-- renommage violerait la clé primaire. L'ancien s'efface alors devant le
-- nouveau, qui vient du classeur régénéré et fait foi.
DELETE FROM public.stock_metrics
WHERE ticker = 'ZEL'
  AND EXISTS (SELECT 1 FROM public.stock_metrics WHERE ticker = 'ZDJ');

UPDATE public.stock_metrics SET ticker = 'ZDJ' WHERE ticker = 'ZEL';
