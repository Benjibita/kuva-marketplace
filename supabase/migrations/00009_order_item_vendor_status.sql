-- Per-line vendor fulfillment status (multi-vendor orders)

DO $$
BEGIN
  CREATE TYPE vendor_order_status AS ENUM ('received', 'dispatched', 'completed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS vendor_status vendor_order_status NOT NULL DEFAULT 'received',
  ADD COLUMN IF NOT EXISTS vendor_status_updated_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill vendor_id from product owner
UPDATE order_items oi
SET vendor_id = p.vendor_id
FROM products p
WHERE oi.product_id = p.id
  AND (oi.vendor_id IS NULL OR oi.vendor_id IS DISTINCT FROM p.vendor_id);

-- Fail loudly if orphaned rows exist (missing product)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM order_items WHERE vendor_id IS NULL) THEN
    RAISE EXCEPTION 'order_items contains rows without vendor_id after backfill; resolve orphaned product references before applying migration';
  END IF;
END $$;

ALTER TABLE order_items ALTER COLUMN vendor_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_vendor_id ON order_items(vendor_id);
CREATE INDEX IF NOT EXISTS idx_order_items_vendor_status_created ON order_items(vendor_id, vendor_status, created_at);

-- Buyers must be able to insert order lines during checkout
DROP POLICY IF EXISTS "Buyers can insert order items for own orders" ON order_items;
CREATE POLICY "Buyers can insert order items for own orders" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM orders o
      JOIN products p ON p.id = order_items.product_id
      WHERE o.id = order_items.order_id
        AND o.buyer_id = auth.uid()
        AND p.vendor_id = order_items.vendor_id
    )
  );

-- Vendors see and update only their own lines
DROP POLICY IF EXISTS "Vendors can view own order items" ON order_items;
CREATE POLICY "Vendors can view own order items" ON order_items
  FOR SELECT USING (auth.uid() = vendor_id);

DROP POLICY IF EXISTS "Vendors can update own order items" ON order_items;
CREATE POLICY "Vendors can update own order items" ON order_items
  FOR UPDATE USING (auth.uid() = vendor_id)
  WITH CHECK (auth.uid() = vendor_id);

-- Vendors can read parent orders that contain their items
DROP POLICY IF EXISTS "Vendors can read orders for their items" ON orders;
CREATE POLICY "Vendors can read orders for their items" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM order_items
      WHERE order_items.order_id = orders.id
        AND order_items.vendor_id = auth.uid()
    )
  );

-- When a vendor updates a line, only fulfillment fields may change (status + timestamp)
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
    ELSE
      NEW.vendor_status_updated_at := OLD.vendor_status_updated_at;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_items_vendor_guard ON order_items;
CREATE TRIGGER trg_order_items_vendor_guard
  BEFORE UPDATE ON order_items
  FOR EACH ROW
  EXECUTE PROCEDURE public.order_items_vendor_update_guard();
