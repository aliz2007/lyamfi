-- Richer per-account detail for the admin console.
--
-- The first version only returned lessons the user had already started, so an
-- admin could not see what someone had NOT done — which is most of what
-- "progression" means. This returns every lesson with its status, per-level
-- roll-ups, the valued portfolio, pending orders and the performance history.

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

    -- Every lesson, with this user's status against it.
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
