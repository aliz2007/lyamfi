-- Admin roles, role-gated RPCs, and the founding admin bootstrap.
--
-- Design notes:
--   * `authenticated` is granted SELECT on user_roles but NEVER insert/update/delete.
--     Every mutation goes through a SECURITY DEFINER RPC that re-checks is_admin().
--     Without this a user could simply UPDATE their own row to 'admin'.
--   * is_admin() is SECURITY DEFINER so RLS policies on user_roles can call it
--     without recursing into the very table they are protecting.
--   * The founding admin is bootstrapped by EMAIL, never by password. The password
--     is set by signing up normally; no credential is ever stored in this repo.

-- ---------------------------------------------------------------- roles table

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at timestamptz NOT NULL DEFAULT now()
);

-- Read-only for clients. Mutations happen exclusively via admin_set_role().
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL    ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------- is_admin()

CREATE OR REPLACE FUNCTION public.is_admin(uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles r
    WHERE r.user_id = uid AND r.role = 'admin'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

-- A user sees their own role; an admin sees everyone's.
DROP POLICY IF EXISTS "read own role or all as admin" ON public.user_roles;
CREATE POLICY "read own role or all as admin" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- ------------------------------------------------- signup trigger (extended)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;

  -- The founding admin is recognised by email at signup time.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE WHEN lower(NEW.email) = 'lyamcorpo@gmail.com' THEN 'admin' ELSE 'user' END
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END; $$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- ------------------------------------------------------------ backfill

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, CASE WHEN lower(u.email) = 'lyamcorpo@gmail.com' THEN 'admin' ELSE 'user' END
FROM auth.users u
ON CONFLICT (user_id) DO NOTHING;

-- Promote the founder even if the row already existed as 'user'.
UPDATE public.user_roles r
SET role = 'admin', granted_at = now()
FROM auth.users u
WHERE u.id = r.user_id
  AND lower(u.email) = 'lyamcorpo@gmail.com'
  AND r.role <> 'admin';

-- --------------------------------------------------------- admin_list_users

CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  user_id           uuid,
  email             text,
  display_name      text,
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

-- ----------------------------------------------------------- admin_set_role

CREATE OR REPLACE FUNCTION public.admin_set_role(target_user uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  IF new_role NOT IN ('admin', 'user') THEN
    RAISE EXCEPTION 'invalid role: %', new_role USING ERRCODE = '22023';
  END IF;

  -- Guard against an admin locking themselves out of the admin page.
  IF target_user = auth.uid() AND new_role <> 'admin' THEN
    RAISE EXCEPTION 'you cannot remove your own admin access' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.user_roles (user_id, role, granted_by, granted_at)
  VALUES (target_user, new_role, auth.uid(), now())
  ON CONFLICT (user_id) DO UPDATE
    SET role = EXCLUDED.role, granted_by = EXCLUDED.granted_by, granted_at = now();
END; $$;

REVOKE EXECUTE ON FUNCTION public.admin_set_role(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_set_role(uuid, text) TO authenticated;

-- ------------------------------------------------------ admin_user_activity

CREATE OR REPLACE FUNCTION public.admin_user_activity(target_user uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'account', (
      SELECT jsonb_build_object(
        'user_id', u.id,
        'email', u.email,
        'display_name', p.display_name,
        'role', COALESCE(r.role, 'user'),
        'created_at', u.created_at,
        'last_sign_in_at', u.last_sign_in_at,
        'email_confirmed', (u.email_confirmed_at IS NOT NULL)
      )
      FROM auth.users u
      LEFT JOIN public.profiles   p ON p.id      = u.id
      LEFT JOIN public.user_roles r ON r.user_id = u.id
      WHERE u.id = target_user
    ),
    'lessons', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'title', l.title, 'level', l.level,
        'completed', lp.completed, 'score', lp.score, 'updated_at', lp.updated_at
      ) ORDER BY lp.updated_at DESC)
      FROM public.lesson_progress lp
      JOIN public.lessons l ON l.id = lp.lesson_id
      WHERE lp.user_id = target_user
    ), '[]'::jsonb),
    'portfolio', (
      SELECT jsonb_build_object('cash', pf.cash, 'created_at', pf.created_at)
      FROM public.portfolios pf WHERE pf.user_id = target_user
      ORDER BY pf.created_at LIMIT 1
    ),
    'holdings', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'ticker', h.ticker, 'quantity', h.quantity, 'avg_price', h.avg_price
      ) ORDER BY h.ticker)
      FROM public.portfolio_holdings h
      JOIN public.portfolios pf ON pf.id = h.portfolio_id
      WHERE pf.user_id = target_user AND h.quantity > 0
    ), '[]'::jsonb),
    'trades', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'ticker', t.ticker, 'side', t.side, 'quantity', t.quantity,
        'price', t.price, 'created_at', t.created_at
      ) ORDER BY t.created_at DESC)
      FROM (
        SELECT t.* FROM public.portfolio_trades t
        JOIN public.portfolios pf ON pf.id = t.portfolio_id
        WHERE pf.user_id = target_user
        ORDER BY t.created_at DESC LIMIT 50
      ) t
    ), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END; $$;

REVOKE EXECUTE ON FUNCTION public.admin_user_activity(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_user_activity(uuid) TO authenticated;
