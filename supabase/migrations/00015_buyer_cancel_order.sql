-- Buyer cancels order and restores inventory while all lines are still vendor_status = received.

CREATE OR REPLACE FUNCTION public.buyer_cancel_order_if_received(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  o orders%ROWTYPE;
  r order_items%ROWTYPE;
BEGIN
  SELECT * INTO o FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  IF o.buyer_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'not_buyer';
  END IF;

  IF o.status = 'cancelled'::order_status THEN
    RETURN;
  END IF;

  IF o.status IS DISTINCT FROM 'paid'::order_status THEN
    RAISE EXCEPTION 'order_not_cancellable';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM order_items oi
    WHERE oi.order_id = p_order_id
      AND oi.vendor_status IS DISTINCT FROM 'received'::vendor_order_status
  ) THEN
    RAISE EXCEPTION 'fulfillment_started';
  END IF;

  FOR r IN SELECT * FROM order_items WHERE order_id = p_order_id
  LOOP
    UPDATE products p
    SET
      stock = p.stock + r.quantity,
      size_inventory = CASE
        WHEN r.size IS NOT NULL AND p.use_size_variants THEN
          jsonb_set(
            COALESCE(p.size_inventory, '{}'::jsonb),
            ARRAY[r.size],
            to_jsonb(
              COALESCE((p.size_inventory ->> r.size)::integer, 0) + r.quantity
            ),
            true
          )
        ELSE p.size_inventory
      END,
      updated_at = NOW()
    WHERE p.id = r.product_id;
  END LOOP;

  UPDATE orders
  SET status = 'cancelled'::order_status, updated_at = NOW()
  WHERE id = p_order_id;
END;
$$;

COMMENT ON FUNCTION public.buyer_cancel_order_if_received(uuid) IS
  'Buyer-only: cancel paid order and restore product stock if every line is still received.';

REVOKE ALL ON FUNCTION public.buyer_cancel_order_if_received(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.buyer_cancel_order_if_received(uuid) TO authenticated;
