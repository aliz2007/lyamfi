-- Re-moissonnage des corps boursenews : chapeau repris.
--
-- Le premier moissonnage des corps (`fetchArticleBody`) ne lisait que le
-- conteneur `article_detail_description` et manquait le chapeau, que
-- boursenews place dans un bloc `mini_list` AU-DESSUS du corps : un flash
-- d'une phrase n'affichait plus que sa chute. L'extraction prépose
-- désormais le chapeau ; on vide ici les corps déjà en cache (et leurs
-- traductions, qui en dérivent) pour forcer un re-moissonnage complet à
-- la prochaine ouverture de chaque article. Idempotent, sans effet sur les
-- autres sources (leur extraction était complète).

UPDATE public.news_items
SET body_fr = NULL, body_en = NULL, body_ar = NULL
WHERE source = 'boursenews' AND body_fr IS NOT NULL;
