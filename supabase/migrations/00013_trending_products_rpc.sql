-- Public-safe trending aggregates (order_items RLS hides rows from anon users).

CREATE OR REPLACE FUNCTION public.get_trending_product_ids(
  p_days int DEFAULT 7,
  p_limit int DEFAULT 48
)
RETURNS TABLE (
  product_id uuid,
  units_sold bigint,
  checkout_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    oi.product_id,
    SUM(oi.quantity)::bigint AS units_sold,
    COUNT(DISTINCT oi.order_id)::bigint AS checkout_count
  FROM order_items oi
  INNER JOIN orders o ON o.id = oi.order_id
  WHERE oi.created_at >= NOW() - make_interval(days => GREATEST(p_days, 1))
    AND o.status <> 'cancelled'::order_status
  GROUP BY oi.product_id
  ORDER BY units_sold DESC, checkout_count DESC
  LIMIT GREATEST(LEAST(p_limit, 200), 1);
$$;

COMMENT ON FUNCTION public.get_trending_product_ids(int, int) IS
  'Trending products by SUM(quantity) over recent order_items; excludes cancelled orders.';

REVOKE ALL ON FUNCTION public.get_trending_product_ids(int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_trending_product_ids(int, int) TO anon, authenticated;
