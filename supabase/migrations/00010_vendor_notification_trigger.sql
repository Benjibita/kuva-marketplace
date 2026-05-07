-- Create unread vendor notifications when an order line is inserted (SECURITY DEFINER bypasses RLS insert lock)

CREATE OR REPLACE FUNCTION public.notify_vendor_on_order_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  product_title TEXT;
BEGIN
  SELECT title INTO product_title FROM products WHERE id = NEW.product_id;

  INSERT INTO vendor_notifications (
    vendor_id,
    order_id,
    type,
    status,
    message,
    email_sent
  ) VALUES (
    NEW.vendor_id,
    NEW.order_id,
    'order_placed',
    'unread',
    format(
      'New order: %s x%s',
      COALESCE(product_title, 'Item'),
      NEW.quantity::text
    ),
    FALSE
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_items_notify_vendor ON order_items;
CREATE TRIGGER trg_order_items_notify_vendor
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE PROCEDURE public.notify_vendor_on_order_item();
