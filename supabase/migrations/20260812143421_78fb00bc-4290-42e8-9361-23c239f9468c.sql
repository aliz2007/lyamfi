CREATE TABLE public.portfolio_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  ticker text NOT NULL,
  side text NOT NULL CHECK (side IN ('buy','sell')),
  quantity numeric NOT NULL CHECK (quantity > 0),
  limit_price numeric NOT NULL CHECK (limit_price > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','filled','cancelled')),
  filled_price numeric,
  filled_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_orders TO authenticated;
GRANT ALL ON public.portfolio_orders TO service_role;

ALTER TABLE public.portfolio_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own orders" ON public.portfolio_orders FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.portfolios p WHERE p.id = portfolio_orders.portfolio_id AND p.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.portfolios p WHERE p.id = portfolio_orders.portfolio_id AND p.user_id = auth.uid()));

CREATE INDEX portfolio_orders_portfolio_status_idx ON public.portfolio_orders (portfolio_id, status);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER update_portfolio_orders_updated_at
BEFORE UPDATE ON public.portfolio_orders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();