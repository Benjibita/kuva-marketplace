-- Order disputes (buyer → stored for admin + vendors on that order)
-- Vendor ratings (per vendor per order; public aggregate via RPC after 10 reviews)

CREATE TABLE public.order_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL CHECK (char_length(trim(message)) BETWEEN 20 AND 4000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT order_disputes_one_per_order UNIQUE (order_id)
);

CREATE INDEX idx_order_disputes_buyer_id ON public.order_disputes(buyer_id);
CREATE INDEX idx_order_disputes_order_id ON public.order_disputes(order_id);

ALTER TABLE public.order_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers read own order disputes"
  ON public.order_disputes FOR SELECT
  USING (buyer_id = auth.uid());

CREATE POLICY "Vendors read disputes for their customer orders"
  ON public.order_disputes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.order_items oi
      WHERE oi.order_id = order_disputes.order_id
        AND oi.vendor_id = auth.uid()
    )
  );

CREATE POLICY "Buyers insert dispute for own paid or delivered order"
  ON public.order_disputes FOR INSERT
  WITH CHECK (
    buyer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND o.buyer_id = auth.uid()
        AND o.status IN ('paid'::public.order_status, 'delivered'::public.order_status)
    )
  );

-- Ratings: one row per buyer / vendor / order (multi-vendor orders get multiple rows)
CREATE TABLE public.vendor_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stars SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment TEXT CHECK (comment IS NULL OR char_length(comment) <= 800),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT vendor_ratings_one_per_vendor_order_buyer UNIQUE (vendor_id, order_id, buyer_id)
);

CREATE INDEX idx_vendor_ratings_vendor_id ON public.vendor_ratings(vendor_id);
CREATE INDEX idx_vendor_ratings_order_id ON public.vendor_ratings(order_id);

ALTER TABLE public.vendor_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers read own vendor ratings"
  ON public.vendor_ratings FOR SELECT
  USING (buyer_id = auth.uid());

CREATE POLICY "Vendors read own ratings"
  ON public.vendor_ratings FOR SELECT
  USING (vendor_id = auth.uid());

CREATE POLICY "Buyers insert vendor rating when order fully delivered"
  ON public.vendor_ratings FOR INSERT
  WITH CHECK (
    buyer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND o.buyer_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.order_items oi
      WHERE oi.order_id = order_id
        AND oi.vendor_id = vendor_id
        AND oi.vendor_status = 'completed'
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.order_items oi2
      WHERE oi2.order_id = order_id
        AND (oi2.vendor_status IS DISTINCT FROM 'completed')
    )
  );

-- Public aggregate only (no comment leakage); average hidden until 10+ ratings
CREATE OR REPLACE FUNCTION public.public_vendor_rating_summary(p_vendor_id uuid)
RETURNS TABLE (rating_count bigint, average_stars numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*)::bigint AS rating_count,
    CASE
      WHEN COUNT(*) >= 10 THEN ROUND(AVG(stars::numeric), 2)
      ELSE NULL
    END AS average_stars
  FROM public.vendor_ratings
  WHERE vendor_id = p_vendor_id;
$$;

REVOKE ALL ON FUNCTION public.public_vendor_rating_summary(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_vendor_rating_summary(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.public_vendor_rating_summary(uuid) TO authenticated;

COMMENT ON TABLE public.order_disputes IS 'Buyer dispute / help requests tied to an order; visible to affected vendors.';
COMMENT ON TABLE public.vendor_ratings IS 'Post-fulfilment ratings; public average via public_vendor_rating_summary after 10 reviews.';
COMMENT ON FUNCTION public.public_vendor_rating_summary(uuid) IS 'Returns count and average star rating; average_stars is NULL until count >= 10.';
