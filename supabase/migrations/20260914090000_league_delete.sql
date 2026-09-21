-- Suppression d'une ligue, administrateur principal uniquement.
--
-- CE QUE C'EST
--
-- Une ligue se créait mais ne se corrigeait ni ne s'effaçait : une faute de
-- nom, de dates ou de dotation était définitive (§10 du HANDOFF). La correction
-- reste à faire (`league_update`) ; la suppression, elle, arrive ici — pour
-- l'administrateur principal seul, passées ou présentes.
--
-- POURQUOI LE PRINCIPAL, ET PAS N'IMPORTE QUEL ADMINISTRATEUR
--
-- Supprimer une ligue n'efface pas qu'une ligne : la cascade emporte les
-- portefeuilles de TOUS ses participants, avec leurs positions, leurs
-- transactions, leurs ordres et leurs instantanés. C'est une destruction en
-- masse de données de jeu, du même acabit que la suppression d'un compte —
-- réservée au principal pour la même raison (§9c du HANDOFF). Masquer l'icône
-- côté client reste cosmétique : c'est `is_principal_admin()` qui tranche, ici
-- comme partout.
--
-- LA CASCADE FAIT LE TRAVAIL, ET C'EST VOULU
--
-- `portfolios.league_id` est déclaré `ON DELETE CASCADE` depuis la migration
-- des ligues, précisément pour ce jour : un portefeuille de ligue sans ligue
-- serait un orphelin que rien n'affiche et que la lecture « principal » du
-- client pourrait ramasser. Les positions, transactions, instantanés et ordres
-- cascadent à leur tour depuis `portfolios`. Un seul DELETE suffit donc, et le
-- portefeuille principal (`league_id IS NULL`) n'est jamais concerné.

CREATE OR REPLACE FUNCTION public.league_delete(p_league_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_principal_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.leagues WHERE id = p_league_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ligue introuvable' USING ERRCODE = '22023';
  END IF;
END; $$;

REVOKE EXECUTE ON FUNCTION public.league_delete(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.league_delete(uuid) TO authenticated;
