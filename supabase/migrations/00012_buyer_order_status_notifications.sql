-- Per-item buyer indicator that the vendor changed the status

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS buyer_status_seen BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_order_items_buyer_status_unseen
  ON order_items(order_id) WHERE buyer_status_seen = FALSE;

-- Extend the existing vendor-update guard to also flip buyer_status_seen
-- to FALSE whenever the vendor changes the line's vendor_status
CREATE OR REPLACE FUNCTION public.order_items_vendor_update_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NOT NULL AND auth.uid() = OLD.vendor_id THEN
    NEW.order_id := OLD.order_id;
    NEW.product_id := OLD.product_id;
    NEW.quantity := OLD.quantity;
    NEW.price_per_unit := OLD.price_per_unit;
    NEW.sale_price_per_unit := OLD.sale_price_per_unit;
    NEW.size := OLD.size;
    NEW.created_at := OLD.created_at;
    NEW.vendor_id := OLD.vendor_id;

    IF NEW.vendor_status IS DISTINCT FROM OLD.vendor_status THEN
      NEW.vendor_status_updated_at := NOW();
      NEW.buyer_status_seen := FALSE;
    ELSE
      NEW.vendor_status_updated_at := OLD.vendor_status_updated_at;
      NEW.buyer_status_seen := OLD.buyer_status_seen;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- RPC for buyers to clear their own dots without granting them UPDATE on order_items
CREATE OR REPLACE FUNCTION public.mark_order_items_seen(p_order_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE order_items oi
  SET buyer_status_seen = TRUE
  FROM orders o
  WHERE oi.order_id = o.id
    AND o.buyer_id = auth.uid()
    AND oi.buyer_status_seen = FALSE
    AND (p_order_id IS NULL OR o.id = p_order_id);
END;
$$;

REVOKE ALL ON FUNCTION public.mark_order_items_seen(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_order_items_seen(uuid) TO authenticated;
