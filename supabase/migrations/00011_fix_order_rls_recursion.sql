-- Break RLS recursion between orders and order_items by routing the
-- cross-table existence checks through SECURITY DEFINER helpers.

CREATE OR REPLACE FUNCTION public.is_buyer_for_order(p_order_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM orders
    WHERE id = p_order_id
      AND buyer_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_vendor_for_order(p_order_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM order_items
    WHERE order_id = p_order_id
      AND vendor_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.product_vendor_id(p_product_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT vendor_id FROM products WHERE id = p_product_id;
$$;

REVOKE ALL ON FUNCTION public.is_buyer_for_order(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_vendor_for_order(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.product_vendor_id(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_buyer_for_order(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_vendor_for_order(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.product_vendor_id(uuid) TO authenticated;

-- order_items: buyer SELECT (replace recursive subquery)
DROP POLICY IF EXISTS "Users can view order items from their orders" ON order_items;
CREATE POLICY "Users can view order items from their orders" ON order_items
  FOR SELECT USING (public.is_buyer_for_order(order_id));

-- order_items: buyer INSERT (must own the order; vendor_id must match the product's true vendor)
DROP POLICY IF EXISTS "Buyers can insert order items for own orders" ON order_items;
CREATE POLICY "Buyers can insert order items for own orders" ON order_items
  FOR INSERT WITH CHECK (
    public.is_buyer_for_order(order_id)
    AND vendor_id = public.product_vendor_id(product_id)
  );

-- orders: vendor SELECT (replace recursive subquery)
DROP POLICY IF EXISTS "Vendors can read orders for their items" ON orders;
CREATE POLICY "Vendors can read orders for their items" ON orders
  FOR SELECT USING (public.is_vendor_for_order(id));
