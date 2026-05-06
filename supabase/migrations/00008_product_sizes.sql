-- Product size variants and cart size selection support

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS use_size_variants BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS use_size_specific_prices BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS size_inventory JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS size_prices JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE cart_items
  ADD COLUMN IF NOT EXISTS selected_size TEXT;

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS size TEXT;

-- Ensure cart uniqueness includes size variant (or NULL for non-sized items)
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_product_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_items_user_product_size
  ON cart_items (user_id, product_id, COALESCE(selected_size, 'NO_SIZE'));
