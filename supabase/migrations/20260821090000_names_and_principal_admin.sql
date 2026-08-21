-- Prénom et nom des comptes, et séparation entre administrateur principal et
-- administrateurs secondaires.
--
-- Deux besoins distincts sont traités ici.
--
-- 1. IDENTITÉ. L'inscription demande désormais un prénom et un nom, et le
--    tableau de bord accueille « Bonjour <prénom> » plutôt que la partie
--    locale de l'e-mail. Le nom s'affiche en majuscules ; la règle est portée
--    par un trigger sur `profiles` pour qu'elle vaille quel que soit le chemin
--    d'écriture (inscription, page « Mon compte », console d'administration).
--
-- 2. DEUX NIVEAUX D'ADMINISTRATION. L'administrateur principal
--    (lyamcorpo@gmail.com) peut accorder ou retirer le rôle, redéfinir un mot
--    de passe et supprimer un compte. Un administrateur secondaire ne peut que
--    consulter les comptes et leur activité. La distinction est appliquée dans
--    la base, pas dans l'interface : chaque fonction sensible commence par
--    `is_principal_admin()`.
--
-- Sur les mots de passe : il n'existe volontairement AUCUNE fonction qui
-- retourne un mot de passe. `auth.users.encrypted_password` contient un
-- condensat bcrypt, fonction à sens unique : le mot de passe choisi par un
-- utilisateur n'est stocké nulle part et ne peut être retrouvé par personne,
-- administrateur compris. C'est précisément ce qui protège les comptes si la
-- base fuite. La seule opération possible est d'en DÉFINIR un nouveau, ce que
-- fait `admin_set_user_password`.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- --------------------------------------------------------------- identité

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name  text;

-- Normalise l'identité et recompose `display_name`, à chaque écriture.
CREATE OR REPLACE FUNCTION public.profiles_normalize_name()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.first_name := nullif(btrim(NEW.first_name), '');
  NEW.last_name  := nullif(btrim(NEW.last_name), '');

  -- Le nom en majuscules, le prénom avec une capitale initiale : « Bonjour
  -- sara » sur le tableau de bord passerait pour un bug. initcap gère les
  -- prénoms composés (« sara-lyne » devient « Sara-Lyne »).
  IF NEW.last_name IS NOT NULL THEN
    NEW.last_name := upper(NEW.last_name);
  END IF;

  IF NEW.first_name IS NOT NULL THEN
    NEW.first_name := initcap(NEW.first_name);
  END IF;

  -- `display_name` n'est écrasé que si une identité est fournie : les comptes
  -- créés avant cette migration gardent le libellé qu'ils avaient.
  IF NEW.first_name IS NOT NULL OR NEW.last_name IS NOT NULL THEN
    NEW.display_name := nullif(btrim(concat_ws(' ', NEW.first_name, NEW.last_name)), '');
  END IF;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS profiles_normalize_name ON public.profiles;
CREATE TRIGGER profiles_normalize_name
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.profiles_normalize_name();

-- ------------------------------------------------- inscription (trigger étendu)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fn text;
  ln text;
BEGIN
  fn := nullif(btrim(NEW.raw_user_meta_data->>'first_name'), '');
  ln := nullif(btrim(NEW.raw_user_meta_data->>'last_name'), '');

  INSERT INTO public.profiles (id, first_name, last_name, display_name)
  VALUES (
    NEW.id,
    fn,
    ln,
    COALESCE(
      nullif(btrim(NEW.raw_user_meta_data->>'display_name'), ''),
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;

  -- L'administrateur principal est reconnu par son adresse dès l'inscription.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE WHEN lower(NEW.email) = 'lyamcorpo@gmail.com' THEN 'admin' ELSE 'user' END
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END; $$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- ------------------------------------------------- reprise des comptes existants

-- Les trois comptes déjà créés au moment de cette migration. Les autres
-- gardent leur libellé actuel jusqu'à ce que leur titulaire renseigne son
-- identité depuis « Mon compte », ou que l'administrateur principal le fasse
-- depuis la fiche du compte.
UPDATE public.profiles p
SET first_name = 'Lyamfi', last_name = NULL, display_name = 'Lyamfi'
FROM auth.users u
WHERE u.id = p.id
  AND lower(u.email) = 'lyamcorpo@gmail.com'
  AND p.first_name IS NULL;

UPDATE public.profiles p
SET first_name = 'Rayane', last_name = 'LYAMOURI'
FROM auth.users u
WHERE u.id = p.id
  AND lower(u.email) LIKE '%rayane%'
  AND p.first_name IS NULL;

UPDATE public.profiles p
SET first_name = 'Hassan', last_name = 'LYAMOURI'
FROM auth.users u
WHERE u.id = p.id
  AND lower(u.email) LIKE '%hassan%'
  AND p.first_name IS NULL;

-- ------------------------------------------------------ administrateur principal

CREATE OR REPLACE FUNCTION public.principal_admin_email()
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$ SELECT 'lyamcorpo@gmail.com'::text $$;

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
      AND lower(u.email) = public.principal_admin_email()
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_principal_admin(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.is_principal_admin(uuid) TO authenticated;

-- ------------------------------------------------------------ admin_set_role

-- Accorder ou retirer le rôle devient réservé à l'administrateur principal :
-- un administrateur secondaire ne doit pas pouvoir se créer des pairs.
CREATE OR REPLACE FUNCTION public.admin_set_role(target_user uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_principal_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  IF new_role NOT IN ('admin', 'user') THEN
    RAISE EXCEPTION 'invalid role: %', new_role USING ERRCODE = '22023';
  END IF;

  IF target_user = auth.uid() THEN
    RAISE EXCEPTION 'you cannot change your own role' USING ERRCODE = '22023';
  END IF;

  -- Le compte principal reste administrateur : le rétrograder rendrait les
  -- actions sensibles inaccessibles à tout le monde.
  IF public.is_principal_admin(target_user) AND new_role <> 'admin' THEN
    RAISE EXCEPTION 'the principal administrator cannot be demoted' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.user_roles (user_id, role, granted_by, granted_at)
  VALUES (target_user, new_role, auth.uid(), now())
  ON CONFLICT (user_id) DO UPDATE
    SET role = EXCLUDED.role, granted_by = EXCLUDED.granted_by, granted_at = now();
END; $$;

REVOKE EXECUTE ON FUNCTION public.admin_set_role(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_set_role(uuid, text) TO authenticated;

-- ------------------------------------------------------- admin_set_user_name

CREATE OR REPLACE FUNCTION public.admin_set_user_name(
  target_user    uuid,
  new_first_name text,
  new_last_name  text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_principal_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  IF length(coalesce(new_first_name, '')) > 60 OR length(coalesce(new_last_name, '')) > 60 THEN
    RAISE EXCEPTION 'name too long' USING ERRCODE = '22023';
  END IF;

  -- La mise en majuscules et la recomposition de `display_name` sont faites
  -- par le trigger `profiles_normalize_name`.
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (target_user, new_first_name, new_last_name)
  ON CONFLICT (id) DO UPDATE
    SET first_name = EXCLUDED.first_name,
        last_name  = EXCLUDED.last_name;
END; $$;

REVOKE EXECUTE ON FUNCTION public.admin_set_user_name(uuid, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_set_user_name(uuid, text, text) TO authenticated;

-- --------------------------------------------------- admin_set_user_password

-- Définit un nouveau mot de passe pour un compte. Ne lit rien : voir la note
-- en tête de fichier.
CREATE OR REPLACE FUNCTION public.admin_set_user_password(target_user uuid, new_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT public.is_principal_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  IF new_password IS NULL OR length(new_password) < 8 THEN
    RAISE EXCEPTION 'password must be at least 8 characters' USING ERRCODE = '22023';
  END IF;

  -- bcrypt tronque au-delà de 72 octets : refuser est plus honnête que
  -- d'enregistrer un mot de passe silencieusement raccourci.
  IF octet_length(new_password) > 72 THEN
    RAISE EXCEPTION 'password must be at most 72 bytes' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user) THEN
    RAISE EXCEPTION 'account not found' USING ERRCODE = '22023';
  END IF;

  -- Coût 10 : celui qu'utilise GoTrue, pour que les condensats produits ici
  -- soient indiscernables de ceux créés par l'application.
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf', 10)),
      updated_at         = now()
  WHERE id = target_user;

  -- Un mot de passe redéfini doit invalider les sessions ouvertes, sinon un
  -- appareil déjà connecté garde l'accès malgré la réinitialisation.
  IF to_regclass('auth.sessions') IS NOT NULL THEN
    DELETE FROM auth.sessions WHERE user_id = target_user;
  END IF;
END; $$;

REVOKE EXECUTE ON FUNCTION public.admin_set_user_password(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_set_user_password(uuid, text) TO authenticated;

-- ---------------------------------------------------------- admin_delete_user

CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_principal_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  IF target_user = auth.uid() THEN
    RAISE EXCEPTION 'use your account page to delete your own account' USING ERRCODE = '22023';
  END IF;

  -- Supprimer le compte principal couperait définitivement l'accès aux
  -- actions d'administration, sans aucun moyen de le rétablir depuis le site.
  IF public.is_principal_admin(target_user) THEN
    RAISE EXCEPTION 'the principal administrator account cannot be deleted' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user) THEN
    RAISE EXCEPTION 'account not found' USING ERRCODE = '22023';
  END IF;

  -- Tout ce que possède le compte disparaît avec lui : profiles,
  -- lesson_progress, portfolios et user_roles référencent auth.users(id) en
  -- ON DELETE CASCADE, et portfolio_holdings / _trades / _snapshots / _orders
  -- cascadent depuis portfolios.
  DELETE FROM auth.users WHERE id = target_user;
END; $$;

REVOKE EXECUTE ON FUNCTION public.admin_delete_user(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;

-- ------------------------------------------------ suppression de son propre compte

CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  remaining_admins int;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;

  IF public.is_principal_admin(uid) THEN
    RAISE EXCEPTION 'the principal administrator account cannot be deleted' USING ERRCODE = '22023';
  END IF;

  -- Supprimer le dernier administrateur rendrait la console inaccessible.
  IF public.is_admin(uid) THEN
    SELECT count(*) INTO remaining_admins
    FROM public.user_roles
    WHERE role = 'admin' AND user_id <> uid;

    IF remaining_admins = 0 THEN
      RAISE EXCEPTION
        'you are the only administrator, grant admin access to someone else before deleting your account'
        USING ERRCODE = '22023';
    END IF;
  END IF;

  DELETE FROM auth.users WHERE id = uid;
END; $$;

REVOKE EXECUTE ON FUNCTION public.delete_own_account() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;

-- ------------------------------------------------------------ admin_list_users

-- Le type de retour change (ajout de first_name / last_name). PostgreSQL
-- refuse un CREATE OR REPLACE dans ce cas, d'où la suppression préalable.
DROP FUNCTION IF EXISTS public.admin_list_users();

CREATE FUNCTION public.admin_list_users()
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
    COALESCE(r.role, 'user'),
    u.created_at,
    u.last_sign_in_at,
    (u.email_confirmed_at IS NOT NULL),
    (SELECT count(*)::int FROM public.lesson_progress lp
       WHERE lp.user_id = u.id AND lp.completed),
    (SELECT count(*)::int FROM public.portfolio_holdings h
       JOIN public.portfolios pf ON pf.id = h.portfolio_id
       WHERE pf.user_id = u.id AND h.quantity > 0),
    (SELECT count(*)::int FROM public.portfolio_trades t
       JOIN public.portfolios pf ON pf.id = t.portfolio_id
       WHERE pf.user_id = u.id),
    (SELECT pf.cash FROM public.portfolios pf
       WHERE pf.user_id = u.id ORDER BY pf.created_at LIMIT 1)
  FROM auth.users u
  LEFT JOIN public.profiles   p ON p.id      = u.id
  LEFT JOIN public.user_roles r ON r.user_id = u.id
  ORDER BY u.created_at DESC;
END; $$;

REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;

-- --------------------------------------------------------- admin_user_activity

-- Même contenu que la version précédente, avec le prénom et le nom en plus
-- dans le bloc « account » pour que la fiche puisse les afficher et les éditer.
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

  SELECT pf.id INTO pf_id
  FROM public.portfolios pf
  WHERE pf.user_id = target_user
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
