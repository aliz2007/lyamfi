ALTER TABLE public.portfolios ADD COLUMN IF NOT EXISTS cash numeric NOT NULL DEFAULT 100000;

CREATE TABLE public.portfolio_holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  ticker text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  avg_price numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (portfolio_id, ticker)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_holdings TO authenticated;
GRANT ALL ON public.portfolio_holdings TO service_role;
ALTER TABLE public.portfolio_holdings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own holdings" ON public.portfolio_holdings FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid()));

CREATE TABLE public.portfolio_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  ticker text NOT NULL,
  side text NOT NULL CHECK (side IN ('buy','sell')),
  quantity numeric NOT NULL,
  price numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_trades TO authenticated;
GRANT ALL ON public.portfolio_trades TO service_role;
ALTER TABLE public.portfolio_trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own trades" ON public.portfolio_trades FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid()));

CREATE TABLE public.portfolio_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT (now() AT TIME ZONE 'Africa/Casablanca')::date,
  value numeric NOT NULL,
  masi numeric,
  UNIQUE (portfolio_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_snapshots TO authenticated;
GRANT ALL ON public.portfolio_snapshots TO service_role;
ALTER TABLE public.portfolio_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own snapshots" ON public.portfolio_snapshots FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid()));