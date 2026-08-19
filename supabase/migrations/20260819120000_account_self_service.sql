-- Self-service account deletion.
--
-- The client SDK cannot delete an auth user: that requires the admin API and a
-- service-role key, which must never ship to the browser. Instead this exposes a
-- SECURITY DEFINER function that deletes ONLY the caller's own row, so the
-- privilege stays on the server and the user id is taken from the JWT rather
-- than from a parameter the caller controls.
--
-- Everything owned by the account disappears with it: profiles, lesson_progress,
-- portfolios and user_roles all reference auth.users(id) ON DELETE CASCADE, and
-- portfolio_holdings / _trades / _snapshots / _orders cascade from portfolios.

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

  -- Deleting the last administrator would leave the admin console permanently
  -- unreachable, with no way back in from the application itself.
  IF public.is_admin(uid) THEN
    SELECT count(*) INTO remaining_admins
    FROM public.user_roles
    WHERE role = 'admin' AND user_id <> uid;

    IF remaining_admins = 0 THEN
      RAISE EXCEPTION
        'you are the only administrator — grant admin access to someone else before deleting your account'
        USING ERRCODE = '22023';
    END IF;
  END IF;

  DELETE FROM auth.users WHERE id = uid;
END; $$;

REVOKE EXECUTE ON FUNCTION public.delete_own_account() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;
